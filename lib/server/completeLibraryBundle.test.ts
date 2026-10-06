// The Complete Geomancy Library bundle: catalogue contents, and what a verified
// bundle payment grants to a user who owns neither, one, or both books.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { openDatabase, type Db } from './db';
import { getOrCreateUser } from './identity';
import { getActiveEntitlementsForUser, grantEntitlement } from './entitlements';
import { hasEntitlementAccess } from './accessService';
import { fulfilCheckout } from './paystackFulfilment';
import { getPayment, recordInitiating } from './paystackPayments';
import { getProductAccessStatus } from './purchaseStatus';
import { bundleSaving, paystackPriceFor } from './paystackCatalogue';
import { COMPLETE_LIBRARY_PRODUCT, KANZUL_PRODUCT, MASTER_PRODUCT, PURCHASABLE_PRODUCTS } from '@/lib/access/products';

const BUNDLE = 'complete-geomancy-library';
const MASTER = 'master-of-geomancy-vol-1';
const KANZUL = 'kanzul-mikban';
const EMAIL = 'reader@example.com';
const ORIGINAL_SECRET = process.env.PAYSTACK_SECRET_KEY;

let db: Db;
afterEach(async () => {
  if (db) await db.close();
  db = undefined as unknown as Db;
  vi.unstubAllGlobals();
  if (ORIGINAL_SECRET === undefined) delete process.env.PAYSTACK_SECRET_KEY;
  else process.env.PAYSTACK_SECRET_KEY = ORIGINAL_SECRET;
});

function stubVerify(data: Record<string, unknown>) {
  process.env.PAYSTACK_SECRET_KEY = 'sk_test_fixture_key';
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(
      async () => new Response(JSON.stringify({ status: true, message: 'ok', data }), { status: 200, headers: { 'content-type': 'application/json' } }),
    ),
  );
}

function verified(reference: string, userId: string, over: Record<string, unknown> = {}) {
  return {
    id: 7,
    status: 'success',
    reference,
    amount: 25000,
    currency: 'GHS',
    paid_at: '2026-01-01T00:00:00.000Z',
    customer: { email: EMAIL },
    metadata: { userId, productId: BUNDLE, entitlement: BUNDLE },
    ...over,
  };
}

async function newUser(owned: string[] = []) {
  db = openDatabase(':memory:');
  const userId = (await getOrCreateUser(db, null)).user.id;
  for (const productId of owned) await grantEntitlement(db, userId, productId, 'manual-payment');
  return userId;
}

async function startBundleCheckout(userId: string, reference: string) {
  const price = paystackPriceFor(BUNDLE)!;
  await recordInitiating(db, { reference, userId, productId: BUNDLE, amountMinor: price.minor, currency: price.currency, customerEmail: EMAIL });
}

describe('catalogue', () => {
  it('prices: Master 12000, Kanzul 18000, bundle 25000, all GHS', () => {
    expect(paystackPriceFor(MASTER)).toEqual({ minor: 12000, currency: 'GHS' });
    expect(paystackPriceFor(KANZUL)).toEqual({ minor: 18000, currency: 'GHS' });
    expect(paystackPriceFor(BUNDLE)).toEqual({ minor: 25000, currency: 'GHS' });
    expect(bundleSaving(BUNDLE, [MASTER, KANZUL])).toEqual({ minor: 5000, currency: 'GHS' });
  });

  it('the bundle contains exactly the grants of both books and is on sale, while the legacy bundle is not', () => {
    expect(COMPLETE_LIBRARY_PRODUCT.name).toBe('Complete Geomancy Library');
    for (const grant of [...MASTER_PRODUCT.entitlementGrants, ...KANZUL_PRODUCT.entitlementGrants]) {
      expect(COMPLETE_LIBRARY_PRODUCT.entitlementGrants).toContain(grant);
    }
    expect(COMPLETE_LIBRARY_PRODUCT.entitlementGrants).toHaveLength(MASTER_PRODUCT.entitlementGrants.length + KANZUL_PRODUCT.entitlementGrants.length);
    const ids = PURCHASABLE_PRODUCTS.map((p) => p.id);
    expect(ids).toContain(BUNDLE);
    expect(ids).not.toContain('master-kanzul-bundle');
  });
});

describe.each([
  { label: 'neither book', owned: [] as string[] },
  { label: 'Master only', owned: [MASTER] },
  { label: 'Kanzul only', owned: [KANZUL] },
  { label: 'both books', owned: [MASTER, KANZUL] },
])('verified bundle payment when the user owns $label', ({ owned }) => {
  it('grants access to both books, creates one bundle entitlement, and never duplicates', async () => {
    const userId = await newUser(owned);
    await startBundleCheckout(userId, 'ref_b1');
    stubVerify(verified('ref_b1', userId));

    expect((await fulfilCheckout(db, 'ref_b1')).outcome).toBe('granted');
    expect(await hasEntitlementAccess(db, userId, { kind: 'book', bookId: MASTER })).toBe(true);
    expect(await hasEntitlementAccess(db, userId, { kind: 'book', bookId: KANZUL })).toBe(true);

    const active = await getActiveEntitlementsForUser(db, userId);
    const keys = active.map((e) => e.productId);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.filter((k) => k === BUNDLE)).toHaveLength(1);
    for (const id of owned) expect(keys.filter((k) => k === id)).toHaveLength(1);

    // Replaying the webhook/callback is idempotent.
    await fulfilCheckout(db, 'ref_b1');
    expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(active.length);
    expect(await getProductAccessStatus(db, userId, BUNDLE)).toBe('active');
  });
});

describe('bundle verification stays strict', () => {
  it('rejects a bundle payment of the individual-sum price, an under-payment or a wrong currency', async () => {
    for (const [ref, over] of [
      ['ref_amt', { amount: 30000 }],
      ['ref_amt2', { amount: 24999 }],
      ['ref_cur', { currency: 'USD' }],
    ] as const) {
      const userId = await newUser();
      await startBundleCheckout(userId, ref);
      stubVerify(verified(ref, userId, over));
      expect((await fulfilCheckout(db, ref)).outcome).toBe('mismatch');
      expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(0);
      await db.close();
      db = undefined as unknown as Db;
    }
  });
});

describe('historical data is untouched', () => {
  it('existing entitlements stay valid, and the legacy bundle still grants both books', async () => {
    const userId = await newUser([MASTER, 'master-kanzul-bundle']);
    expect(await hasEntitlementAccess(db, userId, { kind: 'book', bookId: MASTER })).toBe(true);
    expect(await hasEntitlementAccess(db, userId, { kind: 'book', bookId: KANZUL })).toBe(true);
    expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(2);
  });

  it('a past payment keeps the amount actually paid after the price change', async () => {
    const userId = await newUser();
    await recordInitiating(db, { reference: 'ref_old', userId, productId: KANZUL, amountMinor: 15000, currency: 'GHS', customerEmail: EMAIL });
    expect(await getPayment(db, 'ref_old')).toMatchObject({ amountMinor: 15000, currency: 'GHS' });
  });
});
