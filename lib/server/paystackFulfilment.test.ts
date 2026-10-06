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
import { getPayment, recordInitiating } from './paystackPayments';
import { paystackPriceFor } from './paystackCatalogue';

const ORIGINAL_SECRET = process.env.PAYSTACK_SECRET_KEY;
const EMAIL = 'reader@example.com';

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

/** Stubs global fetch to return exactly one Paystack-shaped verify response. */
function stubVerifyResponse(data: Record<string, unknown>) {
  process.env.PAYSTACK_SECRET_KEY = 'sk_test_fixture_key';
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(
      async () =>
        new Response(JSON.stringify({ status: true, message: 'ok', data }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    ),
  );
}

/** A user plus the ledger row checkout would have written for them. */
async function startCheckout(reference: string, productId = 'kanzul-mikban') {
  db = openDatabase(':memory:');
  const userId = (await getOrCreateUser(db, null)).user.id;
  const price = paystackPriceFor(productId)!;
  await recordInitiating(db, {
    reference,
    userId,
    productId,
    amountMinor: price.minor,
    currency: price.currency,
    customerEmail: EMAIL,
  });
  return { userId, price };
}

function verified(reference: string, userId: string, over: Record<string, unknown> = {}) {
  return {
    id: 4242,
    status: 'success',
    reference,
    amount: 18000,
    currency: 'GHS',
    paid_at: '2026-01-01T00:00:00.000Z',
    customer: { email: EMAIL },
    metadata: { userId, productId: 'kanzul-mikban', entitlement: 'kanzul-mikban' },
    ...over,
  };
}

describe('fulfilCheckout grants real access only for a genuinely verified payment', () => {
  it('grants Kanzul Mikban for a successful GHS 180.00 payment and records the transaction', async () => {
    const { userId } = await startCheckout('ref_ok');
    stubVerifyResponse(verified('ref_ok', userId));

    expect(await fulfilCheckout(db, 'ref_ok')).toEqual({ outcome: 'granted', userId, productId: 'kanzul-mikban' });

    const entitlements = await getActiveEntitlementsForUser(db, userId);
    expect(entitlements).toHaveLength(1);
    expect(entitlements[0]).toMatchObject({ productId: 'kanzul-mikban', source: 'paystack', status: 'active' });

    const payment = await getPayment(db, 'ref_ok');
    expect(payment).toMatchObject({ status: 'success', amountMinor: 18000, currency: 'GHS', customerEmail: EMAIL, userId });
  });

  it('also grants Master of Geomancy at its own GHS 120 price', async () => {
    const { userId } = await startCheckout('ref_master', 'master-of-geomancy-vol-1');
    stubVerifyResponse(
      verified('ref_master', userId, { amount: 12000, metadata: { userId, productId: 'master-of-geomancy-vol-1' } }),
    );
    expect((await fulfilCheckout(db, 'ref_master')).outcome).toBe('granted');
  });

  it('is idempotent — repeated verification (callback + webhook + refresh) grants and records once', async () => {
    const { userId } = await startCheckout('ref_twice');
    stubVerifyResponse(verified('ref_twice', userId));

    await Promise.all([fulfilCheckout(db, 'ref_twice'), fulfilCheckout(db, 'ref_twice')]);
    await fulfilCheckout(db, 'ref_twice');

    expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(1);
    const rows = await db.query('SELECT * FROM paystack_payments WHERE reference = ?', ['ref_twice']);
    expect(rows).toHaveLength(1);
  });

  it('grants nothing for a failed transaction', async () => {
    const { userId } = await startCheckout('ref_failed');
    stubVerifyResponse(verified('ref_failed', userId, { status: 'failed' }));

    expect(await fulfilCheckout(db, 'ref_failed')).toEqual({ outcome: 'not-paid', status: 'failed' });
    expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(0);
    expect((await getPayment(db, 'ref_failed'))?.status).toBe('failed');
  });

  it('grants nothing for a cancelled (abandoned) checkout', async () => {
    const { userId } = await startCheckout('ref_cancel');
    stubVerifyResponse(verified('ref_cancel', userId, { status: 'abandoned' }));

    expect(await fulfilCheckout(db, 'ref_cancel')).toEqual({ outcome: 'not-paid', status: 'abandoned' });
    expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(0);
    expect((await getPayment(db, 'ref_cancel'))?.status).toBe('abandoned');
  });

  it('never downgrades a confirmed payment because of a stale "abandoned" re-check', async () => {
    const { userId } = await startCheckout('ref_stale');
    stubVerifyResponse(verified('ref_stale', userId));
    await fulfilCheckout(db, 'ref_stale');
    stubVerifyResponse(verified('ref_stale', userId, { status: 'abandoned' }));
    await fulfilCheckout(db, 'ref_stale');
    expect((await getPayment(db, 'ref_stale'))?.status).toBe('success');
    expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(1);
  });

  it('refuses a payment for less than the price', async () => {
    const { userId } = await startCheckout('ref_low');
    stubVerifyResponse(verified('ref_low', userId, { amount: 12000 })); // the GHS 120 that must never unlock Kanzul
    expect((await fulfilCheckout(db, 'ref_low')).outcome).toBe('mismatch');
    expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(0);
  });

  it('refuses a payment for MORE than the price — the amount must be exact', async () => {
    const { userId } = await startCheckout('ref_high');
    stubVerifyResponse(verified('ref_high', userId, { amount: 20000 }));
    expect((await fulfilCheckout(db, 'ref_high')).outcome).toBe('mismatch');
    expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(0);
  });

  it('refuses a payment in the wrong currency', async () => {
    const { userId } = await startCheckout('ref_ngn');
    stubVerifyResponse(verified('ref_ngn', userId, { currency: 'NGN' }));
    expect((await fulfilCheckout(db, 'ref_ngn')).outcome).toBe('mismatch');
    expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(0);
  });

  it('refuses a missing currency rather than assuming GHS', async () => {
    const { userId } = await startCheckout('ref_nocur');
    stubVerifyResponse(verified('ref_nocur', userId, { currency: undefined }));
    expect((await fulfilCheckout(db, 'ref_nocur')).outcome).toBe('mismatch');
  });

  it('refuses wrong product metadata (a Master-priced payment cannot unlock Kanzul, nor the reverse)', async () => {
    const { userId } = await startCheckout('ref_prod');
    stubVerifyResponse(verified('ref_prod', userId, { metadata: { userId, productId: 'master-of-geomancy-vol-1' } }));
    expect((await fulfilCheckout(db, 'ref_prod')).outcome).toBe('mismatch');
    expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(0);
  });

  it('refuses mismatched entitlement metadata', async () => {
    const { userId } = await startCheckout('ref_ent');
    stubVerifyResponse(verified('ref_ent', userId, { metadata: { userId, productId: 'kanzul-mikban', entitlement: 'master-kanzul-bundle' } }));
    expect((await fulfilCheckout(db, 'ref_ent')).outcome).toBe('mismatch');
  });

  it('refuses metadata naming a different user than the one who started the checkout', async () => {
    const { userId } = await startCheckout('ref_user');
    const other = (await getOrCreateUser(db, null)).user.id;
    stubVerifyResponse(verified('ref_user', userId, { metadata: { userId: other, productId: 'kanzul-mikban' } }));
    expect((await fulfilCheckout(db, 'ref_user')).outcome).toBe('mismatch');
    expect(await getActiveEntitlementsForUser(db, other)).toHaveLength(0);
    expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(0);
  });

  it('refuses a transaction whose customer email differs from the recorded checkout', async () => {
    const { userId } = await startCheckout('ref_email');
    stubVerifyResponse(verified('ref_email', userId, { customer: { email: 'someone-else@example.com' } }));
    expect((await fulfilCheckout(db, 'ref_email')).outcome).toBe('mismatch');
  });

  it('refuses a reference this server never started, however valid the payment looks', async () => {
    db = openDatabase(':memory:');
    const userId = (await getOrCreateUser(db, null)).user.id;
    stubVerifyResponse(verified('ref_unknown', userId));
    expect(await fulfilCheckout(db, 'ref_unknown')).toMatchObject({ outcome: 'mismatch' });
    expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(0);
  });

  it('refuses a verify response for a different reference than requested', async () => {
    const { userId } = await startCheckout('ref_swap');
    stubVerifyResponse(verified('ref_other', userId));
    expect((await fulfilCheckout(db, 'ref_swap')).outcome).toBe('mismatch');
  });

  it('refuses a product with no Paystack price (the bundle)', async () => {
    db = openDatabase(':memory:');
    const userId = (await getOrCreateUser(db, null)).user.id;
    await recordInitiating(db, {
      reference: 'ref_bundle',
      userId,
      productId: 'master-kanzul-bundle',
      amountMinor: 12000,
      currency: 'GHS',
      customerEmail: EMAIL,
    });
    stubVerifyResponse(verified('ref_bundle', userId, { amount: 12000, metadata: { userId, productId: 'master-kanzul-bundle' } }));
    expect((await fulfilCheckout(db, 'ref_bundle')).outcome).toBe('mismatch');
    expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(0);
  });

  it('reports "unavailable" rather than granting or hard-failing when Paystack cannot be reached', async () => {
    await startCheckout('ref_down');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    expect(await fulfilCheckout(db, 'ref_down')).toEqual({ outcome: 'unavailable' });
  });
});
