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
import { getDb } from './db';
import { clearSessionCookies, getCurrentUserIfPresent, readSessionToken, setSessionCookie } from './session';
import { revokeSessionByToken } from './sessions';
import { catchUpPriorClaims } from './auth/claim';

/** Sets the session cookie to `sessionToken` — the raw token
 * consumeLoginToken() returned. Only callable from a Route Handler/Server
 * Action (the same Next.js rule session.ts's getCurrentUser() already
 * documents); the magic-link verify route is the one caller. */
export function setAuthenticatedSessionCookie(sessionToken: string): void {
  setSessionCookie(sessionToken);
}

/** Server-side logout for THIS browser (auth/session redesign): revokes the
 * session row behind the presented cookie — so a copied cookie stops working
 * too — then clears the cookie. Every other device's session is untouched.
 * Never deletes the users row or anything attached to it. */
export async function revokeCurrentSession(): Promise<void> {
  const current = readSessionToken();
  if (current) await revokeSessionByToken(getDb(), current.token);
  clearSessionCookies();
}

/** Completes a sign-in for THIS browser: revokes whatever session the
 * browser held before (an anonymous one, or a different account's), then sets
 * the new session cookie. The new token always comes fresh from the sign-in
 * itself, so a pre-login token can never be fixated into an authenticated
 * session. */
export async function switchBrowserToSession(newSessionToken: string): Promise<void> {
  const previous = readSessionToken();
  if (previous && previous.token !== newSessionToken) await revokeSessionByToken(getDb(), previous.token);
  setSessionCookie(newSessionToken);
}

/** Clears the cookie only (kept for callers that have already revoked). */
export function clearSessionCookie(): void {
  clearSessionCookies();
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

/** For a signed-in account, picks up anything that reached one of its
 * previously-claimed anonymous identities after the claim (a Paystack payment
 * completing later grants to the anonymous id it was started under, by
 * design). No-op for anonymous visitors. Never returns any identifier. */
export async function catchUpCurrentAccount(): Promise<void> {
  const user = await getCurrentUserIfPresent();
  if (!user || !user.email) return;
  const db = getDb();
  await db.transaction((tx) => catchUpPriorClaims(tx, user.id));
}
