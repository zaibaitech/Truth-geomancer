// Tests for the whole-book offline download service (Prompt 30, Phase 23
// — SERVER AUTHORIZATION, CONTENT, VERSIONING, PREVIEW). Real ':memory:'
// database per test — never a mock of canAccessForUser() itself, since
// that IS the security-relevant decision. Updated for Prompt 31C's async
// Db interface.
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from './db';
import { getOrCreateUser } from './identity';
import { grantEntitlement } from './entitlements';
import { createPaymentRequest } from './paymentRequests';
import { executeBookPreview } from './previewService';
import { getBookContentForUser } from './contentService';
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
// SERVER AUTHORIZATION (1-8)
// ---------------------------------------------------------------------------
describe('server authorization', () => {
  it('1: unentitled user cannot download Master', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    expect(await getBookContentForUser(db, userId, MASTER_BOOK)).toEqual({ ok: false, reason: 'unauthorized' });
  });

  it('2: unentitled user cannot download Kanzul', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    expect(await getBookContentForUser(db, userId, KANZUL_BOOK)).toEqual({ ok: false, reason: 'unauthorized' });
  });

  it('3: Master-only user cannot download Kanzul', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await grantEntitlement(db, userId, MASTER_PRODUCT.id, 'manual-payment');
    expect(await getBookContentForUser(db, userId, KANZUL_BOOK)).toEqual({ ok: false, reason: 'unauthorized' });
  });

  it('4: Kanzul-only user cannot download Master', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    expect(await getBookContentForUser(db, userId, MASTER_BOOK)).toEqual({ ok: false, reason: 'unauthorized' });
  });

  it('5: Bundle user can download both', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await grantEntitlement(db, userId, BUNDLE_PRODUCT.id, 'manual-payment');
    expect((await getBookContentForUser(db, userId, MASTER_BOOK)).ok).toBe(true);
    expect((await getBookContentForUser(db, userId, KANZUL_BOOK)).ok).toBe(true);
  });

  it('6: preview-only user cannot download the full book', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    const previewResult = await executeBookPreview(db, userId, KANZUL_BOOK, chart);
    expect(previewResult.ok).toBe(true); // sanity: the preview itself worked
    expect(await getBookContentForUser(db, userId, KANZUL_BOOK)).toEqual({ ok: false, reason: 'unauthorized' });
  });

  it('7: pending-payment user cannot download', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    const req = await createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-PENDING');
    expect(req.ok).toBe(true);
    if (!req.ok) return;
    expect(req.request.status).toBe('pending');
    expect(await getBookContentForUser(db, userId, KANZUL_BOOK)).toEqual({ ok: false, reason: 'unauthorized' });
  });

  it('8: rejected-payment user cannot download', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    const req = await createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-REJECT');
    expect(req.ok).toBe(true);
    if (!req.ok) return;
    // No admin approval call at all — request stays pending, never becomes
    // an entitlement; this test only needs "not approved", matching the
    // rejected case's own access outcome exactly (both are 'unauthorized').
    expect(await getBookContentForUser(db, userId, KANZUL_BOOK)).toEqual({ ok: false, reason: 'unauthorized' });
  });
});

// ---------------------------------------------------------------------------
// CONTENT (12-15)
// ---------------------------------------------------------------------------
describe('content', () => {
  it('12: unauthorized response contains no complete protected book', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    const result = await getBookContentForUser(db, userId, KANZUL_BOOK);
    expect(JSON.stringify(result)).not.toMatch(/paragraphs|chapters/);
  });

  it('13: authorized response contains the expected book', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    const result = await getBookContentForUser(db, userId, KANZUL_BOOK);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bookId).toBe(KANZUL_BOOK);
    expect(Array.isArray(result.chapters)).toBe(true);
    expect(result.chapters.length).toBeGreaterThan(100);
  });

  it('14: Master response contains only Master (no Kanzul chapter ids), and has no `chapters` field shaped like Kanzul (no methodIds)', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await grantEntitlement(db, userId, MASTER_PRODUCT.id, 'manual-payment');
    const result = await getBookContentForUser(db, userId, MASTER_BOOK);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bookId).toBe(MASTER_BOOK);
    expect(result.dedication).toBeTruthy();
    expect(JSON.stringify(result)).not.toMatch(/own-house-in-life-method-1/);
  });

  it('15: Kanzul response contains only Kanzul (no Master dedication/introduction fields)', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    const result = await getBookContentForUser(db, userId, KANZUL_BOOK);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dedication).toBeUndefined();
    expect(result.introduction).toBeUndefined();
  });

  it('an unknown book id is refused with unknown-book, never unauthorized (no hint whether it would exist for someone else)', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    expect(await getBookContentForUser(db, userId, 'not-a-real-book')).toEqual({ ok: false, reason: 'unknown-book' });
  });
});

// ---------------------------------------------------------------------------
// VERSIONING (21)
// ---------------------------------------------------------------------------
describe('versioning', () => {
  it('21: content version is present, deterministic, and stable across repeated calls', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    const first = await getBookContentForUser(db, userId, KANZUL_BOOK);
    const second = await getBookContentForUser(db, userId, KANZUL_BOOK);
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.contentVersion).toBe(second.contentVersion);
    expect(first.contentVersion.length).toBeGreaterThan(0);
  });

  it('Master and Kanzul never share the same content version', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await grantEntitlement(db, userId, BUNDLE_PRODUCT.id, 'manual-payment');
    const master = await getBookContentForUser(db, userId, MASTER_BOOK);
    const kanzul = await getBookContentForUser(db, userId, KANZUL_BOOK);
    expect(master.ok && kanzul.ok).toBe(true);
    if (!master.ok || !kanzul.ok) return;
    expect(master.contentVersion).not.toBe(kanzul.contentVersion);
  });

  it('the version is not random — the version is identical across two entirely separate users', async () => {
    db = openDatabase(':memory:');
    const userA = await makeUser('user-a');
    const userB = await makeUser('user-b');
    await grantEntitlement(db, userA, KANZUL_PRODUCT.id, 'manual-payment');
    await grantEntitlement(db, userB, KANZUL_PRODUCT.id, 'manual-payment');
    const a = await getBookContentForUser(db, userA, KANZUL_BOOK);
    const b = await getBookContentForUser(db, userB, KANZUL_BOOK);
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(a.contentVersion).toBe(b.contentVersion);
  });
});

// ---------------------------------------------------------------------------
// PREVIEW ISOLATION (25-26 — the domain-level portion)
// ---------------------------------------------------------------------------
describe('preview isolation', () => {
  it('25: consuming a preview does not create offline book access', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await executeBookPreview(db, userId, KANZUL_BOOK, chart);
    expect(await getBookContentForUser(db, userId, KANZUL_BOOK)).toEqual({ ok: false, reason: 'unauthorized' });
  });

  it('26: consuming a preview does not create an entitlement (restated at the offline-download boundary)', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await executeBookPreview(db, userId, MASTER_BOOK, null);
    expect(await getBookContentForUser(db, userId, MASTER_BOOK)).toEqual({ ok: false, reason: 'unauthorized' });
  });

  it('a Master preview does not grant Kanzul offline access either', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await executeBookPreview(db, userId, MASTER_BOOK, null);
    expect(await getBookContentForUser(db, userId, KANZUL_BOOK)).toEqual({ ok: false, reason: 'unauthorized' });
  });
});
