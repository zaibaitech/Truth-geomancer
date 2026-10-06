// LEGACY BREAK-GLASS ADMIN ACCESS (shared secret).
//
// Day-to-day administration now goes through a normal signed-in user with a
// staff role (lib/server/staff.ts, resolved by lib/server/adminActor.ts). This
// module keeps the original TG_ADMIN_SECRET login working as an emergency
// path during the transition, until a platform admin account exists and has
// been verified. It is isolated here and grants platform-admin authority only
// via adminActor.ts's resolveAdminActor().
//
// Hardening (auth/staff redesign): the cookie is `__Host-tg_admin` in
// production (Secure, Path=/, no Domain); the old `tg_admin` name is still
// read so sessions issued before this change keep working until they expire.
// Logout deletes the server-side row, and the login route is rate-limited.
import { cookies } from 'next/headers';
import { getDb } from './db';
import { createAdminSession, generateAdminToken, isAdminToken, revokeAdminSession, verifyAdminSecret } from './adminAuth';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ADMIN_COOKIE = IS_PRODUCTION ? '__Host-tg_admin' : 'tg_admin';
const LEGACY_ADMIN_COOKIE = 'tg_admin';
const ADMIN_SESSION_SECONDS = 12 * 60 * 60; // 12 hours — shorter-lived than the user session cookie

function adminCookieOptions(maxAge: number) {
  return { httpOnly: true, secure: IS_PRODUCTION, sameSite: 'lax' as const, path: '/', maxAge };
}

function readAdminToken(): string | null {
  const store = cookies();
  return store.get(ADMIN_COOKIE)?.value ?? store.get(LEGACY_ADMIN_COOKIE)?.value ?? null;
}

/** Verifies `secret` against TG_ADMIN_SECRET and, on success, creates a
 * fresh break-glass session and sets its cookie. Returns whether login
 * succeeded; "wrong secret" and "no secret configured" both simply fail. */
export async function loginAdmin(secret: string): Promise<boolean> {
  if (!verifyAdminSecret(secret)) return false;
  const token = generateAdminToken();
  await createAdminSession(getDb(), token);
  cookies().set(ADMIN_COOKIE, token, adminCookieOptions(ADMIN_SESSION_SECONDS));
  return true;
}

/** Whether this request carries a valid, unexpired break-glass session. Never
 * inferred from email, a query parameter, a header or any client value — only
 * from a cookie whose token hashes to a fresh admin_sessions row. */
export async function isBreakGlassAdminSession(): Promise<boolean> {
  return isAdminToken(getDb(), readAdminToken());
}

/** Ends the break-glass session server-side and clears its cookie(s). */
export async function logoutAdmin(): Promise<void> {
  await revokeAdminSession(getDb(), readAdminToken());
  const store = cookies();
  store.set(ADMIN_COOKIE, '', adminCookieOptions(0));
  if (LEGACY_ADMIN_COOKIE !== ADMIN_COOKIE) store.set(LEGACY_ADMIN_COOKIE, '', adminCookieOptions(0));
}
