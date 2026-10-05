import { NextResponse } from 'next/server';
import { getDb } from '@/lib/server/db';
import { consumeLoginToken } from '@/lib/server/emailAuth';
import { switchBrowserToSession } from '@/lib/server/emailSession';
import { isSameOriginRequest } from '@/lib/server/auth/requestGuards';
import { PostgresRateLimiter, VERIFY_IP_LIMIT, extractClientIp } from '@/lib/server/rateLimit';
import { getCurrentUserIfPresent } from '@/lib/server/session';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

// Magic-link fallback (auth/session redesign).
//
// GET — what the emailed link opens. It NO LONGER consumes the token: email
// security scanners and link previewers fetch links automatically, which used
// to burn the single-use token before the person ever clicked ("link already
// used"), and a bare GET that signs a browser in is also a login-CSRF vector.
// Instead it redirects to the /auth/confirm page with the token moved into
// the URL FRAGMENT (#token=…): a fragment is never sent to any server, never
// appears in access logs, and is never included in a Referer header. The
// page asks the person to confirm, then POSTs the token below.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') ?? '';
  const confirm = new URL('/auth/confirm', url.origin);
  if (token && /^[A-Za-z0-9_-]{20,100}$/.test(token)) confirm.hash = `token=${token}`;
  return NextResponse.redirect(confirm, { status: 303, headers: { ...NO_STORE_HEADERS, 'Referrer-Policy': 'no-referrer' } });
}

// POST — consume the token and switch THIS browser to the verified account.
// Rate-limited per IP; the token is the entire trust boundary (random,
// hashed at rest, single-use, 15-minute TTL). The presenting browser's
// anonymous records are only claimed when it is the same browser that
// requested the link (see consumeLoginToken).
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, reason: 'invalid' }, { status: 403, headers: NO_STORE_HEADERS });
  }
  const db = getDb();
  const ipLimiter = new PostgresRateLimiter(db, 'verify:ip', VERIFY_IP_LIMIT.maxAttempts, VERIFY_IP_LIMIT.windowMs);
  if (!(await ipLimiter.check(extractClientIp(request)))) {
    return NextResponse.json({ ok: false, reason: 'rate-limited' }, { status: 429, headers: NO_STORE_HEADERS });
  }

  let token = '';
  try {
    const body = (await request.json()) as Record<string, unknown>;
    token = typeof body?.token === 'string' ? body.token : '';
  } catch {
    token = '';
  }
  if (!token) return NextResponse.json({ ok: false, reason: 'missing-token' }, { status: 400, headers: NO_STORE_HEADERS });

  const browser = await getCurrentUserIfPresent();
  const result = await consumeLoginToken(db, token, browser?.id ?? null);
  if (!result.ok) {
    return NextResponse.json({ ok: false, reason: result.reason }, { status: 400, headers: NO_STORE_HEADERS });
  }

  await switchBrowserToSession(result.sessionToken);
  return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
}
