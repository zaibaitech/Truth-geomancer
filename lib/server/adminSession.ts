// Thin cookie-I/O wrapper around adminAuth.ts's pure token logic (Prompt
// 28, Phase 7) — mirrors session.ts's own split between pure logic and
// cookie I/O. `cookies().set()` may only be called from a Route
// Handler/Server Action, so loginAdmin() must only be called from one (the
// admin login route is the one caller). requireAdmin() is read-only and
// safe to call from any server context, including admin Server Component
// pages.
import { cookies } from 'next/headers';
import { getDb } from './db';
import { createAdminSession, generateAdminToken, isAdminToken, verifyAdminSecret } from './adminAuth';

const ADMIN_COOKIE = 'tg_admin';
const ADMIN_SESSION_SECONDS = 12 * 60 * 60; // 12 hours — shorter-lived than the anonymous user session cookie

/** Verifies `secret` against TG_ADMIN_SECRET and, on success, creates a
 * fresh admin session and sets its cookie. Returns whether login succeeded.
 * Never distinguishes "wrong secret" from "no secret configured" in its
 * return value or any observable timing beyond verifyAdminSecret's own
 * constant-time comparison — both simply fail. */
export function loginAdmin(secret: string): boolean {
  if (!verifyAdminSecret(secret)) return false;
  const token = generateAdminToken();
  createAdminSession(getDb(), token);
  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_SECONDS,
  });
  return true;
}

/** The one function an admin route/page should call to decide "is this
 * request admin-authorized". Never inferred from email, localStorage, a
 * query parameter, or any client-supplied value — only from a cookie whose
 * value hashes to a real, fresh row in admin_sessions. */
export function isCurrentUserAdmin(): boolean {
  const token = cookies().get(ADMIN_COOKIE)?.value ?? null;
  return isAdminToken(getDb(), token);
}

/** The reviewer identity recorded on an approved/rejected PaymentRequest.
 * This architecture supports exactly ONE administrator identity (a single
 * configured secret) — there is no admin roster, no name, no email, so a
 * fixed literal is the honest value rather than inventing per-session
 * "admin #2"-style identifiers that would imply a multi-admin system that
 * does not exist. Returns null when the caller is not admin-authorized. */
export function currentAdminReviewerId(): string | null {
  return isCurrentUserAdmin() ? 'admin' : null;
}

export function logoutAdmin(): void {
  cookies().delete(ADMIN_COOKIE);
}
