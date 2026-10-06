// Kanzul Mikban authorization audit — every server resource that can return
// Kanzul content, exercised through its real route handler against a real
// in-memory database, as (a) a visitor with no entitlement, (b) a holder of a
// DIFFERENT product, (c) a user with only a payment-side signal (a pending
// manual request, an unfulfilled Paystack ledger row), and (d) a genuine
// Kanzul entitlement holder. Only the cookie-reading session is stubbed.
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openDatabase, type Db } from './db';
import { getOrCreateUser } from './identity';
import { grantEntitlement } from './entitlements';
import { recordInitiating } from './paystackPayments';
import { createPaymentRequest } from './paymentRequests';
import { KM_CHAPTERS } from './content/kanzulMikban';
import { fixtureChart } from '@/lib/raml/engine/__tests__/fixtures';

let db: Db;
let currentUser: string;
vi.mock('@/lib/server/db', async (orig) => ({ ...(await orig<typeof import('./db')>()), getDb: () => db }));
vi.mock('@/lib/server/session', () => ({
  getCurrentUser: async () => ({ id: currentUser }),
  getCurrentUserIfPresent: async () => ({ id: currentUser }),
}));

import { GET as chapterRoute } from '../../app/api/books/[bookId]/chapters/[chapterId]/route';
import { GET as offlineRoute } from '../../app/api/books/[bookId]/offline/route';
import { POST as practiceRoute } from '../../app/api/raml/practice/route';
import { POST as readingRoute } from '../../app/api/raml/reading/route';
import { POST as verdictsRoute } from '../../app/api/raml/reading-verdicts/route';
import { GET as callbackRoute } from '../../app/api/paystack/callback/route';

const CHART = fixtureChart();
const INTENTION = 'if-you-will-win-a-case-in-court'; // a Kanzul-only (not free-sample) question
const PRACTICE = { chapterId: 'if-you-want-to-know-if-you-will', methodId: 'money-method-1' };
const json = (body: unknown) => new Request('https://x/api', { method: 'POST', body: JSON.stringify(body) });

async function newUser() {
  return (await getOrCreateUser(db, null)).user.id;
}

beforeEach(() => {
  db = openDatabase(':memory:');
});
afterEach(async () => {
  vi.unstubAllGlobals();
  await db.close();
});

/** Every Kanzul-content API, as [name, call, success-status]. */
function resources() {
  return [
    ...KM_CHAPTERS.map((c) => [
      `chapter ${c.id}`,
      () => chapterRoute(new Request('https://x'), { params: { bookId: 'kanzul-mikban', chapterId: c.id } }),
      200,
    ] as const),
    ['whole-book offline download', () => offlineRoute(new Request('https://x'), { params: { bookId: 'kanzul-mikban' } }), 200] as const,
    ['method practice (intro)', () => practiceRoute(json(PRACTICE)), 200] as const,
    ['method practice (with chart)', () => practiceRoute(json({ ...PRACTICE, chart: CHART })), 200] as const,
    ['reading', () => readingRoute(json({ intentionId: INTENTION, chart: CHART })), 200] as const,
    ['reading verdicts', () => verdictsRoute(json({ intentionId: INTENTION, chart: CHART })), 200] as const,
  ];
}

async function expectDenied(label: string) {
  for (const [name, call] of resources()) {
    const res = await call();
    expect(res.status, `${label}: ${name}`).toBe(403);
    // A denial never carries protected text.
    const body = await res.text();
    expect(body, `${label}: ${name}`).not.toContain(KM_CHAPTERS[0].paragraphs[0].slice(0, 40));
  }
}

describe('Kanzul API resources — denied without the Kanzul entitlement', () => {
  it('a brand-new / anonymous visitor is denied everywhere', async () => {
    currentUser = await newUser();
    await expectDenied('anonymous');
  });

  it('a holder of a different product (Master of Geomancy) is denied everywhere', async () => {
    currentUser = await newUser();
    await grantEntitlement(db, currentUser, 'master-of-geomancy-vol-1', 'promo');
    await expectDenied('master-only');
  });

  it('a revoked Kanzul entitlement is denied', async () => {
    currentUser = await newUser();
    const { entitlement } = await grantEntitlement(db, currentUser, 'kanzul-mikban', 'promo');
    await db.execute("UPDATE entitlements SET status = 'revoked' WHERE id = ?", [entitlement.id]);
    await expectDenied('revoked');
  });

  it('payment status alone grants nothing: a pending manual request and a "pending"/"success" Paystack ledger row', async () => {
    currentUser = await newUser();
    await createPaymentRequest(db, currentUser, 'kanzul-mikban', 'REF-123');
    await recordInitiating(db, {
      reference: 'ref_pending',
      userId: currentUser,
      productId: 'kanzul-mikban',
      amountMinor: 18000,
      currency: 'GHS',
      customerEmail: 'a@b.co',
    });
    await db.execute("UPDATE paystack_payments SET status = 'success'");
    await expectDenied('payment-signal-only');
  });

  it('one user’s entitlement never serves another user', async () => {
    const owner = await newUser();
    await grantEntitlement(db, owner, 'kanzul-mikban', 'promo');
    currentUser = await newUser();
    await expectDenied('other-user');
  });

  it('unknown chapters / books return 404 without revealing content', async () => {
    currentUser = await newUser();
    expect((await chapterRoute(new Request('https://x'), { params: { bookId: 'kanzul-mikban', chapterId: 'nope' } })).status).toBe(404);
    expect((await offlineRoute(new Request('https://x'), { params: { bookId: 'nope' } })).status).toBe(404);
  });
});

describe('Kanzul API resources — allowed with the Kanzul entitlement', () => {
  it('every resource succeeds for a genuine holder', async () => {
    currentUser = await newUser();
    await grantEntitlement(db, currentUser, 'kanzul-mikban', 'paystack');
    for (const [name, call, ok] of resources()) {
      expect((await call()).status, name).toBe(ok);
    }
  });

  it('the chapter route returns the real text and sets private, no-store', async () => {
    currentUser = await newUser();
    await grantEntitlement(db, currentUser, 'kanzul-mikban', 'paystack');
    const res = await chapterRoute(new Request('https://x'), { params: { bookId: 'kanzul-mikban', chapterId: KM_CHAPTERS[0].id } });
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    expect(JSON.stringify(await res.json())).toContain(KM_CHAPTERS[0].paragraphs[0].slice(0, 40));
  });
});

describe('the client cannot choose identity, product or success', () => {
  it('a client-supplied userId / entitlement / bookId in the body or query is never read', async () => {
    const owner = await newUser();
    await grantEntitlement(db, owner, 'kanzul-mikban', 'promo');
    currentUser = await newUser();
    const res = await practiceRoute(
      new Request('https://x/api?userId=' + owner, {
        method: 'POST',
        headers: { 'x-user-id': owner },
        body: JSON.stringify({ ...PRACTICE, userId: owner, entitled: true, bookId: 'kanzul-mikban' }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it('?payment=success is only wording: the callback and the purchase page never grant, and the page gates "activated" on live status', () => {
    const page = readFileSync('app/purchase/[productId]/page.tsx', 'utf-8');
    expect(page).not.toMatch(/grantEntitlement/);
    expect(page).not.toMatch(/fulfilCheckout/);
    // The success wording sits inside the status === 'active' branch.
    const active = page.indexOf("status === 'active'");
    const success = page.indexOf("paymentHint === 'success'");
    const pending = page.indexOf("status === 'pending' && mostRecent");
    expect(active).toBeGreaterThan(-1);
    expect(success).toBeGreaterThan(active);
    expect(success).toBeLessThan(pending);
  });

  it('the Paystack callback never uses the session user: another user’s reference cannot be redeemed by this session', async () => {
    const payer = await newUser();
    const attacker = await newUser();
    currentUser = attacker;
    await recordInitiating(db, {
      reference: 'ref_payer',
      userId: payer,
      productId: 'kanzul-mikban',
      amountMinor: 18000,
      currency: 'GHS',
      customerEmail: 'payer@example.com',
    });
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_fixture_key';
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              status: true,
              data: {
                id: 1,
                status: 'success',
                reference: 'ref_payer',
                amount: 18000,
                currency: 'GHS',
                paid_at: null,
                customer: { email: 'payer@example.com' },
                metadata: { userId: payer, productId: 'kanzul-mikban' },
              },
            }),
            { status: 200 },
          ),
      ),
    );
    await callbackRoute(new Request('https://x/api/paystack/callback?reference=ref_payer'));
    // The entitlement went to the user recorded at checkout, never the caller.
    const rows = await db.query<{ user_id: string }>("SELECT user_id FROM entitlements WHERE product_id = 'kanzul-mikban'");
    expect(rows.map((r) => r.user_id)).toEqual([payer]);
    currentUser = attacker;
    await expectDenied('reference-substitution attacker');
    delete process.env.PAYSTACK_SECRET_KEY;
  });

  it('a payment for another product cannot be relabelled as Kanzul (ledger product is authoritative)', async () => {
    const user = await newUser();
    currentUser = user;
    await recordInitiating(db, {
      reference: 'ref_master',
      userId: user,
      productId: 'master-of-geomancy-vol-1',
      amountMinor: 12000,
      currency: 'GHS',
      customerEmail: 'a@b.co',
    });
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_fixture_key';
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              status: true,
              data: {
                id: 2,
                status: 'success',
                reference: 'ref_master',
                amount: 18000, // tampered to look like Kanzul's price
                currency: 'GHS',
                customer: { email: 'a@b.co' },
                metadata: { userId: user, productId: 'kanzul-mikban' }, // tampered label
              },
            }),
            { status: 200 },
          ),
      ),
    );
    await callbackRoute(new Request('https://x/api/paystack/callback?reference=ref_master'));
    delete process.env.PAYSTACK_SECRET_KEY;
    await expectDenied('product-swap');
  });
});

describe('structural: no Kanzul route returns content without an entitlement check', () => {
  const ROUTES = [
    'app/api/books/[bookId]/chapters/[chapterId]/route.ts',
    'app/api/books/[bookId]/offline/route.ts',
    'app/api/raml/practice/route.ts',
    'app/api/raml/reading/route.ts',
    'app/api/raml/reading-verdicts/route.ts',
  ];
  it.each(ROUTES)('%s never reads userId or entitlement from the request', (file) => {
    const src = readFileSync(file, 'utf-8');
    expect(src).not.toMatch(/searchParams|headers\.get\(['"]x-user|body\.userId|\buserId\s*[,}]\s*=\s*body/);
    expect(src).toMatch(/getCurrentUser\(\)/);
  });
});
