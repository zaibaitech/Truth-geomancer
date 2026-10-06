import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';
import { normalizeEmail } from '@/lib/server/emailAuth';
import { consumeSignInCode } from '@/lib/server/auth/emailCodes';
import { completeEmailSignIn } from '@/lib/server/auth/signIn';
import { isSameOriginRequest } from '@/lib/server/auth/requestGuards';
import { switchBrowserToSession } from '@/lib/server/emailSession';
import { CODE_VERIFY_EMAIL_LIMIT, CODE_VERIFY_IP_LIMIT, PostgresRateLimiter, extractClientIp } from '@/lib/server/rateLimit';
import { getCurrentUserIfPresent } from '@/lib/server/session';
import { safeReturnTo } from '@/lib/auth/returnTo';
import { clearPendingChallengeCookie } from '@/lib/server/auth/pendingChallenge';

// Auth/session redesign, Phase 3: step 2 of email sign-in — check the 6-digit
// code and, if it is right, switch THIS browser to the verified account.
// Every failure (wrong, expired, used, superseded, too many tries, unknown
// email) is the same generic message, so nothing about the account leaks.
// The code is only ever read from the POST body.
const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };
const INVALID = { ok: false, error: 'That code is incorrect or has expired. Check the latest email, or send a new code.' };

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 403, headers: NO_STORE_HEADERS });
  }
  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (typeof parsed !== 'object' || parsed === null) throw new Error('not an object');
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400, headers: NO_STORE_HEADERS });
  }
  const normalized = typeof body.email === 'string' ? normalizeEmail(body.email) : null;
  const code = typeof body.code === 'string' ? body.code.replace(/\s+/g, '') : '';
  if (!normalized || !/^\d{6}$/.test(code)) {
    return NextResponse.json(INVALID, { status: 400, headers: NO_STORE_HEADERS });
  }

  const db = getDb();
  const ipLimiter = new PostgresRateLimiter(db, 'auth-code:verify:ip', CODE_VERIFY_IP_LIMIT.maxAttempts, CODE_VERIFY_IP_LIMIT.windowMs);
  const emailLimiter = new PostgresRateLimiter(
    db,
    'auth-code:verify:email',
    CODE_VERIFY_EMAIL_LIMIT.maxAttempts,
    CODE_VERIFY_EMAIL_LIMIT.windowMs,
  );
  const [ipAllowed, emailAllowed] = await Promise.all([ipLimiter.check(extractClientIp(request)), emailLimiter.check(normalized)]);
  if (!ipAllowed || !emailAllowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many attempts. Please wait a while, then send a new code.' },
      { status: 429, headers: NO_STORE_HEADERS },
    );
  }

  const browser = await getCurrentUserIfPresent();
  const browserUserId = browser?.id ?? null;

  const outcome = await db.transaction(async (tx) => {
    const verified = await consumeSignInCode(tx, normalized, code);
    if (!verified.ok) return { ok: false as const, reason: 'invalid' as const };
    const signIn = await completeEmailSignIn(tx, {
      normalizedEmail: normalized,
      browserUserId,
      claimAllowed: browserUserId !== null && verified.claimUserId === browserUserId,
      method: 'email-code',
    });
    if (!signIn.ok) return { ok: false as const, reason: 'duplicate-account' as const };
    return { ok: true as const, sessionToken: signIn.sessionToken };
  });

  if (!outcome.ok) {
    if (outcome.reason === 'duplicate-account') {
      return NextResponse.json(
        { ok: false, error: 'We can’t sign you in automatically — please contact us so we can sort out your account.' },
        { status: 409, headers: NO_STORE_HEADERS },
      );
    }
    return NextResponse.json(INVALID, { status: 400, headers: NO_STORE_HEADERS });
  }

  await switchBrowserToSession(outcome.sessionToken);
  clearPendingChallengeCookie();
  return NextResponse.json(
    { ok: true, redirectTo: safeReturnTo(typeof body.returnTo === 'string' ? body.returnTo : null) },
    { headers: NO_STORE_HEADERS },
  );
}
