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

// Exported (Prompt 46) so lib/server/emailAuth.ts's session-cookie I/O can
// set the SAME cookie a freshly-authenticated login rotates the value of,
// rather than introducing a second, parallel "logged in" cookie — see that
// file's own comment on why reusing this exact mechanism was preferred
// over adding a new one.
export const SESSION_COOKIE = 'tg_uid';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Resolves the current request's user from its session cookie, creating
 * a fresh anonymous user (and setting a fresh cookie) if none exists yet.
 *
 * The cookie value is an opaque, high-entropy token — never the
 * database's own user id — set:
 *   - `httpOnly: true`  — unreadable and unwritable by page JavaScript,
 *     so an XSS bug cannot steal or forge it via `document.cookie`.
 *   - `secure` in production — never sent over plain HTTP.
 *   - `sameSite: 'lax'` — sent on top-level navigation, not on a
 *     cross-site form/script request, which blocks the simplest
 *     CSRF-style abuse of this cookie.
 *
 * A visitor CAN still edit this cookie's value by hand in their own
 * browser's dev tools. That is expected, and harmless: an edited value
 * that doesn't hash-match any stored user is simply treated as "no
 * session" (see identity.ts's getOrCreateUser) — never as someone else's
 * identity. There is no way to set a cookie value that grants an
 * entitlement: entitlements live in a separate database table keyed by
 * the server-assigned user id, which the client never sees or controls,
 * and which this function never derives from anything the client sent
 * except by successful hash lookup.
 */
export async function getCurrentUser(): Promise<User> {
  const store = cookies();
  const existingToken = store.get(SESSION_COOKIE)?.value ?? null;
  const { user, token, isNew } = await getOrCreateUser(getDb(), existingToken);

  if (isNew || !existingToken) {
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ONE_YEAR_SECONDS,
    });
  }

  return user;
}

/** Read-only counterpart to getCurrentUser(), safe to call from a plain
 * Server Component page render — which Next.js forbids from writing a
 * cookie at all, so getCurrentUser()'s store.set() call would throw
 * there. This function never calls it: it only ever reads the existing
 * cookie and, if present, looks up (never creates) the matching user.
 *
 * Returning null for "no session cookie yet" is exact, not an
 * approximation: the ONLY way a real user acquires anything worth
 * checking access for is through a flow (a purchase/grant endpoint) that
 * is necessarily a Route Handler or Server Action — see
 * security.test.ts's "client cannot grant or revoke entitlements" suite —
 * and any such flow already persists a session cookie via
 * getCurrentUser() before or while granting. So a visitor with no cookie
 * at all has, by construction, no entitlement to find, and a Server
 * Component gating on `getCurrentUserIfPresent() === null` behaves
 * identically to one that could create-and-check a fresh anonymous user,
 * without needing to write a cookie it structurally cannot write.
 */
export async function getCurrentUserIfPresent(): Promise<User | null> {
  const token = cookies().get(SESSION_COOKIE)?.value ?? null;
  if (!token) return null;
  const db = getDb();
  const user = await getUserByToken(db, token);
  if (!user) return null;
  const lastSeenAt = await touchLastSeen(db, user.id);
  return { ...user, lastSeenAt };
}
