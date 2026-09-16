// Tests for the free-preview execution service (Prompt 29, Phase 16 —
// DOMAIN, ENTITLEMENT, ATOMICITY, SCOPE). Real ':memory:' database per
// test, real engine calculation (runReading) — never a mock of the
// calculation itself, since a fabricated preview result is exactly what
// Phase 10 forbids. Updated for Prompt 31C's async Db interface.
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from './db';
import { getOrCreateUser } from './identity';
import { grantEntitlement } from './entitlements';
import { getPreviewUsage } from './previews';
import { executeBookPreview, getPreviewStatusForUser } from './previewService';
import { runReading } from '@/lib/raml/engine';
import { fixtureChart } from '@/lib/raml/engine/__tests__/fixtures';
import { KANZUL_PRODUCT, MASTER_PRODUCT, BUNDLE_PRODUCT } from '@/lib/access/products';

const KANZUL_BOOK = 'kanzul-mikban';
const MASTER_BOOK = 'master-of-geomancy-vol-1';
const chart = fixtureChart();

let db: Db;
afterEach(async () => {
  try {
    await db?.close();
  } catch {
    // Not open for a test that never called openDatabase(); nothing to clean up.
  }
});

async function makeUser(token: string | null = null): Promise<string> {
  return (await getOrCreateUser(db, token)).user.id;
}

// ---------------------------------------------------------------------------
// DOMAIN (1-7)
// ---------------------------------------------------------------------------
describe('domain', () => {
  it('1: first preview succeeds', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    const result = await executeBookPreview(db, userId, KANZUL_BOOK, chart);
    expect(result.ok).toBe(true);
  });

  it('2: second preview denied', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await executeBookPreview(db, userId, KANZUL_BOOK, chart);
    const second = await executeBookPreview(db, userId, KANZUL_BOOK, chart);
    expect(second).toEqual({ ok: false, reason: 'exhausted' });
  });

  it('3: usage persists (re-checking status after consumption still reports consumed)', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await executeBookPreview(db, userId, KANZUL_BOOK, chart);
    expect(await getPreviewStatusForUser(db, userId, KANZUL_BOOK)).toBe('consumed');
    expect(await getPreviewStatusForUser(db, userId, KANZUL_BOOK)).toBe('consumed');
  });

  it('4: usage is per-user', async () => {
    db = openDatabase(':memory:');
    const userA = await makeUser('user-a-token');
    const userB = await makeUser('user-b-token');
    await executeBookPreview(db, userA, KANZUL_BOOK, chart);
    expect(await getPreviewStatusForUser(db, userA, KANZUL_BOOK)).toBe('consumed');
    expect(await getPreviewStatusForUser(db, userB, KANZUL_BOOK)).toBe('available');
  });

  it('5: usage is per-book', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await executeBookPreview(db, userId, KANZUL_BOOK, chart);
    expect(await getPreviewStatusForUser(db, userId, KANZUL_BOOK)).toBe('consumed');
    expect(await getPreviewStatusForUser(db, userId, MASTER_BOOK)).toBe('available');
  });

  it('6: Master usage does not affect Kanzul', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await executeBookPreview(db, userId, MASTER_BOOK, null);
    expect(await getPreviewStatusForUser(db, userId, MASTER_BOOK)).toBe('consumed');
    expect(await getPreviewStatusForUser(db, userId, KANZUL_BOOK)).toBe('available');
  });

  it('7: Kanzul usage does not affect Master', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await executeBookPreview(db, userId, KANZUL_BOOK, chart);
    expect(await getPreviewStatusForUser(db, userId, KANZUL_BOOK)).toBe('consumed');
    expect(await getPreviewStatusForUser(db, userId, MASTER_BOOK)).toBe('available');
  });
});

// ---------------------------------------------------------------------------
// ENTITLEMENT (8-11)
// ---------------------------------------------------------------------------
describe('entitlement override', () => {
  it('8: an entitled user does not consume a preview', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    await executeBookPreview(db, userId, KANZUL_BOOK, chart);
    expect(await getPreviewUsage(db, userId, 'preview-kanzul-mikban-v1')).toBeNull();
  });

  it('9: an entitled user has normal access reported (entitled:true), never a preview result', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    const result = await executeBookPreview(db, userId, KANZUL_BOOK, chart);
    expect(result).toEqual({ ok: true, entitled: true });
  });

  it('10: consuming a preview cannot revoke an existing entitlement', async () => {
    db = openDatabase(':memory:');
    const userA = await makeUser('user-a-with-entitlement');
    await grantEntitlement(db, userA, MASTER_PRODUCT.id, 'manual-payment');
    // A different user consumes the Master preview — must not touch user A's entitlement at all.
    const userB = await makeUser('user-b-preview-consumer');
    await executeBookPreview(db, userB, MASTER_BOOK, null);
    expect(await executeBookPreview(db, userA, MASTER_BOOK, null)).toEqual({ ok: true, entitled: true });
  });

  it('11: consuming a preview never creates an entitlement for that user', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await executeBookPreview(db, userId, KANZUL_BOOK, chart);
    expect(await executeBookPreview(db, userId, KANZUL_BOOK, chart)).toEqual({ ok: false, reason: 'exhausted' });
    // Status should still be exactly 'consumed', never silently 'entitled'.
    expect(await getPreviewStatusForUser(db, userId, KANZUL_BOOK)).toBe('consumed');
  });
});

// ---------------------------------------------------------------------------
// ATOMICITY (12-15)
// ---------------------------------------------------------------------------
describe('atomicity', () => {
  it('12-13: concurrent first-use requests result in exactly one success and exactly one usage recorded', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    // Genuinely concurrent (Promise.all, not one-at-a-time) — safe against
    // the SQLite test/dev adapter because its transaction() serializes
    // internally (lib/server/db/sqliteAdapter.ts's own comment on why).
    // This proves in-process atomicity; it does not prove multi-connection
    // Postgres correctness under real concurrency, which needs a live
    // database — see lib/server/db/postgresAdapter.concurrency.test.ts.
    const results = await Promise.all(Array.from({ length: 10 }, () => executeBookPreview(db, userId, KANZUL_BOOK, chart)));
    const successes = results.filter((r) => r.ok && !r.entitled);
    expect(successes).toHaveLength(1);
    expect((await getPreviewUsage(db, userId, 'preview-kanzul-mikban-v1'))?.usesConsumed).toBe(1);
  });

  it('14: no negative remaining count / no negative usesConsumed', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await executeBookPreview(db, userId, KANZUL_BOOK, chart);
    for (let i = 0; i < 5; i++) await executeBookPreview(db, userId, KANZUL_BOOK, chart);
    const usage = await getPreviewUsage(db, userId, 'preview-kanzul-mikban-v1');
    expect(usage?.usesConsumed).toBeGreaterThanOrEqual(0);
    expect(usage?.usesConsumed).toBe(1);
  });

  it('15: no usage beyond limit (maxUses = 1)', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    for (let i = 0; i < 20; i++) await executeBookPreview(db, userId, KANZUL_BOOK, chart);
    expect((await getPreviewUsage(db, userId, 'preview-kanzul-mikban-v1'))?.usesConsumed).toBe(1);
  });

  it('a malformed (chart-missing) request never consumes the preview', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    const result = await executeBookPreview(db, userId, KANZUL_BOOK, null);
    expect(result).toEqual({ ok: false, reason: 'chart-required' });
    expect(await getPreviewUsage(db, userId, 'preview-kanzul-mikban-v1')).toBeNull();
    // The user's real preview is still available after the failed attempt.
    expect(await getPreviewStatusForUser(db, userId, KANZUL_BOOK)).toBe('available');
  });
});

// ---------------------------------------------------------------------------
// SCOPE (23-26 — the domain-level portion; UI/route-level scope checks are
// covered separately in previewRoutes.test.ts)
// ---------------------------------------------------------------------------
describe('scope', () => {
  it('23: preview execution returns exactly one method result, never the whole question corpus', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    const result = await executeBookPreview(db, userId, KANZUL_BOOK, chart);
    expect(result.ok).toBe(true);
    if (!result.ok || result.entitled || result.kind !== 'method') return;
    expect(Object.keys(result).sort()).toEqual(['entitled', 'kind', 'label', 'ok', 'questionId', 'row', 'sourceLabel', 'sourceQuote'].sort());
  });

  it('25: a Kanzul preview never authorizes Master, and vice versa', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await executeBookPreview(db, userId, KANZUL_BOOK, chart);
    const masterAttempt = await executeBookPreview(db, userId, MASTER_BOOK, null);
    // Master preview is still its OWN, independently available preview —
    // not blocked or granted by the Kanzul consumption.
    expect(masterAttempt).toEqual({ ok: true, entitled: false, kind: 'feature', featureKey: 'master-counting-method' });
  });

  it("26: the returned result matches the real engine's own computed row exactly — never a fabricated/simplified value", async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    const result = await executeBookPreview(db, userId, KANZUL_BOOK, chart);
    expect(result.ok).toBe(true);
    if (!result.ok || result.entitled || result.kind !== 'method') return;
    const direct = runReading(chart, result.questionId)!;
    const expectedRow = direct.methodResults.find((m) => m.id === 'own-house-in-life-method-1');
    expect(result.row).toEqual(expectedRow);
  });

  it('a Bundle entitlement counts for either book, neither preview is required', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await grantEntitlement(db, userId, BUNDLE_PRODUCT.id, 'manual-payment');
    expect(await getPreviewStatusForUser(db, userId, KANZUL_BOOK)).toBe('entitled');
    expect(await getPreviewStatusForUser(db, userId, MASTER_BOOK)).toBe('entitled');
  });
});

describe('unconfigured book', () => {
  it('an unknown bookId is refused, never treated as available-forever', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    expect(await executeBookPreview(db, userId, 'not-a-real-book', chart)).toEqual({ ok: false, reason: 'unconfigured-book' });
    expect(await getPreviewStatusForUser(db, userId, 'not-a-real-book')).toBe('unconfigured');
  });
});
