// Server-side sessions (auth/session redesign, Phase 1).
//
// One `sessions` row per signed-in browser. A user may have many, and each is
// independent: creating a session on another device never invalidates this
// one, and revoking this one (logout) never touches the others. This replaces
// the original design, where `users.session_token_hash` held exactly ONE
// token per account — so every new login silently signed every other device
// out, which was the root cause of the "this device has its own separate
// session" dead end.
//
// Pure database-and-token functions with no Next.js dependency, mirroring the
// existing identity.ts / session.ts split: the cookie I/O lives in session.ts.
//
// SECURITY
// - The token is 256 bits of CSPRNG output (identity.ts generateSessionToken).
//   Only its SHA-256 is stored, so a database read never yields a usable
//   session credential.
// - Expiry is enforced HERE, server-side, on every lookup — never by trusting
//   the cookie's own Max-Age. Idle timeout: SESSION_IDLE_TIMEOUT_MS (sliding,
//   extended at most once per SESSION_SLIDE_INTERVAL_MS). Absolute lifetime:
//   SESSION_ABSOLUTE_LIFETIME_MS from creation, never extended.
// - Revocation (logout) is a server-side write: a revoked token is rejected
//   even if a copy of the cookie survives anywhere.
//
// LEGACY MIGRATION
// Cookies issued before this table existed are hashed in
// users.session_token_hash. resolveSession() still accepts them: on first
// sight the hash is moved into a `sessions` row (kind 'legacy', same token,
// so the browser's cookie keeps working unchanged) and the users column is
// replaced with an unusable placeholder, so the old single-token path can
// never be used again for that user. No backfill, no forced logout.
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Db } from './db';

/** A session not used for this long expires (sliding). */
export const SESSION_IDLE_TIMEOUT_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
/** No session lives longer than this from its creation, however active. */
export const SESSION_ABSOLUTE_LIFETIME_MS = 365 * 24 * 60 * 60 * 1000; // 1 year
/** The sliding expiry (and last_used_at) is written at most this often. */
export const SESSION_SLIDE_INTERVAL_MS = 24 * 60 * 60 * 1000; // 1 day
/** Grace lifetime given to a legacy cookie when it is migrated. */
export const LEGACY_MIGRATION_LIFETIME_MS = SESSION_ABSOLUTE_LIFETIME_MS;

export type SessionKind = 'anonymous' | 'email' | 'legacy';

export interface SessionUser {
  id: string;
  email: string | null;
  createdAt: string;
  lastSeenAt: string;
}

export interface ResolvedSession {
  sessionId: string;
  kind: SessionKind;
  user: SessionUser;
}

interface SessionJoinRow {
  session_id: string;
  kind: SessionKind;
  last_used_at: string;
  expires_at: string;
  absolute_expires_at: string;
  revoked_at: string | null;
  user_id: string;
  email: string | null;
  user_created_at: string;
  last_seen_at: string;
}

interface LegacyUserRow {
  id: string;
  email: string | null;
  created_at: string;
  last_seen_at: string;
}

/** SHA-256 hex of a session token — the only form ever stored. */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** A value for users.session_token_hash (NOT NULL UNIQUE, kept for backward
 * compatibility) that can never equal the SHA-256 hex of any token: it is
 * not 64 hex characters. Used for every user created after this redesign and
 * for every legacy user once their cookie has been migrated. */
export function retiredLegacyHash(): string {
  return `retired:${randomBytes(24).toString('hex')}`;
}

function iso(ms: number): string {
  return new Date(ms).toISOString();
}

/** Creates an independent session for `userId` and returns the RAW token to
 * set as the cookie (only its hash is stored). Never touches any other
 * session of this user. */
export async function createSession(
  db: Db,
  userId: string,
  kind: SessionKind,
  token: string,
  now: number = Date.now(),
): Promise<{ sessionId: string }> {
  const sessionId = randomUUID();
  await db.execute(
    `INSERT INTO sessions (id, user_id, token_hash, kind, created_at, last_used_at, expires_at, absolute_expires_at, revoked_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      sessionId,
      userId,
      hashSessionToken(token),
      kind,
      iso(now),
      iso(now),
      iso(now + SESSION_IDLE_TIMEOUT_MS),
      iso(now + SESSION_ABSOLUTE_LIFETIME_MS),
    ],
  );
  return { sessionId };
}

/** Moves a still-valid legacy cookie (hash in users.session_token_hash) into
 * a `sessions` row, keeping the same token. Returns the user, or null if the
 * token is not a legacy token. Race-safe: two concurrent first requests both
 * end up resolving the same single session row. */
async function migrateLegacySession(db: Db, tokenHash: string, now: number): Promise<ResolvedSession | null> {
  const legacy = await db.queryOne<LegacyUserRow>(
    'SELECT id, email, created_at, last_seen_at FROM users WHERE session_token_hash = ?',
    [tokenHash],
  );
  // Not (or no longer) a legacy token. A concurrent request may have just
  // migrated it — re-read the sessions row rather than reporting "no
  // session", which would hand this browser a brand-new identity.
  if (!legacy) return lookup(db, tokenHash, now);

  await db.transaction(async (tx) => {
    await tx.execute(
      `INSERT INTO sessions (id, user_id, token_hash, kind, created_at, last_used_at, expires_at, absolute_expires_at, revoked_at)
       VALUES (?, ?, ?, 'legacy', ?, ?, ?, ?, NULL)
       ON CONFLICT (token_hash) DO NOTHING`,
      [
        randomUUID(),
        legacy.id,
        tokenHash,
        iso(now),
        iso(now),
        iso(now + SESSION_IDLE_TIMEOUT_MS),
        iso(now + LEGACY_MIGRATION_LIFETIME_MS),
      ],
    );
    // Retire the single-token column so this token is only ever accepted via
    // its (revocable, expiring) sessions row from now on.
    await tx.execute('UPDATE users SET session_token_hash = ? WHERE id = ? AND session_token_hash = ?', [
      retiredLegacyHash(),
      legacy.id,
      tokenHash,
    ]);
  });

  return lookup(db, tokenHash, now);
}

async function lookup(db: Db, tokenHash: string, now: number): Promise<ResolvedSession | null> {
  const row = await db.queryOne<SessionJoinRow>(
    `SELECT s.id AS session_id, s.kind, s.last_used_at, s.expires_at, s.absolute_expires_at, s.revoked_at,
            u.id AS user_id, u.email, u.created_at AS user_created_at, u.last_seen_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?`,
    [tokenHash],
  );
  if (!row) return null;
  if (row.revoked_at) return null;
  if (Date.parse(row.expires_at) <= now) return null;
  if (Date.parse(row.absolute_expires_at) <= now) return null;

  // Sliding idle expiry, written at most once per interval so an ordinary
  // page view is not a database write.
  if (now - Date.parse(row.last_used_at) >= SESSION_SLIDE_INTERVAL_MS) {
    const nextExpiry = Math.min(now + SESSION_IDLE_TIMEOUT_MS, Date.parse(row.absolute_expires_at));
    await db.execute('UPDATE sessions SET last_used_at = ?, expires_at = ? WHERE id = ? AND revoked_at IS NULL', [
      iso(now),
      iso(nextExpiry),
      row.session_id,
    ]);
  }

  return {
    sessionId: row.session_id,
    kind: row.kind,
    user: { id: row.user_id, email: row.email, createdAt: row.user_created_at, lastSeenAt: row.last_seen_at },
  };
}

/** The live session (and its user) for a raw cookie token, or null when the
 * token is unknown, revoked or expired. This is the trust boundary for
 * identity: nothing resolves a user except through a matching stored hash. */
export async function resolveSession(db: Db, token: string, now: number = Date.now()): Promise<ResolvedSession | null> {
  if (!token) return null;
  const tokenHash = hashSessionToken(token);
  const found = await lookup(db, tokenHash, now);
  if (found) return found;
  // Only a token with no sessions row at all can be a legacy one; a revoked
  // or expired session row must never fall through to the legacy path. If a
  // row exists now, a concurrent request migrated it since the lookup above:
  // re-check it (lookup still rejects a revoked or expired row).
  const exists = await db.queryOne<{ id: string }>('SELECT id FROM sessions WHERE token_hash = ?', [tokenHash]);
  if (exists) return lookup(db, tokenHash, now);
  return migrateLegacySession(db, tokenHash, now);
}

/** Server-side logout for ONE browser: revokes exactly the session this token
 * belongs to (and, for a never-migrated legacy token, retires it). Every other
 * session of the same user is untouched. Idempotent. */
export async function revokeSessionByToken(db: Db, token: string, now: number = Date.now()): Promise<void> {
  if (!token) return;
  const tokenHash = hashSessionToken(token);
  await db.execute('UPDATE sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL', [iso(now), tokenHash]);
  await db.execute('UPDATE users SET session_token_hash = ? WHERE session_token_hash = ?', [retiredLegacyHash(), tokenHash]);
}

/** Every unrevoked, unexpired session for a user (for tests and a future
 * "signed-in devices" screen). Never returns a token or a hash. */
export async function listActiveSessions(
  db: Db,
  userId: string,
  now: number = Date.now(),
): Promise<Array<{ id: string; kind: SessionKind; createdAt: string; lastUsedAt: string }>> {
  const rows = await db.query<{
    id: string;
    kind: SessionKind;
    created_at: string;
    last_used_at: string;
    expires_at: string;
    absolute_expires_at: string;
  }>('SELECT id, kind, created_at, last_used_at, expires_at, absolute_expires_at FROM sessions WHERE user_id = ? AND revoked_at IS NULL', [
    userId,
  ]);
  return rows
    .filter((r) => Date.parse(r.expires_at) > now && Date.parse(r.absolute_expires_at) > now)
    .map((r) => ({ id: r.id, kind: r.kind, createdAt: r.created_at, lastUsedAt: r.last_used_at }));
}
