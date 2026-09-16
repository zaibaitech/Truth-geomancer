// Server-only identity logic (Prompt 26, Phase 2). Deliberately has no
// dependency on Next.js request/response machinery — every function here
// is a plain, synchronous function of a database handle and, where
// needed, an explicit token string. This keeps the actual security-
// relevant logic (does this token belong to a real, stored user?) fully
// unit-testable without mocking a Next.js request. The thin HTTP-cookie
// wrapper that calls these functions from a real request lives in
// session.ts.
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Db } from './db';

export interface User {
  id: string;
  email: string | null;
  createdAt: string;
  lastSeenAt: string;
}

interface UserRow {
  id: string;
  session_token_hash: string;
  email: string | null;
  created_at: string;
  last_seen_at: string;
}

function rowToUser(row: UserRow): User {
  return { id: row.id, email: row.email, createdAt: row.created_at, lastSeenAt: row.last_seen_at };
}

/** SHA-256 of the session token, hex-encoded. The database stores only
 * this hash, never the raw token — mirrors how a password or API key
 * would be stored, so a database read (backup, leak, admin query) never
 * yields a value that is itself usable as a session credential. */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** 256 bits of cryptographic randomness, base64url-encoded. This is the
 * ONLY thing that ever identifies a session to the server — unguessable
 * by construction, which is what makes "the browser cannot simply set
 * userId=paid-user" true: an attacker-chosen value will not hash-match
 * any stored user, so it is indistinguishable from having no session at
 * all (see getOrCreateUser below). */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Looks up the user owning this exact token. Returns null for a missing,
 * unknown, or tampered token. This function is the entire trust boundary
 * for identity: nothing anywhere in this codebase resolves a user from a
 * caller-supplied id — only from a token that must match a stored hash. */
export async function getUserByToken(db: Db, token: string): Promise<User | null> {
  const row = await db.queryOne<UserRow>('SELECT * FROM users WHERE session_token_hash = ?', [hashToken(token)]);
  return row ? rowToUser(row) : null;
}

export async function createAnonymousUser(db: Db, token: string): Promise<User> {
  const now = new Date().toISOString();
  const id = randomUUID();
  await db.execute('INSERT INTO users (id, session_token_hash, email, created_at, last_seen_at) VALUES (?, ?, NULL, ?, ?)', [
    id,
    hashToken(token),
    now,
    now,
  ]);
  return { id, email: null, createdAt: now, lastSeenAt: now };
}

export async function touchLastSeen(db: Db, userId: string): Promise<string> {
  const now = new Date().toISOString();
  await db.execute('UPDATE users SET last_seen_at = ? WHERE id = ?', [now, userId]);
  return now;
}

export interface ResolvedIdentity {
  user: User;
  /** The token to persist as the session cookie value. Identical to the
   * input `token` when an existing user was found; freshly generated when
   * a new anonymous user was created. */
  token: string;
  isNew: boolean;
}

/** Resolve-or-create: given a token read from the session cookie (or
 * `null`/unknown if absent or invalid), returns the existing user or
 * creates a fresh anonymous one. This is the ANONYMOUS IDENTITY described
 * in lib/access/README.md — it grants no entitlement by itself and
 * carries no personal data (the optional `email` column exists for a
 * future real-account upgrade path, never populated by this function). */
export async function getOrCreateUser(db: Db, token: string | null): Promise<ResolvedIdentity> {
  if (token) {
    const existing = await getUserByToken(db, token);
    if (existing) {
      const lastSeenAt = await touchLastSeen(db, existing.id);
      return { user: { ...existing, lastSeenAt }, token, isNew: false };
    }
  }
  const newToken = generateSessionToken();
  const user = await createAnonymousUser(db, newToken);
  return { user, token: newToken, isNew: true };
}

// --- Prompt 46: additive support for persistent (email-verified) identity ---
// Everything below is new; nothing above this line was changed. These
// functions are the ONLY places that ever read/write users.email or
// rotate users.session_token_hash outside of anonymous-user creation —
// lib/server/emailAuth.ts (the login-token/verification logic) calls into
// these rather than writing SQL against `users` directly, keeping this
// file the single owner of the users table's shape, exactly as before.

/** All users whose (already-normalized) email exactly matches. Returns
 * more than one row only if legacy/duplicate data already exists — see
 * lib/server/emailAuth.ts's resolveUserForVerifiedEmail, which is the
 * only caller and which explicitly refuses to guess in that case rather
 * than picking one. Never called with anything except an
 * already-normalizeEmail()-processed value. */
export async function findUsersByEmail(db: Db, normalizedEmail: string): Promise<User[]> {
  const rows = await db.query<UserRow>('SELECT * FROM users WHERE email = ? ORDER BY created_at ASC', [normalizedEmail]);
  return rows.map(rowToUser);
}

/** Attaches a verified email to an EXISTING users row — never creates a
 * new one. This is the "claim" step: an anonymous user who verifies an
 * email with no prior account keeps their exact same id, so every
 * entitlement/payment_request/preview_usage row already tied to it is
 * untouched. */
export async function attachEmailToUser(db: Db, userId: string, normalizedEmail: string): Promise<void> {
  await db.execute('UPDATE users SET email = ? WHERE id = ?', [normalizedEmail, userId]);
}

/** Creates a brand-new user whose email is already verified — used only
 * when a magic link is verified and NEITHER an existing account for that
 * email NOR a claimable anonymous identity exists (a person with no prior
 * visit at all). This is the one legitimate "new users.id" case: it never
 * happens merely because a login link was requested (see emailAuth.ts). */
export async function createUserWithEmail(db: Db, token: string, normalizedEmail: string): Promise<User> {
  const now = new Date().toISOString();
  const id = randomUUID();
  await db.execute('INSERT INTO users (id, session_token_hash, email, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?)', [
    id,
    hashToken(token),
    normalizedEmail,
    now,
    now,
  ]);
  return { id, email: normalizedEmail, createdAt: now, lastSeenAt: now };
}

/** Issues a fresh session token for an EXISTING user id and makes it the
 * only valid token for that row (session_token_hash is a single UNIQUE
 * column per user, so this intentionally supersedes any token that
 * previously matched this row — see the Prompt 46 report's "known
 * limitation" note on single-active-session-per-account). Returns the raw
 * token to set as the session cookie's value; only the hash is stored. */
export async function rotateSessionToken(db: Db, userId: string): Promise<string> {
  const token = generateSessionToken();
  const now = new Date().toISOString();
  await db.execute('UPDATE users SET session_token_hash = ?, last_seen_at = ? WHERE id = ?', [hashToken(token), now, userId]);
  return token;
}
