// Thin cookie-I/O wrapper around identity.ts's pure token logic (Prompt
// 26, Phase 2). This is the one place that actually reads/writes the
// HTTP-only session cookie — everything security-relevant about WHO the
// token identifies happens in identity.ts, which this file does not
// duplicate.
//
// IMPORTANT: `cookies().set()` may only be called from a Server Action or
// a Route Handler (a Next.js rule, not one invented here) — calling
// getCurrentUser() from a plain Server Component render will throw. This
// module is not called from anywhere in this task (Prompt 26, Phase 9:
// nothing is wired into a route yet), so it is intentionally exercised by
// Prompt 27's route wiring rather than by this repo's unit tests — the
// pure logic it wraps (token hashing, lookup, creation) IS fully unit
// tested in identity.test.ts, which is the part that actually decides
// access.
import { cookies } from 'next/headers';
import { getDb } from './db';
import { getOrCreateUser, type User } from './identity';

const SESSION_COOKIE = 'tg_uid';
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
export function getCurrentUser(): User {
  const store = cookies();
  const existingToken = store.get(SESSION_COOKIE)?.value ?? null;
  const { user, token, isNew } = getOrCreateUser(getDb(), existingToken);

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
