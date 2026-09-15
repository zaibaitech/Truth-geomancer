// Tests for entitlement persistence and the composed access decision
// (Prompt 26, Phases 5 and 11 — ENTITLEMENTS). These exercise the REAL
// database (an isolated ':memory:' instance per test), never a mock, so a
// passing test here means the SQL, the constraints, and the access
// composition all actually agree with each other.
import { afterEach, describe, expect, it } from 'vitest';
import { canAccessForUser } from './accessService';
import { openDatabase, type Db } from './db';
import { grantEntitlement, revokeEntitlement, getEntitlementsForUser, getActiveEntitlementsForUser } from './entitlements';
import { getOrCreateUser } from './identity';
import { BUNDLE_PRODUCT, KANZUL_PRODUCT, KANZUL_VERIFIED_METHOD_IDS, MASTER_PRODUCT } from '@/lib/access/products';

let db: Db;
afterEach(() => {
  try {
    db?.close();
  } catch {
    // Not open for a test that never called openDatabase(); nothing to clean up.
  }
});

function makeUser(): string {
  return getOrCreateUser(db, null).user.id;
}

describe('Master access', () => {
  it('an active Master entitlement grants the Master book and Master features, never Kanzul', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    grantEntitlement(db, userId, MASTER_PRODUCT.id, 'manual-payment');

    expect(canAccessForUser(db, userId, { kind: 'book', bookId: 'master-of-geomancy-vol-1' })).toBe(true);
    expect(canAccessForUser(db, userId, { kind: 'feature', featureKey: 'master-counting-method' })).toBe(true);
    expect(canAccessForUser(db, userId, { kind: 'book', bookId: 'kanzul-mikban' })).toBe(false);
    expect(
      canAccessForUser(db, userId, { kind: 'method', bookId: 'kanzul-mikban', methodId: KANZUL_VERIFIED_METHOD_IDS[0] }),
    ).toBe(false);
  });
});

describe('Kanzul access', () => {
  it('an active Kanzul entitlement grants the Kanzul book and every verified method, never Master', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');

    expect(canAccessForUser(db, userId, { kind: 'book', bookId: 'kanzul-mikban' })).toBe(true);
    expect(
      canAccessForUser(db, userId, { kind: 'method', bookId: 'kanzul-mikban', methodId: KANZUL_VERIFIED_METHOD_IDS[0] }),
    ).toBe(true);
    expect(canAccessForUser(db, userId, { kind: 'book', bookId: 'master-of-geomancy-vol-1' })).toBe(false);
    expect(canAccessForUser(db, userId, { kind: 'feature', featureKey: 'master-counting-method' })).toBe(false);
  });
});

describe('Bundle access', () => {
  it('an active bundle entitlement grants both books and both method collections', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    grantEntitlement(db, userId, BUNDLE_PRODUCT.id, 'manual-payment');

    expect(canAccessForUser(db, userId, { kind: 'book', bookId: 'master-of-geomancy-vol-1' })).toBe(true);
    expect(canAccessForUser(db, userId, { kind: 'book', bookId: 'kanzul-mikban' })).toBe(true);
    expect(canAccessForUser(db, userId, { kind: 'feature', featureKey: 'master-cancelling-method' })).toBe(true);
    expect(
      canAccessForUser(db, userId, { kind: 'method', bookId: 'kanzul-mikban', methodId: KANZUL_VERIFIED_METHOD_IDS[0] }),
    ).toBe(true);
  });
});

describe('revoked access', () => {
  it('revoking a previously active entitlement removes access', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const { entitlement } = grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    expect(canAccessForUser(db, userId, { kind: 'book', bookId: 'kanzul-mikban' })).toBe(true);

    const revoked = revokeEntitlement(db, entitlement.id);
    expect(revoked?.status).toBe('revoked');
    expect(revoked?.revokedAt).toBeTruthy();
    expect(canAccessForUser(db, userId, { kind: 'book', bookId: 'kanzul-mikban' })).toBe(false);
  });

  it('revoking an already-revoked entitlement is an idempotent no-op', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const { entitlement } = grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    const first = revokeEntitlement(db, entitlement.id);
    const second = revokeEntitlement(db, entitlement.id);
    expect(second?.status).toBe('revoked');
    expect(second?.revokedAt).toBe(first?.revokedAt);
  });

  it('revoking an unknown entitlement id returns null', () => {
    db = openDatabase(':memory:');
    expect(revokeEntitlement(db, 'does-not-exist')).toBeNull();
  });
});

describe('inactive product', () => {
  it('grantEntitlement refuses a product that IS in the catalogue but is not active', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    // A controlled catalogue containing a real, known product marked
    // inactive — the live PRODUCT_CATALOGUE has no inactive entries today,
    // so injecting one here is what actually exercises the `.active`
    // check as distinct from the "unknown id" check below.
    const catalogueWithInactiveMaster = [{ ...MASTER_PRODUCT, active: false }, KANZUL_PRODUCT, BUNDLE_PRODUCT];

    expect(() =>
      grantEntitlement(db, userId, MASTER_PRODUCT.id, 'manual-payment', catalogueWithInactiveMaster),
    ).toThrow(/unknown or inactive/);
    expect(getEntitlementsForUser(db, userId)).toHaveLength(0);
  });
});

describe('unknown product', () => {
  it('grantEntitlement refuses a product id absent from the catalogue', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    expect(() => grantEntitlement(db, userId, 'not-a-real-product', 'manual-payment')).toThrow(/unknown or inactive/);
    expect(getEntitlementsForUser(db, userId)).toHaveLength(0);
  });
});

describe('cross-user isolation', () => {
  it("granting user A's entitlement never grants user B access", () => {
    db = openDatabase(':memory:');
    const userA = makeUser();
    const userB = makeUser();
    grantEntitlement(db, userA, KANZUL_PRODUCT.id, 'manual-payment');

    expect(canAccessForUser(db, userA, { kind: 'book', bookId: 'kanzul-mikban' })).toBe(true);
    expect(canAccessForUser(db, userB, { kind: 'book', bookId: 'kanzul-mikban' })).toBe(false);
    expect(getActiveEntitlementsForUser(db, userB)).toHaveLength(0);
  });
});

describe('duplicate grants', () => {
  it('granting the same product twice is deterministic: no duplicate row, same entitlement id returned', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const first = grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    const second = grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.entitlement.id).toBe(first.entitlement.id);
    expect(getEntitlementsForUser(db, userId)).toHaveLength(1);
  });

  it('re-granting after a revoke creates a NEW active entitlement rather than reviving the old one', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const first = grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    revokeEntitlement(db, first.entitlement.id);

    const regrant = grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    expect(regrant.created).toBe(true);
    expect(regrant.entitlement.id).not.toBe(first.entitlement.id);
    expect(getEntitlementsForUser(db, userId)).toHaveLength(2);
    expect(getActiveEntitlementsForUser(db, userId)).toHaveLength(1);
  });
});
