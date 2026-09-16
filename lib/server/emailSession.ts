// Thin cookie-I/O wrapper around emailAuth.ts's pure token logic (Prompt
// 46), mirroring the existing split in lib/server/session.ts (anonymous
// identity) and lib/server/adminSession.ts (admin identity). This is the
// ONLY file that sets or clears the session cookie for an
// email-authenticated login — it deliberately reuses session.ts's own
// SESSION_COOKIE ('tg_uid') rather than introducing a second cookie: an
// authenticated login is not a different KIND of session from the
// existing anonymous one, it is the SAME session mechanism now pointing
// at a users.id that also has a verified email — see the Prompt 46
// report's "Session Handling" section for why this was preferred over a
// new, parallel cookie.
import { cookies } from 'next/headers';
import { getDb } from './db';
import { getCurrentUserIfPresent } from './session';
import { SESSION_COOKIE } from './session';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Sets the session cookie to `sessionToken` — the raw token
 * consumeLoginToken() returned. Only callable from a Route Handler/Server
 * Action (the same Next.js rule session.ts's getCurrentUser() already
 * documents); the magic-link verify route is the one caller. */
export function setAuthenticatedSessionCookie(sessionToken: string): void {
  cookies().set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
  });
}

/** Clears the session cookie (logout). Never deletes the users row, never
 * touches entitlements/payment_requests/preview_usage — the account and
 * every record attached to its users.id are untouched. The browser
 * reverts to ordinary anonymous-identity behavior on its next request
 * (getCurrentUser() in session.ts creates a fresh anonymous user exactly
 * as it already does for any visitor with no cookie), per the existing,
 * unmodified architecture. */
export function clearSessionCookie(): void {
  cookies().delete(SESSION_COOKIE);
}

export interface AuthenticatedUserStatus {
  authenticated: boolean;
  /** Present only when authenticated — never a userId, a token, or any
   * other internal identifier, so this is always safe to return directly
   * to client code (see the Prompt 46 report's UI-exposure requirement). */
  email: string | null;
}

/** Read-only status check, safe to call from any server context — never
 * creates a user or a cookie (it only ever reads via
 * getCurrentUserIfPresent(), the same read-only counterpart
 * lib/server/session.ts already documents as the correct choice wherever
 * an anonymous visitor should never be silently upgraded into a fresh
 * database row just for a status check). "Authenticated" here means
 * specifically "this session's user has a verified email on file" — an
 * anonymous user with no email is reported as not authenticated, even
 * though they do have a users.id and may already hold entitlements. */
export async function getAuthenticatedUser(): Promise<AuthenticatedUserStatus> {
  const user = await getCurrentUserIfPresent();
  if (!user || !user.email) return { authenticated: false, email: null };
  return { authenticated: true, email: user.email };
}

// Re-exported so callers of this module never need to also import
// lib/server/db directly just to pass a Db into emailAuth.ts's functions.
export { getDb };
