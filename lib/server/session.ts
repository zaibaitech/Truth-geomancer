// Thin cookie-I/O wrapper around identity.ts's pure token logic (Prompt
// 26, Phase 2). This is the one place that actually reads/writes the
// HTTP-only session cookie — everything security-relevant about WHO the
// token identifies happens in identity.ts, which this file does not
// duplicate.
//
// IMPORTANT: `cookies().set()` may only be called from a Server Action or
// a Route Handler (a Next.js rule, not one invented here) — getCurrentUser()
// below relies on that write and so must only ever be called from a Route
// Handler/Server Action (the chapter-content API route is the one caller).
// Prompt 27 also needs an access check from plain Server Component page
// renders (the book reader, the practice pages), which cannot write a
// cookie — those call getCurrentUserIfPresent() instead, a read-only
// counterpart that never creates a user or a cookie. See its own comment
// for why returning null for "no cookie yet" is exact, not an
// approximation. The pure logic both wrap (token hashing, lookup,
// creation) is fully unit tested in identity.test.ts, which is the part
// that actually decides access; this file's own cookie-I/O is exercised
// by the Prompt 27 real-server verification pass (see the final report)
// rather than a unit test, since it needs a real Next.js request context
// to run at all.
import { cookies } from 'next/headers';
import { getDb } from './db';
import { getOrCreateUser, getUserByToken, touchLastSeen, type User } from './identity';

// AUTH/SESSION REDESIGN (Phase 1) — cookie naming.
//
// Production uses the `__Host-` prefix: the browser then REQUIRES Secure,
// Path=/ and no Domain attribute, so the session can only ever be set by,
// and sent to, the exact canonical host (truthgeomancer.com) — never a
// sibling subdomain, and never over plain HTTP. Local development (plain
// http://localhost) cannot satisfy Secure, so it uses the same name without
// the prefix. The token inside is opaque, HttpOnly, never JS-readable, and
// never placed in localStorage/sessionStorage/URLs.
//
// LEGACY: cookies issued before this redesign are named `tg_uid`. They are
// still read (and their token still works — see lib/server/sessions.ts's
// legacy migration). Route handlers re-issue such a token under the new name
// and delete the old cookie, so a browser converges on exactly one cookie.
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const SESSION_COOKIE = IS_PRODUCTION ? '__Host-tg_session' : 'tg_session';
export const LEGACY_SESSION_COOKIE = 'tg_uid';
/** Browser-side lifetime; the server enforces its own (shorter-or-equal)
 * idle and absolute expiry on every request (lib/server/sessions.ts). */
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  };
}

/** The raw session token this request carries, if any, and whether it came
 * from the legacy cookie name. Read-only. */
export function readSessionToken(): { token: string; legacyName: boolean } | null {
  const store = cookies();
  const current = store.get(SESSION_COOKIE)?.value;
  if (current) return { token: current, legacyName: false };
  const legacy = store.get(LEGACY_SESSION_COOKIE)?.value;
  if (legacy) return { token: legacy, legacyName: true };
  return null;
}

/** Sets the session cookie (Route Handler / Server Action only) and removes
 * any legacy-named copy, so exactly one session cookie ever exists. */
export function setSessionCookie(token: string): void {
  const store = cookies();
  store.set(SESSION_COOKIE, token, cookieOptions());
  if (store.get(LEGACY_SESSION_COOKIE)) store.delete(LEGACY_SESSION_COOKIE);
}

/** Removes every session cookie name this app has ever used (logout).
 * Expired with the SAME attributes it was set with: a browser ignores a
 * `__Host-` Set-Cookie that lacks Secure, so a bare delete() (which sends no
 * Secure) would leave the cookie in place. */
export function clearSessionCookies(): void {
  const store = cookies();
  store.set(SESSION_COOKIE, '', { ...cookieOptions(), maxAge: 0 });
  store.set(LEGACY_SESSION_COOKIE, '', { ...cookieOptions(), maxAge: 0 });
}

/** Resolves the current request's user from its session cookie, creating
 * a fresh anonymous user (and setting a fresh cookie) if none exists yet.
 * Route Handlers / Server Actions only (it may write a cookie).
 *
 * The cookie value is an opaque, high-entropy token, never a user id. An
 * edited or unknown value resolves to no session (never to someone else) and
 * a new anonymous identity is created — see identity.ts getOrCreateUser. */
export async function getCurrentUser(): Promise<User> {
  const existing = readSessionToken();
  const { user, token, isNew } = await getOrCreateUser(getDb(), existing?.token ?? null);

  // New identity, no cookie yet, or a still-valid token under the legacy
  // name: (re)issue it under the current name.
  if (isNew || !existing || existing.legacyName) setSessionCookie(token);

  return user;
}

/** Read-only counterpart to getCurrentUser(), safe to call from a plain
 * Server Component render (which cannot write cookies). Returns null when
 * there is no valid session — never creates a user or a cookie. */
export async function getCurrentUserIfPresent(): Promise<User | null> {
  const existing = readSessionToken();
  if (!existing) return null;
  const db = getDb();
  const user = await getUserByToken(db, existing.token);
  if (!user) return null;
  const lastSeenAt = await touchLastSeen(db, user.id);
  return { ...user, lastSeenAt };
}
