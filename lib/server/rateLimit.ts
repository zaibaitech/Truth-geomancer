// Server-only rate-limit abstraction (Prompt 46; Postgres-backed
// implementation added in Prompt 52). Defines the interface
// lib/server/emailAuth.ts's request-link/verify flows call through.
//
// Two implementations:
//   - InMemoryRateLimiter: NOT production-grade (see its own doc comment
//     below) — kept for local dev/tests only.
//   - PostgresRateLimiter: the production implementation, added in Prompt
//     52 per the Prompt 51 architecture audit's conclusion that a
//     Postgres-backed limiter (reusing the existing Neon connection this
//     codebase already has) is preferable to adding a second piece of
//     infrastructure (e.g. Upstash Redis) purely because it is common
//     elsewhere — this app's traffic does not require a separate
//     low-latency store, and reusing the existing Db/transaction()
//     abstraction keeps local dev/test parity (the same SQLite adapter
//     that already backs every other table backs this one too).
import { createHash } from 'node:crypto';
import type { Db } from './db';

export interface RateLimiter {
  /** Returns true if `key` is currently allowed to proceed, and records
   * this attempt toward the limit either way (an attempt that is refused
   * still counts, so retries cannot reset the window). */
  check(key: string): Promise<boolean>;
}

/**
 * NOT PRODUCTION-GRADE. This codebase deploys to Vercel serverless
 * functions, where each invocation may run in a fresh, isolated process
 * with no shared memory across instances (and even a "warm" instance's
 * in-memory state is reset on redeploy or eventually recycled) — an
 * in-memory counter here only limits requests that happen to land on the
 * exact same warm instance, which is not a real guarantee under real
 * traffic or a genuine attack. Kept for local dev/tests, where a single
 * process is the entire "deployment". Production uses PostgresRateLimiter
 * below.
 */
export class InMemoryRateLimiter implements RateLimiter {
  private readonly attempts = new Map<string, number[]>();

  constructor(
    private readonly maxAttempts: number,
    private readonly windowMs: number,
  ) {}

  async check(key: string): Promise<boolean> {
    const now = Date.now();
    const existing = (this.attempts.get(key) ?? []).filter((t) => now - t < this.windowMs);
    existing.push(now);
    this.attempts.set(key, existing);
    return existing.length <= this.maxAttempts;
  }
}

// Named policy constants (Prompt 52 §15) rather than magic numbers at each
// call site. The windows here are 1 hour, matching the numbers already
// live in app/api/auth/request-link/route.ts's InMemoryRateLimiter
// instances (5/hour email, 20/hour IP) BEFORE this prompt — Prompt 51's
// own report described a 15-minute window, but that was a proposal that
// never matched the code actually shipped in Prompt 46; the shipped
// hour-long windows are the real existing contract, so they are preserved
// here rather than silently tightened. VERIFY_IP_LIMIT is new (verify had
// no rate limit at all before this prompt) and uses the same 1-hour window
// for consistency rather than introducing a third, mismatched duration.
export const REQUEST_LINK_EMAIL_LIMIT = { maxAttempts: 5, windowMs: 60 * 60 * 1000 } as const;
export const REQUEST_LINK_IP_LIMIT = { maxAttempts: 20, windowMs: 60 * 60 * 1000 } as const;
export const VERIFY_IP_LIMIT = { maxAttempts: 30, windowMs: 60 * 60 * 1000 } as const;

/** Best-effort client IP extraction, shared by every rate-limited route.
 * Vercel's edge network sets x-forwarded-for to the real client IP; this
 * is only ever used as a rate-limit bucketing key, never as an identity
 * or authorization input, so a spoofed value at worst merely lets an
 * attacker share (or evade sharing) a bucket with themselves. */
export function extractClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

/** SHA-256 of `scope\0key`, hex-encoded — the database stores only this,
 * never the raw email/IP (Prompt 52 §13's explicit requirement). Scope is
 * folded into the hash as well as being its own column: the column gives
 * cheap SQL-level isolation between scopes sharing a table, the hash
 * additionally means a leaked key_hash value with a known scope still
 * cannot be reversed to the original identifier. Independent of every
 * other hash function in this codebase (hashLoginToken in emailAuth.ts,
 * hashToken in identity.ts, hashAdminToken in adminAuth.ts) — same
 * "each trust domain owns its own token construction" convention. */
function hashRateLimitKey(scope: string, key: string): string {
  return createHash('sha256').update(`${scope}\u0000${key}`).digest('hex');
}

/**
 * Production rate limiter, backed by the same Neon/Postgres database (and,
 * for tests/local dev, the same SQLite adapter) every other table in this
 * codebase already uses — see lib/server/db/migrations/0003_rate_limit_buckets.sql
 * and sqliteAdapter.ts's parallel schema addition.
 *
 * Each instance is scoped to one policy (e.g. 'request-link:email') — this
 * keeps the RateLimiter interface itself unchanged (Prompt 52 §11's
 * "choose the smaller, safer change": distinct instances/keys rather than
 * widening `check(key)` to `check(scope, key)`), exactly mirroring how
 * request-link/route.ts already used two separate InMemoryRateLimiter
 * instances (one per scope) before this prompt.
 *
 * Concurrency safety: a single atomic
 * `INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING count` statement,
 * not a wrapping db.transaction(). Unlike emailAuth.ts's consumeLoginToken
 * (which reads, branches across multiple conditions, and only then
 * writes — genuinely needing SERIALIZABLE-with-retry), this is a single
 * statement: Postgres resolves a conflicting concurrent UPSERT against the
 * same (scope, key_hash, window_start) row by serializing at the row lock,
 * so two simultaneous requests for the same key are guaranteed to observe
 * and return two DIFFERENT post-increment counts (never both "1") — the
 * same "atomic increment via upsert" guarantee this class exists to rely
 * on. SQLite (the test/local-dev adapter) provides the same guarantee via
 * its single-writer queue (see sqliteAdapter.ts's own comment).
 *
 * Failure mode: if the underlying query throws (e.g. the database is
 * unreachable), `check()` REJECTS rather than resolving to `true` — the
 * caller (a route handler) then fails the whole request, which is the
 * correct fail-closed behavior (Prompt 52 §18): a database outage must
 * never silently become "unlimited authentication requests".
 */
export class PostgresRateLimiter implements RateLimiter {
  constructor(
    private readonly db: Db,
    private readonly scope: string,
    private readonly maxAttempts: number,
    private readonly windowMs: number,
  ) {}

  async check(key: string): Promise<boolean> {
    const nowMs = Date.now();
    const windowStartMs = Math.floor(nowMs / this.windowMs) * this.windowMs;
    const windowStart = new Date(windowStartMs).toISOString();
    const expiresAt = new Date(windowStartMs + this.windowMs).toISOString();
    const nowIso = new Date(nowMs).toISOString();
    const keyHash = hashRateLimitKey(this.scope, key);

    // The security-critical operation: NOT wrapped in try/catch — a
    // failure here must propagate and fail the request closed.
    const row = await this.db.queryOne<{ count: number }>(
      `INSERT INTO rate_limit_buckets (scope, key_hash, window_start, count, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, 1, ?, ?, ?)
       ON CONFLICT (scope, key_hash, window_start)
       DO UPDATE SET count = rate_limit_buckets.count + 1, updated_at = excluded.updated_at
       RETURNING count`,
      [this.scope, keyHash, windowStart, expiresAt, nowIso, nowIso],
    );

    // Opportunistic cleanup of expired buckets (Prompt 52 §19): best
    // effort only — a failure here must never fail the rate-limit check
    // itself, since correctness of the limit does not depend on old rows
    // being deleted (a bucket from an expired window simply has a
    // window_start that no longer matches any future check() call and is
    // never read again; deleting it is purely about bounding table growth).
    await this.db.execute('DELETE FROM rate_limit_buckets WHERE expires_at < ?', [nowIso]).catch(() => {});

    const count = row?.count ?? 1;
    return count <= this.maxAttempts;
  }
}
