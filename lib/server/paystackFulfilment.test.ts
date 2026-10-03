// Tests for fulfilCheckout — the one function both the Paystack webhook and
// callback routes call to turn a verified payment into a real entitlement.
// Real ':memory:' database per test (matching this codebase's own
// convention — see adminAuth.test.ts); Paystack's own API is mocked at the
// fetch boundary, never the function under test's own logic.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { openDatabase, type Db } from './db';
import { getOrCreateUser } from './identity';
import { getActiveEntitlementsForUser } from './entitlements';
import { fulfilCheckout } from './paystackFulfilment';

const ORIGINAL_SECRET = process.env.PAYSTACK_SECRET_KEY;

let db: Db;
afterEach(async () => {
  try {
    await db?.close();
  } catch {
    // Not open for a test that never called openDatabase(); nothing to clean up.
  }
  vi.unstubAllGlobals();
  if (ORIGINAL_SECRET === undefined) delete process.env.PAYSTACK_SECRET_KEY;
  else process.env.PAYSTACK_SECRET_KEY = ORIGINAL_SECRET;
});

/** Stubs global fetch to return exactly one Paystack-shaped verify response,
 * for exactly one call — matching what verifyTransaction() alone issues. */
function stubVerifyResponse(data: Record<string, unknown>) {
  process.env.PAYSTACK_SECRET_KEY = 'sk_test_fixture_key';
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: true, message: 'ok', data }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  );
}

describe('fulfilCheckout grants real access only for a genuinely verified payment', () => {
  it('grants the product when Paystack reports success, for the right amount, in the right currency', async () => {
    db = openDatabase(':memory:');
    const userId = (await getOrCreateUser(db, null)).user.id;
    stubVerifyResponse({
      status: 'success',
      amount: 10000, // GHS 100.00 in pesewas — exactly master-of-geomancy-vol-1's price
      currency: 'GHS',
      customer: { email: 'reader@example.com' },
      metadata: { userId, productId: 'master-of-geomancy-vol-1' },
    });

    const result = await fulfilCheckout(db, 'tg_test_ref_1');
    expect(result).toEqual({ outcome: 'granted', userId, productId: 'master-of-geomancy-vol-1' });

    const entitlements = await getActiveEntitlementsForUser(db, userId);
    expect(entitlements).toHaveLength(1);
    expect(entitlements[0]).toMatchObject({ productId: 'master-of-geomancy-vol-1', source: 'paystack', status: 'active' });
  });

  it('is idempotent — calling it twice for the same successful reference grants only once', async () => {
    db = openDatabase(':memory:');
    const userId = (await getOrCreateUser(db, null)).user.id;
    stubVerifyResponse({
      status: 'success',
      amount: 15000,
      currency: 'GHS',
      customer: { email: 'reader@example.com' },
      metadata: { userId, productId: 'kanzul-mikban' },
    });

    await fulfilCheckout(db, 'tg_test_ref_2');
    await fulfilCheckout(db, 'tg_test_ref_2');

    const entitlements = await getActiveEntitlementsForUser(db, userId);
    expect(entitlements).toHaveLength(1);
  });

  it('grants nothing when Paystack reports anything other than success', async () => {
    db = openDatabase(':memory:');
    const userId = (await getOrCreateUser(db, null)).user.id;
    stubVerifyResponse({
      status: 'abandoned',
      amount: 10000,
      currency: 'GHS',
      customer: { email: 'reader@example.com' },
      metadata: { userId, productId: 'master-of-geomancy-vol-1' },
    });

    expect(await fulfilCheckout(db, 'tg_test_ref_3')).toEqual({ outcome: 'not-paid', status: 'abandoned' });
    expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(0);
  });

  it('refuses a verified payment for less than the real price, even though Paystack says it succeeded', async () => {
    db = openDatabase(':memory:');
    const userId = (await getOrCreateUser(db, null)).user.id;
    stubVerifyResponse({
      status: 'success',
      amount: 100, // way under kanzul-mikban's real GHS 150 price
      currency: 'GHS',
      customer: { email: 'reader@example.com' },
      metadata: { userId, productId: 'kanzul-mikban' },
    });

    const result = await fulfilCheckout(db, 'tg_test_ref_4');
    expect(result.outcome).toBe('mismatch');
    expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(0);
  });

  it('refuses a verified payment in the wrong currency', async () => {
    db = openDatabase(':memory:');
    const userId = (await getOrCreateUser(db, null)).user.id;
    stubVerifyResponse({
      status: 'success',
      amount: 10000,
      currency: 'NGN',
      customer: { email: 'reader@example.com' },
      metadata: { userId, productId: 'master-of-geomancy-vol-1' },
    });

    const result = await fulfilCheckout(db, 'tg_test_ref_5');
    expect(result.outcome).toBe('mismatch');
    expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(0);
  });

  it('refuses a verified payment missing its userId/productId metadata — never guesses who it was for', async () => {
    db = openDatabase(':memory:');
    stubVerifyResponse({
      status: 'success',
      amount: 10000,
      currency: 'GHS',
      customer: { email: 'reader@example.com' },
      metadata: null,
    });

    const result = await fulfilCheckout(db, 'tg_test_ref_6');
    expect(result.outcome).toBe('mismatch');
  });

  it('refuses a productId that has no Paystack price configured, even with otherwise-valid metadata', async () => {
    db = openDatabase(':memory:');
    const userId = (await getOrCreateUser(db, null)).user.id;
    stubVerifyResponse({
      status: 'success',
      amount: 10000,
      currency: 'GHS',
      customer: { email: 'reader@example.com' },
      // master-kanzul-bundle has no author-given price — see paystackCatalogue.ts
      metadata: { userId, productId: 'master-kanzul-bundle' },
    });

    const result = await fulfilCheckout(db, 'tg_test_ref_7');
    expect(result.outcome).toBe('mismatch');
    expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(0);
  });

  it('reports "unavailable" rather than granting or hard-failing when Paystack cannot be reached', async () => {
    db = openDatabase(':memory:');
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_fixture_key';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    expect(await fulfilCheckout(db, 'tg_test_ref_8')).toEqual({ outcome: 'unavailable' });
  });
});
