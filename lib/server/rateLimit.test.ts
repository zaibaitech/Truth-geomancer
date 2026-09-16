// Tests for the production (Postgres-backed, via the same Db abstraction
// every other table in this codebase uses) rate limiter added in Prompt
// 52. Every test here runs against the SQLite test adapter
// (openDatabase(':memory:')) — same convention as every other
// transactional test in this repo (previews.test.ts, paymentRequests.test.ts).
// A genuine multi-connection concurrency proof against real Postgres
// lives in lib/server/db/rateLimiter.concurrency.test.ts, gated on
// DATABASE_URL, mirroring postgresAdapter.concurrency.test.ts's existing
// pattern exactly — Node's single-threaded, synchronous node:sqlite
// adapter cannot itself prove atomicity under genuinely independent
// connections the way separate serverless invocations would produce.
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from './db';
import { PostgresRateLimiter, type RateLimiter } from './rateLimit';

let db: Db;
afterEach(async () => {
  try {
    await db?.close();
  } catch {
    // Not open for a test that never called openDatabase(); nothing to clean up.
  }
});

describe('A/B: first and subsequent requests within the limit are allowed', () => {
  it('the first request is allowed', async () => {
    db = openDatabase(':memory:');
    const limiter = new PostgresRateLimiter(db, 'test:scope', 3, 60_000);
    expect(await limiter.check('key-1')).toBe(true);
  });

  it('requests below the limit are all allowed', async () => {
    db = openDatabase(':memory:');
    const limiter = new PostgresRateLimiter(db, 'test:scope', 3, 60_000);
    expect(await limiter.check('key-1')).toBe(true);
    expect(await limiter.check('key-1')).toBe(true);
    expect(await limiter.check('key-1')).toBe(true);
  });
});

describe('C: a request exceeding the limit is denied', () => {
  it('the 4th request against a limit of 3 is denied, and stays denied', async () => {
    db = openDatabase(':memory:');
    const limiter = new PostgresRateLimiter(db, 'test:scope', 3, 60_000);
    await limiter.check('key-1');
    await limiter.check('key-1');
    await limiter.check('key-1');
    expect(await limiter.check('key-1')).toBe(false);
    expect(await limiter.check('key-1')).toBe(false);
  });
});

describe('E: window expiration permits requests again', () => {
  it('a request after the window elapses is allowed even though the prior window was exhausted', async () => {
    db = openDatabase(':memory:');
    const limiter = new PostgresRateLimiter(db, 'test:scope', 1, 40);
    expect(await limiter.check('key-1')).toBe(true);
    expect(await limiter.check('key-1')).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(await limiter.check('key-1')).toBe(true);
  });
});

describe('F/G: different keys never share a limit', () => {
  it('a different email/IP key under the same scope has its own independent counter', async () => {
    db = openDatabase(':memory:');
    const limiter = new PostgresRateLimiter(db, 'request-link:email', 1, 60_000);
    expect(await limiter.check('alice@example.test')).toBe(true);
    expect(await limiter.check('alice@example.test')).toBe(false);
    // A different key is entirely unaffected by alice's exhausted limit.
    expect(await limiter.check('bob@example.test')).toBe(true);
  });
});

describe('H: verify has its own scope', () => {
  it('the same raw key under two different scopes (e.g. request-link:ip vs verify:ip) never shares a counter', async () => {
    db = openDatabase(':memory:');
    const requestLinkLimiter = new PostgresRateLimiter(db, 'request-link:ip', 1, 60_000);
    const verifyLimiter = new PostgresRateLimiter(db, 'verify:ip', 1, 60_000);
    const ip = '203.0.113.5';
    expect(await requestLinkLimiter.check(ip)).toBe(true);
    expect(await requestLinkLimiter.check(ip)).toBe(false);
    // Same IP, different scope — a fresh, independent counter.
    expect(await verifyLimiter.check(ip)).toBe(true);
  });
});

describe('I: concurrent requests cannot bypass the limit (logic proof against the single-writer test adapter)', () => {
  it('20 concurrent check() calls against a limit of 5 result in exactly 5 successes', async () => {
    db = openDatabase(':memory:');
    const limiter = new PostgresRateLimiter(db, 'test:scope', 5, 60_000);
    const results = await Promise.all(Array.from({ length: 20 }, () => limiter.check('shared-key')));
    expect(results.filter(Boolean)).toHaveLength(5);
  });
});

describe('J: key hashing does not store the raw identifier', () => {
  it('the stored key_hash is a SHA-256 hex digest, never the plaintext email/IP', async () => {
    db = openDatabase(':memory:');
    const limiter = new PostgresRateLimiter(db, 'request-link:email', 5, 60_000);
    const rawEmail = 'someone@example.test';
    await limiter.check(rawEmail);
    const rows = await db.query<{ key_hash: string }>('SELECT key_hash FROM rate_limit_buckets');
    expect(rows).toHaveLength(1);
    expect(rows[0].key_hash).not.toBe(rawEmail);
    expect(rows[0].key_hash).not.toContain(rawEmail);
    expect(rows[0].key_hash).toMatch(/^[0-9a-f]{64}$/); // SHA-256 hex digest shape
  });
});

describe('K: expired buckets are cleaned up opportunistically', () => {
  it('a bucket from an already-expired window is deleted by a later check() call', async () => {
    db = openDatabase(':memory:');
    const pastExpiry = new Date(Date.now() - 60_000).toISOString();
    await db.execute(
      `INSERT INTO rate_limit_buckets (scope, key_hash, window_start, count, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['stale:scope', 'deadbeef', 'stale-window', 1, pastExpiry, pastExpiry, pastExpiry],
    );

    const limiter = new PostgresRateLimiter(db, 'other:scope', 5, 60_000);
    await limiter.check('any-key'); // triggers the opportunistic cleanup pass

    const stale = await db.query('SELECT * FROM rate_limit_buckets WHERE scope = ?', ['stale:scope']);
    expect(stale).toHaveLength(0);
  });
});

describe('L: a limiter database failure fails closed', () => {
  it('check() rejects (never resolves to true) when the underlying Db throws', async () => {
    const brokenDb: Db = {
      query: async () => {
        throw new Error('connection lost');
      },
      queryOne: async () => {
        throw new Error('connection lost');
      },
      execute: async () => {
        throw new Error('connection lost');
      },
      transaction: async (fn) => fn(brokenDb),
      close: async () => {},
    };
    const limiter = new PostgresRateLimiter(brokenDb, 'test:scope', 5, 60_000);
    await expect(limiter.check('key-1')).rejects.toThrow('connection lost');
  });
});

describe('M: PostgresRateLimiter conforms to the RateLimiter interface', () => {
  it('is assignable to RateLimiter and exposes a callable check()', async () => {
    db = openDatabase(':memory:');
    const limiter: RateLimiter = new PostgresRateLimiter(db, 'test:scope', 5, 60_000);
    expect(typeof limiter.check).toBe('function');
    expect(await limiter.check('key-1')).toBe(true);
  });
});
