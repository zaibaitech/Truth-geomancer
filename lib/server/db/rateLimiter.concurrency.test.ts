// Real multi-connection concurrency test for PostgresRateLimiter (Prompt
// 52), mirroring postgresAdapter.concurrency.test.ts's existing pattern
// exactly: rateLimit.test.ts's "concurrent requests" test runs against
// the single-threaded, synchronous SQLite test adapter, which cannot by
// itself prove atomicity under genuinely independent database
// connections the way separate serverless function invocations would
// produce in production. This test exercises the SAME
// PostgresRateLimiter.check() logic through real, separate PoolClient
// connections against a live Postgres database.
//
// SKIPPED unless DATABASE_URL is set — never required for `npm test` to
// pass, and never runs against anyone's real/production database: point
// it at a disposable database (a throwaway Neon branch/project) when
// running this locally or in CI. All rows this suite writes use a
// randomly generated scope and are cleaned up in afterEach.
import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { createPostgresDb } from './postgresAdapter';
import type { Db } from './types';
import { PostgresRateLimiter } from '../rateLimit';

const DATABASE_URL = process.env.DATABASE_URL;
const describeIfLive = DATABASE_URL ? describe : describe.skip;

describeIfLive('PostgresRateLimiter — real concurrency (requires a live DATABASE_URL)', () => {
  let db: Db;
  let scope: string;

  afterEach(async () => {
    if (db && scope) {
      await db.execute('DELETE FROM rate_limit_buckets WHERE scope = ?', [scope]);
    }
    await db?.close();
  });

  it('20 genuinely concurrent check() calls (separate connections) against a limit of 5 result in exactly 5 successes', async () => {
    db = createPostgresDb(DATABASE_URL!);
    scope = `test:concurrency:${randomUUID()}`;
    const limiter = new PostgresRateLimiter(db, scope, 5, 60_000);

    const results = await Promise.all(Array.from({ length: 20 }, () => limiter.check('shared-key')));
    expect(results.filter(Boolean)).toHaveLength(5);
  });
});
