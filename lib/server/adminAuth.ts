// Server-only admin identity (Prompt 28, Phase 7). Mirrors identity.ts's
// own shape deliberately: a caller proves possession of a secret, gets back
// a high-entropy random token, and the database stores only a SHA-256 hash
// of that token — never the token itself, never the underlying secret.
//
// The underlying secret is TG_ADMIN_SECRET, a server-only environment
// variable — not the publicly-exposed variable prefix Next.js reserves for
// browser-bundle values, never read by client code, never returned in any
// response body. This repository's .env/.env.local are gitignored and
// Next.js only exposes that specially-prefixed subset of env vars to the
// browser bundle, so a plain process.env.TG_ADMIN_SECRET read here is
// exactly the "server-only configured administrator secret" Prompt 28
// Phase 7 allows.
//
// If TG_ADMIN_SECRET is never configured, verifyAdminSecret() always
// returns false — fail CLOSED, not open. There is no default secret and no
// bypass: an unconfigured deployment simply has no way to become admin,
// which is the correct behavior (never a fake/always-true admin check).
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Db } from './db';

const ADMIN_SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours — see adminSession.ts

function hashAdminToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** 256 bits of cryptographic randomness, base64url-encoded — same
 * construction as identity.ts's generateSessionToken(), independent table. */
export function generateAdminToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Constant-time comparison against the server-only TG_ADMIN_SECRET.
 * Returns false (never throws, never grants) if the env var is unset, or
 * if the submitted secret has a different length — comparing buffers of
 * different lengths is rejected before timingSafeEqual (which requires
 * equal-length inputs) rather than by throwing, so a length mismatch
 * itself never distinguishes "close" from "far" guesses via a crash. */
export function verifyAdminSecret(secret: string): boolean {
  const configured = process.env.TG_ADMIN_SECRET;
  if (!configured) return false;
  // Compare fixed-length digests so neither the result nor the timing
  // depends on (or reveals) the configured secret's length.
  const a = createHash('sha256').update(configured).digest();
  const b = createHash('sha256').update(secret).digest();
  return timingSafeEqual(a, b);
}

export async function createAdminSession(db: Db, token: string): Promise<void> {
  await db.execute('INSERT INTO admin_sessions (token_hash, created_at) VALUES (?, ?)', [
    hashAdminToken(token),
    new Date().toISOString(),
  ]);
}

/** Looks up whether `token` hashes to a real, still-fresh admin session.
 * Fresh means created within ADMIN_SESSION_MAX_AGE_MS — checked here on the
 * server, not only via the cookie's own maxAge, so a copied/replayed
 * cookie value cannot outlive the intended session length even if a
 * client's own cookie-expiry handling is bypassed. */
export async function isAdminToken(db: Db, token: string | null): Promise<boolean> {
  if (!token) return false;
  const tokenHash = hashAdminToken(token);
  const row = await db.queryOne<{ created_at: string }>('SELECT created_at FROM admin_sessions WHERE token_hash = ?', [tokenHash]);
  if (!row) return false;
  const age = Date.now() - new Date(row.created_at).getTime();
  if (age >= 0 && age <= ADMIN_SESSION_MAX_AGE_MS) return true;
  // Expired: never usable again, and not left behind in the table.
  await db.execute('DELETE FROM admin_sessions WHERE token_hash = ?', [tokenHash]);
  return false;
}

/** Server-side logout for a break-glass admin session: the row is deleted, so
 * a copied cookie stops working immediately (not merely when it expires). */
export async function revokeAdminSession(db: Db, token: string | null): Promise<void> {
  if (!token) return;
  await db.execute('DELETE FROM admin_sessions WHERE token_hash = ?', [hashAdminToken(token)]);
}
