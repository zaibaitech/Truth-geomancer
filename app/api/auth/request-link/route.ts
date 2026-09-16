import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';
import { createLoginToken, normalizeEmail } from '@/lib/server/emailAuth';
import { EmailDeliveryError, EmailProviderNotConfiguredError, getEmailProvider } from '@/lib/server/emailProvider';
import { PostgresRateLimiter, REQUEST_LINK_EMAIL_LIMIT, REQUEST_LINK_IP_LIMIT, extractClientIp } from '@/lib/server/rateLimit';
import { getCurrentUserIfPresent } from '@/lib/server/session';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };
// Prompt 46 §14: identical response for "email has an account", "email
// has no account", and "email is currently rate-limited" — never a
// signal an attacker could use to enumerate real accounts.
const GENERIC_RESPONSE = { message: 'If that email can be used for an account, a sign-in link has been sent.' };
// A generic 503 for every config/delivery failure below — deliberately the
// SAME wording and status for "no provider/origin configured" and "the
// provider rejected the send", so neither ever leaks provider-specific
// detail. A fresh NextResponse.json(...) call is made from this object at
// each return site (Response bodies are single-use streams — the same
// pattern GENERIC_RESPONSE below already uses, never a pre-built
// NextResponse reused across requests).
const UNAVAILABLE_BODY = { error: 'Sign-in is temporarily unavailable.' };

/** Thrown when production has no trusted application origin configured.
 * See resolveAppOrigin()'s own comment. */
class AppOriginNotConfiguredError extends Error {
  constructor() {
    super('APP_BASE_URL is not configured for production magic-link delivery.');
    this.name = 'AppOriginNotConfiguredError';
  }
}

/** The origin used to build the magic-link URL (Prompt 52 §8). Deliberately
 * NEVER derived from the incoming request's Host header in production —
 * that header is client-supplied and, depending on how a request reaches
 * this function, could be spoofed to redirect a magic link to an
 * attacker-controlled origin. APP_BASE_URL is a trusted,
 * operator-configured Vercel environment variable, required in
 * production and validated to be HTTPS; local dev keeps deriving the
 * origin from the request itself so `next dev` needs no extra setup. */
function resolveAppOrigin(request: Request): string {
  const configured = process.env.APP_BASE_URL;
  if (configured) {
    if (process.env.NODE_ENV === 'production' && !configured.startsWith('https://')) {
      throw new AppOriginNotConfiguredError();
    }
    return configured.replace(/\/+$/, '');
  }
  if (process.env.NODE_ENV === 'production') throw new AppOriginNotConfiguredError();
  return new URL(request.url).origin;
}

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

  // Resolved and validated BEFORE any database write, so a misconfigured
  // origin never leaves behind an unusable email_login_tokens row.
  let origin: string;
  try {
    origin = resolveAppOrigin(request);
  } catch (err) {
    if (err instanceof AppOriginNotConfiguredError) {
      return NextResponse.json(UNAVAILABLE_BODY, { status: 503, headers: NO_STORE_HEADERS });
    }
    throw err;
  }

  const db = getDb();
  const emailRateLimiter = new PostgresRateLimiter(
    db,
    'request-link:email',
    REQUEST_LINK_EMAIL_LIMIT.maxAttempts,
    REQUEST_LINK_EMAIL_LIMIT.windowMs,
  );
  const ipRateLimiter = new PostgresRateLimiter(
    db,
    'request-link:ip',
    REQUEST_LINK_IP_LIMIT.maxAttempts,
    REQUEST_LINK_IP_LIMIT.windowMs,
  );
  const ip = extractClientIp(request);
  const [emailAllowed, ipAllowed] = await Promise.all([emailRateLimiter.check(normalized), ipRateLimiter.check(ip)]);
  if (!emailAllowed || !ipAllowed) {
    // Same generic body as a real success — see GENERIC_RESPONSE's comment.
    return NextResponse.json(GENERIC_RESPONSE, { headers: NO_STORE_HEADERS });
  }

  const existingSession = await getCurrentUserIfPresent();
  const token = await createLoginToken(db, normalized, existingSession?.id ?? null);

  // The token itself is the single-use credential — never the email
  // address, a user id, or any entitlement/payment detail (Prompt 52 §8).
  const loginUrl = `${origin}/api/auth/verify?token=${token}`;

  try {
    await getEmailProvider().sendMagicLinkEmail({ email: normalized, loginUrl });
  } catch (err) {
    if (err instanceof EmailProviderNotConfiguredError || err instanceof EmailDeliveryError) {
      // A configuration/delivery failure, not a per-email failure — safe
      // to report distinctly since it reveals nothing about any specific
      // address. The token created above remains valid and unused (see
      // emailProvider.ts's own comment on this deliberately-unchanged
      // token lifecycle) — it simply expires after 15 minutes like any
      // other unused token if the recipient never receives the email.
      return NextResponse.json(UNAVAILABLE_BODY, { status: 503, headers: NO_STORE_HEADERS });
    }
    throw err;
  }

  return NextResponse.json(GENERIC_RESPONSE, { headers: NO_STORE_HEADERS });
}
