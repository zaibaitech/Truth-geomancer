// Server-only persistent (email-verified) identity logic (Prompt 46).
// Mirrors lib/server/identity.ts's and lib/server/adminAuth.ts's existing
// shape deliberately: pure, database-and-token functions with no Next.js
// request/response dependency, fully unit-testable without mocking a real
// request — the thin cookie-I/O wrapper lives in lib/server/emailSession.ts,
// exactly as identity.ts/session.ts are already split.
//
// The single hardest requirement this file exists to satisfy: a login
// must NEVER create a new users.id for an account that should already
// exist, and must NEVER silently merge two different users just because
// their email strings match. See resolveUserForVerifiedEmail and
// consumeLoginToken's own comments for exactly how that is enforced.
import { createHash, randomBytes } from 'node:crypto';
import type { Db } from './db';
import {
  attachEmailToUser,
  createUserWithEmail,
  findUsersByEmail,
  generateSessionToken,
  rotateSessionToken,
} from './identity';

const LOGIN_TOKEN_TTL_MS = 15 * 60 * 1000; // ~15 minutes, per Prompt 46 §5

/** SHA-256 of the login token, hex-encoded — the database stores only
 * this, never the raw token, mirroring identity.ts's hashToken and
 * adminAuth.ts's hashAdminToken. Deliberately its own, independent
 * function rather than importing either of those: this codebase's
 * existing convention (see adminAuth.ts's own comment, "independent
 * table") is that each trust domain owns its own token construction, so a
 * bug or future change in one can never silently affect another. */
function hashLoginToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** 256 bits of cryptographic randomness, base64url-encoded — same
 * construction as identity.ts's generateSessionToken() and
 * adminAuth.ts's generateAdminToken(), independent instance. */
export function generateLoginToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Normalizes an email address for identity comparison and storage:
 * trims surrounding whitespace and lowercases it. Deliberately does
 * NOT perform provider-specific rewriting (Gmail dot-removal,
 * plus-address stripping, etc.) — those change what mailbox a string
 * actually refers to, which is not this function's job and would make
 * "the email you typed" silently different from "the email that's on
 * file," an honesty problem this codebase's existing conventions
 * (e.g. never inventing data — see lib/access/README.md) avoid elsewhere.
 * Returns null for empty/obviously-invalid input rather than throwing,
 * so a caller can treat "invalid" as one more ordinary case to handle.
 */
export function normalizeEmail(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.length === 0) return null;
  // Deliberately simple: one '@', a non-empty local part, a domain part
  // containing at least one '.', no whitespace. This is a basic shape
  // check, not full RFC 5322 validation — the magic link itself is the
  // real proof the address is reachable and correct.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
}

/** Creates a fresh, single-use login token tied to `normalizedEmail`.
 * `claimUserId` is the REQUESTING device's current anonymous users.id, if
 * it has one (read via getCurrentUserIfPresent() by the caller — this
 * function never reads cookies itself) — captured at REQUEST time,
 * precisely because verification may happen on a different device (an
 * email link is often opened from a different device/app than the one
 * that requested it), so the "which identity should this claim" decision
 * cannot be re-derived from whatever cookie happens to be present when
 * the link is clicked. Never creates a users row itself. */
export async function createLoginToken(db: Db, normalizedEmail: string, claimUserId: string | null): Promise<string> {
  const token = generateLoginToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LOGIN_TOKEN_TTL_MS);
  await db.execute(
    'INSERT INTO email_login_tokens (token_hash, user_id, email, created_at, expires_at, used_at) VALUES (?, ?, ?, ?, ?, NULL)',
    [hashLoginToken(token), claimUserId, normalizedEmail, now.toISOString(), expiresAt.toISOString()],
  );
  return token;
}

export type ResolveResult =
  | { kind: 'none' }
  | { kind: 'one'; userId: string }
  | { kind: 'conflict'; count: number };

/**
 * Determines whether `normalizedEmail` already belongs to an existing
 * account — and, critically, NEVER guesses when more than one row already
 * has it (production data for users.email has not been verified as
 * duplicate-free; see the Prompt 44/45 audit trail). A caller MUST treat
 * `conflict` as "cannot safely authenticate automatically," never as
 * "pick the first/oldest/newest one."
 */
export async function resolveUserForVerifiedEmail(db: Db, normalizedEmail: string): Promise<ResolveResult> {
  const matches = await findUsersByEmail(db, normalizedEmail);
  if (matches.length === 0) return { kind: 'none' };
  if (matches.length === 1) return { kind: 'one', userId: matches[0].id };
  return { kind: 'conflict', count: matches.length };
}

export type ConsumeResult =
  | { ok: true; userId: string; sessionToken: string }
  | { ok: false; reason: 'not-found' | 'expired' | 'used' | 'conflict' | 'already-linked' };

interface LoginTokenRow {
  token_hash: string;
  user_id: string | null;
  email: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
}

/**
 * Verifies and atomically consumes a raw login token, then resolves and
 * returns the AUTHENTICATED users.id and a fresh session token bound to
 * it. Runs entirely inside db.transaction() (the same SERIALIZABLE-
 * isolation-with-retry abstraction every other multi-step write in this
 * codebase already uses — see lib/server/paymentRequests.ts's
 * approvePaymentRequest) so two concurrent requests for the same token
 * can never both succeed: the loser observes `used_at` already set (after
 * the transaction retries against the winner's committed write) and gets
 * `used`, never a second authenticated session.
 *
 * This function NEVER calls getCurrentUser() or reads any cookie — the
 * token itself is the entire trust boundary, exactly like identity.ts's
 * getUserByToken() is for anonymous sessions and adminAuth.ts's
 * isAdminToken() is for admin sessions. The caller (the verify Route
 * Handler) is responsible for setting the returned sessionToken as the
 * session cookie; this function only ever returns it as a value.
 */
export async function consumeLoginToken(db: Db, rawToken: string): Promise<ConsumeResult> {
  return db.transaction(async (tx) => {
    const hash = hashLoginToken(rawToken);
    const row = await tx.queryOne<LoginTokenRow>('SELECT * FROM email_login_tokens WHERE token_hash = ?', [hash]);
    if (!row) return { ok: false, reason: 'not-found' } as const;
    if (row.used_at) return { ok: false, reason: 'used' } as const;
    if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: 'expired' } as const;

    // Mark used BEFORE resolving identity, and on every subsequent
    // branch (success or not) — a token is spent by one verification
    // attempt regardless of its outcome, so a conflict/already-linked
    // result can never be retried into a different outcome by resending
    // the same link.
    await tx.execute('UPDATE email_login_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL', [
      new Date().toISOString(),
      hash,
    ]);

    if (row.user_id) {
      // Claim path: this token was requested from a device that already
      // had an anonymous identity. Never attach if that identity already
      // has a DIFFERENT verified email on file — that would silently
      // sever its real prior link rather than preserve it.
      const [claimTarget] = await tx.query<{ id: string; email: string | null }>('SELECT id, email FROM users WHERE id = ?', [
        row.user_id,
      ]);
      if (!claimTarget) return { ok: false, reason: 'not-found' } as const;
      if (claimTarget.email && claimTarget.email !== row.email) {
        return { ok: false, reason: 'already-linked' } as const;
      }
      const resolved = await resolveUserForVerifiedEmail(tx, row.email);
      if (resolved.kind === 'conflict') return { ok: false, reason: 'conflict' } as const;
      if (resolved.kind === 'one' && resolved.userId !== row.user_id) {
        // The email is already claimed by a DIFFERENT existing account —
        // never silently reattach it to this device's anonymous id.
        return { ok: false, reason: 'conflict' } as const;
      }
      if (!claimTarget.email) {
        await attachEmailToUser(tx, row.user_id, row.email);
      }
      const sessionToken = await rotateSessionToken(tx, row.user_id);
      return { ok: true, userId: row.user_id, sessionToken } as const;
    }

    // No anonymous identity was present when this link was requested.
    const resolved = await resolveUserForVerifiedEmail(tx, row.email);
    if (resolved.kind === 'conflict') return { ok: false, reason: 'conflict' } as const;
    if (resolved.kind === 'one') {
      const sessionToken = await rotateSessionToken(tx, resolved.userId);
      return { ok: true, userId: resolved.userId, sessionToken } as const;
    }
    // Genuinely new person: no prior anonymous identity, no existing
    // account for this email. Exactly one new users row, created only
    // now — after email ownership is proven — never at request time.
    const sessionToken = generateSessionToken();
    const user = await createUserWithEmail(tx, sessionToken, row.email);
    return { ok: true, userId: user.id, sessionToken } as const;
  });
}
