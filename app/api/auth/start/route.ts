import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';
import { normalizeEmail } from '@/lib/server/emailAuth';
import { createSignInCode } from '@/lib/server/auth/emailCodes';
import { isSameOriginRequest } from '@/lib/server/auth/requestGuards';
import { EmailDeliveryError, EmailProviderNotConfiguredError, getEmailProvider } from '@/lib/server/emailProvider';
import {
  CODE_REQUEST_EMAIL_LIMIT,
  CODE_REQUEST_IP_LIMIT,
  PostgresRateLimiter,
  extractClientIp,
} from '@/lib/server/rateLimit';
import { getCurrentUserIfPresent } from '@/lib/server/session';

// Auth/session redesign, Phase 3: step 1 of email sign-in — send a 6-digit
// code. Every outcome that depends on the email (has an account, doesn't,
// rate-limited) returns the SAME generic response, so this endpoint can never
// be used to discover which emails have accounts. Never creates a user row.
const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };
const GENERIC_RESPONSE = { ok: true, message: 'If that email can be used for an account, we’ve sent a sign-in code.' };
const UNAVAILABLE_BODY = { error: 'Sign-in is temporarily unavailable.' };

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 403, headers: NO_STORE_HEADERS });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: NO_STORE_HEADERS });
  }
  const email = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).email : undefined;
  if (typeof email !== 'string') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: NO_STORE_HEADERS });
  }
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const db = getDb();
  const emailLimiter = new PostgresRateLimiter(
    db,
    'auth-code:request:email',
    CODE_REQUEST_EMAIL_LIMIT.maxAttempts,
    CODE_REQUEST_EMAIL_LIMIT.windowMs,
  );
  const ipLimiter = new PostgresRateLimiter(db, 'auth-code:request:ip', CODE_REQUEST_IP_LIMIT.maxAttempts, CODE_REQUEST_IP_LIMIT.windowMs);
  const [emailAllowed, ipAllowed] = await Promise.all([emailLimiter.check(normalized), ipLimiter.check(extractClientIp(request))]);
  if (!emailAllowed || !ipAllowed) {
    // Identical to a real send — never a signal about the address.
    return NextResponse.json(GENERIC_RESPONSE, { headers: NO_STORE_HEADERS });
  }

  // The requesting browser's current identity (read-only — never creates one).
  // Only an anonymous identity can later be claimed, and only if the same
  // browser completes the sign-in (see lib/server/auth/signIn.ts).
  const browser = await getCurrentUserIfPresent();
  const claimUserId = browser && browser.email === null ? browser.id : null;
  const code = await createSignInCode(db, normalized, claimUserId);

  try {
    await getEmailProvider().sendSignInCodeEmail({ email: normalized, code });
  } catch (err) {
    if (err instanceof EmailProviderNotConfiguredError || err instanceof EmailDeliveryError) {
      return NextResponse.json(UNAVAILABLE_BODY, { status: 503, headers: NO_STORE_HEADERS });
    }
    throw err;
  }

  return NextResponse.json(GENERIC_RESPONSE, { headers: NO_STORE_HEADERS });
}
