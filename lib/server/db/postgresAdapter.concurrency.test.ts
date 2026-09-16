// Real multi-connection concurrency tests against the production Neon
// Postgres adapter (Prompt 31C). Every other transactional test in this
// repo (previews.test.ts, previewService.test.ts, paymentRequests.test.ts)
// runs against lib/server/db/sqliteAdapter.ts — a single in-process
// connection that can only prove atomicity within one Node process, not
// under genuinely independent database connections the way separate
// serverless function invocations would produce in production.
//
// These tests exercise the SAME consumePreviewUse()/approvePaymentRequest()
// logic through real, separate PoolClient connections against a live
// Postgres database, so they are the only tests in this repo that can
// actually validate postgresAdapter.ts's SERIALIZABLE-isolation-with-retry
// transaction() implementation under real concurrency.
//
// SKIPPED unless DATABASE_URL is set — never required for `npm test` to
// pass, and never runs against anyone's real/production database: point
// it at a disposable database (a throwaway Neon branch/project) when
// running these locally or in CI. All rows this suite writes use randomly
// generated ids/tokens and are cleaned up in afterEach.
import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { createPostgresDb } from './postgresAdapter';
import type { Db } from './types';
import { getOrCreateUser } from '../identity';
import { grantEntitlement } from '../entitlements';
import { consumePreviewUse } from '../previews';
import { createPaymentRequest, approvePaymentRequest } from '../paymentRequests';
import { KANZUL_PRODUCT } from '@/lib/access/products';
import type { FreePreview } from '@/lib/access/types';

const DATABASE_URL = process.env.DATABASE_URL;
const describeIfLive = DATABASE_URL ? describe : describe.skip;

describeIfLive('postgresAdapter — real concurrency (requires a live DATABASE_URL)', () => {
  let db: Db;
  const cleanupUserIds: string[] = [];

  afterEach(async () => {
    // Best-effort cleanup of every disposable row this suite created —
    // never touches any row this suite did not itself insert.
    for (const userId of cleanupUserIds.splice(0)) {
      await db.execute('DELETE FROM preview_usage WHERE user_id = ?', [userId]);
      await db.execute('DELETE FROM payment_requests WHERE user_id = ?', [userId]);
      await db.execute('DELETE FROM entitlements WHERE user_id = ?', [userId]);
      await db.execute('DELETE FROM users WHERE id = ?', [userId]);
    }
    await db?.close();
  });

  async function makeUser(): Promise<string> {
    db = db ?? createPostgresDb(DATABASE_URL!);
    const token = `concurrency-test-${randomUUID()}`;
    const { user } = await getOrCreateUser(db, token);
    cleanupUserIds.push(user.id);
    return user.id;
  }

  it('10 genuinely concurrent consumePreviewUse calls (separate connections) against maxUses=3 result in exactly 3 successes', async () => {
    db = createPostgresDb(DATABASE_URL!);
    const userId = await makeUser();
    const preview: FreePreview = {
      id: `concurrency-preview-${randomUUID()}`,
      target: { kind: 'method', bookId: 'kanzul-mikban', methodId: 'own-house-in-life-method-1' },
      maxUses: 3,
      active: true,
    };

    const results = await Promise.all(Array.from({ length: 10 }, () => consumePreviewUse(db, userId, preview)));
    const successes = results.filter((r) => r.ok);
    expect(successes).toHaveLength(3);
  });

  it('concurrent approvePaymentRequest calls for the same request never produce more than one active entitlement', async () => {
    db = createPostgresDb(DATABASE_URL!);
    const userId = await makeUser();
    const req = await createPaymentRequest(db, userId, KANZUL_PRODUCT.id, `TXN-CONCURRENCY-${randomUUID()}`);
    expect(req.ok).toBe(true);
    if (!req.ok) return;

    await Promise.all([
      approvePaymentRequest(db, req.request.id, 'admin-a'),
      approvePaymentRequest(db, req.request.id, 'admin-b'),
      approvePaymentRequest(db, req.request.id, 'admin-c'),
    ]);

    const active = await db.query<{ id: string }>(
      "SELECT id FROM entitlements WHERE user_id = ? AND product_id = ? AND status = 'active'",
      [userId, KANZUL_PRODUCT.id],
    );
    expect(active).toHaveLength(1);
  });

  it('grantEntitlement stays idempotent under concurrent calls for the same (user, product) pair', async () => {
    db = createPostgresDb(DATABASE_URL!);
    const userId = await makeUser();

    await Promise.all(
      Array.from({ length: 5 }, () => grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment')),
    );

    const active = await db.query<{ id: string }>(
      "SELECT id FROM entitlements WHERE user_id = ? AND product_id = ? AND status = 'active'",
      [userId, KANZUL_PRODUCT.id],
    );
    expect(active).toHaveLength(1);
  });
});
