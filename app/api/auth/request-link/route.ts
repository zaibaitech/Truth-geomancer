import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';
import { createLoginToken, normalizeEmail } from '@/lib/server/emailAuth';
import { EmailProviderNotConfiguredError, getEmailProvider } from '@/lib/server/emailProvider';
import { InMemoryRateLimiter } from '@/lib/server/rateLimit';
import { getCurrentUserIfPresent } from '@/lib/server/session';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };
// Prompt 46 §14: identical response for "email has an account", "email
// has no account", and "email is currently rate-limited" — never a
// signal an attacker could use to enumerate real accounts.
const GENERIC_RESPONSE = { message: 'If that email can be used for an account, a sign-in link has been sent.' };

// Prompt 46 §15: NOT production-grade — see lib/server/rateLimit.ts's own
// caveat about in-memory state under Vercel's serverless model. Present
// so the request/response shape and call sites are already correct for a
// real limiter to be dropped in later.
const emailRateLimiter = new InMemoryRateLimiter(5, 60 * 60 * 1000);
const ipRateLimiter = new InMemoryRateLimiter(20, 60 * 60 * 1000);

// The ONLY route that creates an email_login_tokens row. Deliberately
// never calls getCurrentUser() (which would auto-create an anonymous
// user) — only the read-only getCurrentUserIfPresent(), so requesting a
// link is never itself a way to create a database row for a visitor who
// doesn't already have one (Prompt 46 §4/§7's explicit requirement).
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: NO_STORE_HEADERS });
  }
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: NO_STORE_HEADERS });
  }
  const { email } = body as Record<string, unknown>;
  if (typeof email !== 'string') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const normalized = normalizeEmail(email);
  if (!normalized) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const [emailAllowed, ipAllowed] = await Promise.all([emailRateLimiter.check(normalized), ipRateLimiter.check(ip)]);
  if (!emailAllowed || !ipAllowed) {
    // Same generic body as a real success — see GENERIC_RESPONSE's comment.
    return NextResponse.json(GENERIC_RESPONSE, { headers: NO_STORE_HEADERS });
  }

  const existingSession = await getCurrentUserIfPresent();
  const db = getDb();
  const token = await createLoginToken(db, normalized, existingSession?.id ?? null);

  const origin = new URL(request.url).origin;
  const loginUrl = `${origin}/api/auth/verify?token=${token}`;

  try {
    await getEmailProvider().sendMagicLinkEmail({ email: normalized, loginUrl });
  } catch (err) {
    if (err instanceof EmailProviderNotConfiguredError) {
      // A configuration failure, not a per-email failure — safe to report
      // distinctly since it reveals nothing about any specific address.
      return NextResponse.json(
        { error: 'Sign-in is temporarily unavailable.' },
        { status: 503, headers: NO_STORE_HEADERS },
      );
    }
    throw err;
  }

  return NextResponse.json(GENERIC_RESPONSE, { headers: NO_STORE_HEADERS });
}
