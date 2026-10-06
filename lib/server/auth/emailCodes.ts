// 6-digit email sign-in codes (auth/session redesign, Phase 3).
//
// The primary email sign-in: the user types the code into the SAME screen
// that asked for it, so sign-in never depends on an email link opening in the
// right browser (an iOS home-screen app and Safari keep separate cookies; an
// email app's in-app browser is yet another jar).
//
// SECURITY
// - Generated with crypto.randomInt (CSPRNG), uniformly over 000000-999999.
// - Never stored raw: a salted scrypt hash. A 6-digit space is small, so a
//   plain SHA-256 could be reversed instantly from a leaked row; scrypt (N=2^14)
//   makes exhausting it take hours per row, far beyond the 10-minute lifetime.
// - Single use, expires after CODE_TTL_MS, invalidated after
//   MAX_ATTEMPTS_PER_CODE wrong guesses, and superseded the moment a newer
//   code is issued for the same email — so at most one code is ever live.
// - Never placed in a URL and never logged in production (the dev console
//   provider prints it to the developer's own terminal only).
// - Request/verify rate limits (database-backed PostgresRateLimiter) live in
//   the route handlers; see CODE_* limits in lib/server/rateLimit.ts.
// - Responses never reveal whether an email has an account: issuing a code
//   for an unknown email is identical to issuing one for a known email.
import { randomBytes, randomInt, randomUUID, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { Db } from '../db';

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number, options: object) => Promise<Buffer>;

export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_ATTEMPTS_PER_CODE = 5;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 32;

export function generateSignInCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

async function hashCode(code: string, salt: Buffer): Promise<string> {
  return (await scrypt(code, salt, KEY_LENGTH, SCRYPT_OPTIONS)).toString('hex');
}

/** A freshly issued code plus the OPAQUE id of its challenge row. The id is a
 * random UUID that identifies "this pending sign-in" so a page can resume it
 * after a refresh; it is not derived from, and reveals nothing about, the code. */
export interface SignInChallenge {
  /** The RAW code — for the email body only. Never store or return it. */
  code: string;
  challengeId: string;
  expiresAt: number;
}

/** Issues a fresh code for `normalizedEmail`, superseding any earlier unused
 * one, and returns the RAW code (for the email body only) with its challenge
 * id and expiry. `claimUserId` is the requesting browser's anonymous
 * users.id, if any — used later to decide whether that browser's anonymous
 * records may be claimed. */
export async function createSignInChallenge(
  db: Db,
  normalizedEmail: string,
  claimUserId: string | null,
  now: number = Date.now(),
): Promise<SignInChallenge> {
  const code = generateSignInCode();
  const salt = randomBytes(16);
  const codeHash = await hashCode(code, salt);
  const challengeId = randomUUID();
  const expiresAt = now + CODE_TTL_MS;
  await db.transaction(async (tx) => {
    await tx.execute(
      'UPDATE email_verification_codes SET superseded_at = ? WHERE email = ? AND used_at IS NULL AND superseded_at IS NULL',
      [new Date(now).toISOString(), normalizedEmail],
    );
    await tx.execute(
      `INSERT INTO email_verification_codes (id, email, code_hash, code_salt, claim_user_id, created_at, expires_at, used_at, superseded_at, attempts)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, 0)`,
      [challengeId, normalizedEmail, codeHash, salt.toString('hex'), claimUserId, new Date(now).toISOString(), new Date(expiresAt).toISOString()],
    );
  });
  return { code, challengeId, expiresAt };
}

/** Same as createSignInChallenge, returning only the raw code. */
export async function createSignInCode(
  db: Db,
  normalizedEmail: string,
  claimUserId: string | null,
  now: number = Date.now(),
): Promise<string> {
  return (await createSignInChallenge(db, normalizedEmail, claimUserId, now)).code;
}

/** Whether a challenge is still usable. Read-only; never touches `attempts`.
 *   'pending'  — live: unused, not superseded, not expired, attempts left
 *   'expired'  — expired, spent, superseded (e.g. by a newer code) or locked
 *   'unknown'  — no such row */
export async function getChallengeState(
  db: Db,
  challengeId: string,
  normalizedEmail: string,
  now: number = Date.now(),
): Promise<{ state: 'pending' | 'expired'; expiresAt: number } | { state: 'unknown' }> {
  const row = await db.queryOne<{ expires_at: string; used_at: string | null; superseded_at: string | null; attempts: number }>(
    'SELECT expires_at, used_at, superseded_at, attempts FROM email_verification_codes WHERE id = ? AND email = ?',
    [challengeId, normalizedEmail],
  );
  if (!row) return { state: 'unknown' };
  const expiresAt = Date.parse(row.expires_at);
  const live = row.used_at === null && row.superseded_at === null && expiresAt > now && Number(row.attempts) < MAX_ATTEMPTS_PER_CODE;
  return { state: live ? 'pending' : 'expired', expiresAt };
}

interface CodeRow {
  id: string;
  code_hash: string;
  code_salt: string;
  claim_user_id: string | null;
  expires_at: string;
  attempts: number;
}

export type VerifyCodeResult = { ok: true; claimUserId: string | null } | { ok: false; reason: 'invalid' };

/** Checks `code` against the single live code for `normalizedEmail`. Every
 * failure is the same generic 'invalid' (wrong, expired, used, superseded,
 * too many attempts, or no code at all) so nothing about the account leaks.
 * On success the code is spent. MUST run inside the caller's transaction so
 * the spend and the sign-in commit together. */
export async function consumeSignInCode(
  tx: Db,
  normalizedEmail: string,
  code: string,
  now: number = Date.now(),
): Promise<VerifyCodeResult> {
  if (!/^\d{6}$/.test(code)) return { ok: false, reason: 'invalid' };

  const row = await tx.queryOne<CodeRow>(
    `SELECT id, code_hash, code_salt, claim_user_id, expires_at, attempts FROM email_verification_codes
      WHERE email = ? AND used_at IS NULL AND superseded_at IS NULL
      ORDER BY created_at DESC LIMIT 1`,
    [normalizedEmail],
  );
  if (!row) return { ok: false, reason: 'invalid' };
  if (Date.parse(row.expires_at) <= now || Number(row.attempts) >= MAX_ATTEMPTS_PER_CODE) {
    return { ok: false, reason: 'invalid' };
  }

  // Count the attempt BEFORE comparing, so a guess is always spent.
  const attempts = Number(row.attempts) + 1;
  await tx.execute('UPDATE email_verification_codes SET attempts = ? WHERE id = ?', [attempts, row.id]);

  const candidate = Buffer.from(await hashCode(code, Buffer.from(row.code_salt, 'hex')), 'hex');
  const stored = Buffer.from(row.code_hash, 'hex');
  const matches = candidate.length === stored.length && timingSafeEqual(candidate, stored);

  if (!matches) {
    if (attempts >= MAX_ATTEMPTS_PER_CODE) {
      await tx.execute('UPDATE email_verification_codes SET superseded_at = ? WHERE id = ?', [new Date(now).toISOString(), row.id]);
    }
    return { ok: false, reason: 'invalid' };
  }

  await tx.execute('UPDATE email_verification_codes SET used_at = ? WHERE id = ? AND used_at IS NULL', [
    new Date(now).toISOString(),
    row.id,
  ]);
  return { ok: true, claimUserId: row.claim_user_id };
}
