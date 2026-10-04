// Route-level tests for the Paystack checkout, callback and webhook handlers,
// run against a real in-memory database with only Paystack's HTTP API (the
// fetch boundary) and the cookie-reading session stubbed.
import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openDatabase, type Db } from './db';
import { getOrCreateUser } from './identity';
import { canAccessForUser } from './accessService';
import { getActiveEntitlementsForUser, grantEntitlement } from './entitlements';
import { getCustomerProfile } from './paystackPayments';
import { paystackMode } from './paystack';

let db: Db;
let userId: string;

vi.mock('@/lib/server/db', async (orig) => ({ ...(await orig<typeof import('./db')>()), getDb: () => db }));
vi.mock('@/lib/server/session', () => ({ getCurrentUser: async () => ({ id: userId }) }));

import { POST as checkout } from '../../app/api/paystack/checkout/route';
import { GET as callback } from '../../app/api/paystack/callback/route';
import { POST as webhook } from '../../app/api/paystack/webhook/route';

const KEY = 'sk_test_fixture_key';
const DETAILS = { firstName: 'Ama', lastName: 'Mensah', email: 'ama@example.com', phone: '+233 24 123 4567' };

interface Call {
  url: string;
  body: Record<string, unknown> | null;
}
let calls: Call[];
let verifyData: Record<string, unknown> | null;

function ok(data: unknown) {
  return new Response(JSON.stringify({ status: true, message: 'ok', data }), { status: 200 });
}

beforeEach(async () => {
  db = openDatabase(':memory:');
  userId = (await getOrCreateUser(db, null)).user.id;
  process.env.PAYSTACK_SECRET_KEY = KEY;
  process.env.APP_BASE_URL = 'https://app.example.com';
  calls = [];
  verifyData = null;
  let n = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(String(init.body)) : null;
      calls.push({ url, body });
      if (url.endsWith('/customer') && init?.method === 'POST') {
        return ok({ customer_code: 'CUS_x', first_name: body.first_name, last_name: body.last_name, phone: body.phone });
      }
      if (url.includes('/customer/')) return ok({ customer_code: 'CUS_x' });
      if (url.endsWith('/transaction/initialize')) {
        n += 1;
        return ok({ authorization_url: `https://checkout.paystack.com/abc${n}`, access_code: 'ac', reference: body.reference });
      }
      return ok(verifyData);
    }),
  );
});

afterEach(async () => {
  vi.unstubAllGlobals();
  delete process.env.PAYSTACK_SECRET_KEY;
  delete process.env.APP_BASE_URL;
  await db.close();
});

function post(body: unknown) {
  return checkout(new Request('https://app.example.com/api/paystack/checkout', { method: 'POST', body: JSON.stringify(body) }));
}
const initCalls = () => calls.filter((c) => c.url.endsWith('/transaction/initialize'));

describe('checkout: the server decides the amount and currency', () => {
  it('charges GHS 150 (15000 pesewas) for Kanzul Mikban and passes the customer to Paystack', async () => {
    const res = await post({ productId: 'kanzul-mikban', ...DETAILS });
    expect(res.status).toBe(200);
    expect((await res.json()).authorizationUrl).toMatch(/^https:\/\/checkout\.paystack\.com\//);

    expect(initCalls()).toHaveLength(1);
    const sent = initCalls()[0].body!;
    expect(sent).toMatchObject({
      amount: '15000',
      currency: 'GHS',
      email: 'ama@example.com',
      first_name: 'Ama',
      last_name: 'Mensah',
      phone: '+233241234567',
      callback_url: 'https://app.example.com/api/paystack/callback',
      metadata: { userId, productId: 'kanzul-mikban', entitlement: 'kanzul-mikban' },
    });
    // Paystack Checkout must be free to offer every payment method.
    expect(sent).not.toHaveProperty('channels');
  });

  it('ignores a client-supplied amount, currency, userId or price', async () => {
    await post({ productId: 'kanzul-mikban', ...DETAILS, amount: 1, price: 1, amountMinor: 1, currency: 'USD', userId: 'attacker' });
    expect(initCalls()[0].body).toMatchObject({ amount: '15000', currency: 'GHS', metadata: { userId } });
  });

  it('charges Master of Geomancy its own GHS 100 (10000 pesewas), through the same shared route', async () => {
    const res = await post({ productId: 'master-of-geomancy-vol-1', ...DETAILS });
    expect(res.status).toBe(200);
    expect(initCalls()[0].body).toMatchObject({
      amount: '10000',
      currency: 'GHS',
      email: 'ama@example.com',
      first_name: 'Ama',
      last_name: 'Mensah',
      phone: '+233241234567',
      metadata: { userId, productId: 'master-of-geomancy-vol-1', entitlement: 'master-of-geomancy-vol-1' },
    });
  });

  it('puts the name and phone on Paystack’s customer record before initializing, and a sync failure never blocks checkout', async () => {
    await post({ productId: 'kanzul-mikban', ...DETAILS });
    const customerCall = calls.find((c) => c.url.endsWith('/customer'))!;
    expect(customerCall.body).toEqual({ email: 'ama@example.com', first_name: 'Ama', last_name: 'Mensah', phone: '+233241234567' });
    expect(calls.indexOf(customerCall)).toBeLessThan(calls.findIndex((c) => c.url.endsWith('/transaction/initialize')));

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const orig = globalThis.fetch;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('/customer')) return new Response(JSON.stringify({ status: false, message: 'down' }), { status: 500 });
      return (orig as typeof fetch)(url, init);
    }));
    // Second product, so the earlier open checkout is not simply resumed.
    const res = await post({ productId: 'master-of-geomancy-vol-1', ...DETAILS });
    spy.mockRestore();
    expect(res.status).toBe(200);
  });

  it('updates the existing profile on a later checkout instead of adding a second row, always under the session user', async () => {
    await post({ productId: 'kanzul-mikban', ...DETAILS });
    await post({ productId: 'master-of-geomancy-vol-1', ...DETAILS, firstName: 'Abena', phone: '0241234567', userId: 'someone-else' });
    const rows = await db.query<{ user_id: string; first_name: string; phone: string }>('SELECT * FROM customer_profiles');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ user_id: userId, first_name: 'Abena', phone: '0241234567' });
  });

  it('saves the details for next time', async () => {
    await post({ productId: 'kanzul-mikban', ...DETAILS });
    expect(await getCustomerProfile(db, userId)).toEqual({ firstName: 'Ama', lastName: 'Mensah', phone: '+233241234567' });
  });

  it.each(['firstName', 'lastName', 'email', 'phone'])('rejects missing %s without calling Paystack', async (field) => {
    const res = await post({ productId: 'kanzul-mikban', ...DETAILS, [field]: '  ' });
    expect(res.status).toBe(400);
    expect(Object.keys((await res.json()).fieldErrors)).toEqual([field]);
    expect(calls).toHaveLength(0);
  });

  it('rejects an invalid phone number', async () => {
    const res = await post({ productId: 'kanzul-mikban', ...DETAILS, phone: 'call me' });
    expect(res.status).toBe(400);
  });

  it('refuses a product with no price and an unknown product', async () => {
    expect((await post({ productId: 'master-kanzul-bundle', ...DETAILS })).status).toBe(404);
    expect((await post({ productId: 'nope', ...DETAILS })).status).toBe(404);
    expect(calls).toHaveLength(0);
  });

  it('does not start a payment for a user who already owns the product', async () => {
    await grantEntitlement(db, userId, 'kanzul-mikban', 'promo');
    const res = await post({ productId: 'kanzul-mikban', ...DETAILS });
    expect(await res.json()).toEqual({ alreadyOwned: true });
    expect(calls).toHaveLength(0);
  });

  it('a double-click resumes the open checkout instead of starting a second transaction', async () => {
    const first = await (await post({ productId: 'kanzul-mikban', ...DETAILS })).json();
    const second = await (await post({ productId: 'kanzul-mikban', ...DETAILS })).json();
    expect(initCalls()).toHaveLength(1);
    expect(second.authorizationUrl).toBe(first.authorizationUrl);
    expect(second.reference).toBe(first.reference);
  });

  it('reports a Paystack initialization failure cleanly, grants nothing, and allows a retry', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ status: false, message: 'boom' }), { status: 400 })));
    const res = await post({ productId: 'kanzul-mikban', ...DETAILS });
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/Could not start secure payment/);
    expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(0);

    // The failed attempt is not "open": the next click starts afresh.
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init?: RequestInit) => ok({ authorization_url: 'https://checkout.paystack.com/retry', access_code: 'x', reference: JSON.parse(String(init?.body)).reference })));
    expect((await post({ productId: 'kanzul-mikban', ...DETAILS })).status).toBe(200);
  });

  it('never logs the secret key or customer details on failure', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ status: false, message: 'boom' }), { status: 400 })));
    await post({ productId: 'kanzul-mikban', ...DETAILS });
    const logged = JSON.stringify(spy.mock.calls);
    spy.mockRestore();
    expect(logged).not.toContain(KEY);
    expect(logged).not.toContain('ama@example.com');
    expect(logged).not.toContain('233241234567');
  });
});

describe('end to end: checkout → verify → entitlement → access', () => {
  async function startAndPay(over: Record<string, unknown> = {}) {
    const { reference } = await (await post({ productId: 'kanzul-mikban', ...DETAILS })).json();
    verifyData = {
      id: 99,
      status: 'success',
      reference,
      amount: 15000,
      currency: 'GHS',
      paid_at: '2026-01-01T00:00:00Z',
      customer: { email: DETAILS.email },
      metadata: { userId, productId: 'kanzul-mikban', entitlement: 'kanzul-mikban' },
      ...over,
    };
    return reference as string;
  }
  const signed = (reference: string, event = 'charge.success') => {
    const raw = JSON.stringify({ event, data: { reference } });
    return new Request('https://app.example.com/api/paystack/webhook', {
      method: 'POST',
      body: raw,
      headers: { 'x-paystack-signature': createHmac('sha512', KEY).update(raw).digest('hex') },
    });
  };

  it('a user without the entitlement cannot access Kanzul; after a verified payment they can', async () => {
    expect(await canAccessForUser(db, userId, { kind: 'book', bookId: 'kanzul-mikban' })).toBe(false);
    const reference = await startAndPay();
    const res = await callback(new Request(`https://app.example.com/api/paystack/callback?reference=${reference}`));
    expect(res.headers.get('location')).toBe('https://app.example.com/purchase/kanzul-mikban?payment=success');
    expect(await canAccessForUser(db, userId, { kind: 'book', bookId: 'kanzul-mikban' })).toBe(true);
  });

  it('the callback never grants on its own claim: a cancelled checkout returns "cancelled" and no access', async () => {
    const reference = await startAndPay({ status: 'abandoned' });
    const res = await callback(new Request(`https://app.example.com/api/paystack/callback?trxref=${reference}`));
    expect(res.headers.get('location')).toBe('https://app.example.com/purchase/kanzul-mikban?payment=cancelled');
    expect(await canAccessForUser(db, userId, { kind: 'book', bookId: 'kanzul-mikban' })).toBe(false);
  });

  it('a failed payment returns "failed"; an ongoing one returns "pending"', async () => {
    let reference = await startAndPay({ status: 'failed' });
    expect((await callback(new Request(`https://x/cb?reference=${reference}`))).headers.get('location')).toContain('payment=failed');
    reference = await startAndPay({ status: 'ongoing' });
    expect((await callback(new Request(`https://x/cb?reference=${reference}`))).headers.get('location')).toContain('payment=pending');
    expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(0);
  });

  it('an unknown reference redirects without granting', async () => {
    verifyData = { status: 'success', reference: 'forged', amount: 15000, currency: 'GHS', customer: { email: DETAILS.email }, metadata: { userId, productId: 'kanzul-mikban' } };
    const res = await callback(new Request('https://x/cb?reference=forged'));
    expect(res.headers.get('location')).toBe('https://app.example.com/purchase');
    expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(0);
  });

  it('a duplicate webhook delivery (plus the callback) creates exactly one entitlement', async () => {
    const reference = await startAndPay();
    expect(await (await webhook(signed(reference))).json()).toEqual({ outcome: 'granted' });
    expect(await (await webhook(signed(reference))).json()).toEqual({ outcome: 'granted' });
    await callback(new Request(`https://x/cb?reference=${reference}`));
    expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(1);
    expect(await db.query('SELECT 1 FROM paystack_payments WHERE reference = ?', [reference])).toHaveLength(1);
  });

  it('a webhook with a missing or wrong signature is rejected and grants nothing', async () => {
    const reference = await startAndPay();
    const raw = JSON.stringify({ event: 'charge.success', data: { reference } });
    const bad = await webhook(new Request('https://x/wh', { method: 'POST', body: raw, headers: { 'x-paystack-signature': 'deadbeef' } }));
    const none = await webhook(new Request('https://x/wh', { method: 'POST', body: raw }));
    expect(bad.status).toBe(401);
    expect(none.status).toBe(401);
    expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(0);
  });

  it('a validly signed event other than charge.success is acknowledged and ignored', async () => {
    const reference = await startAndPay();
    const res = await webhook(signed(reference, 'charge.failed'));
    expect(res.status).toBe(200);
    expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(0);
  });

  it('a webhook for the wrong amount grants nothing', async () => {
    const reference = await startAndPay({ amount: 10000 });
    expect(await (await webhook(signed(reference))).json()).toEqual({ outcome: 'mismatch' });
    expect(await getActiveEntitlementsForUser(db, userId)).toHaveLength(0);
  });
});

describe('test / live configuration is never mixed', () => {
  it('classifies keys by prefix', () => {
    expect(paystackMode('sk_test_x')).toBe('test');
    expect(paystackMode('sk_live_x')).toBe('live');
    expect(paystackMode('pk_test_x')).toBeNull();
    expect(paystackMode(undefined)).toBeNull();
  });

  it('refuses a live key outside production, and a key that is neither test nor live', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    process.env.PAYSTACK_SECRET_KEY = 'sk_live_fixture';
    expect((await post({ productId: 'kanzul-mikban', ...DETAILS })).status).toBe(502);
    process.env.PAYSTACK_SECRET_KEY = 'whatever';
    expect((await post({ productId: 'kanzul-mikban', ...DETAILS })).status).toBe(502);
    expect(calls).toHaveLength(0);
    vi.restoreAllMocks();
  });

  it('accepts a live key in production (switching is environment-only)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.PAYSTACK_SECRET_KEY = 'sk_live_fixture';
    expect((await post({ productId: 'kanzul-mikban', ...DETAILS })).status).toBe(200);
    vi.unstubAllEnvs();
  });
});
