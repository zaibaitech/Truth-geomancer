// Renders the REAL /purchase/[productId] page (the Server Component Next
// serves) to HTML for both paid products and checks what a buyer sees BEFORE
// pressing the Paystack button. This exists because component-level tests once
// passed while the live site still served the old email-only checkout.
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openDatabase, type Db } from './db';
import { getOrCreateUser, attachEmailToUser } from './identity';
import { saveCustomerProfile } from './paystackPayments';
import { PRODUCT_CATALOGUE } from '@/lib/access/products';
import { paystackPriceFor, formatPrice } from './paystackCatalogue';

let db: Db;
let current: { id: string; email: string | null } | null;

vi.mock('@/lib/server/db', async (orig) => ({ ...(await orig<typeof import('./db')>()), getDb: () => db }));
vi.mock('@/lib/server/session', () => ({ getCurrentUserIfPresent: async () => current }));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  useRouter: () => ({ refresh() {}, push() {} }),
}));

import ProductPurchasePage from '../../app/purchase/[productId]/page';

const PRODUCTS = [
  { id: 'master-of-geomancy-vol-1', price: 'GH₵100', minor: 10000 },
  { id: 'kanzul-mikban', price: 'GH₵150', minor: 15000 },
];

async function html(productId: string, searchParams?: { payment?: string }) {
  return renderToStaticMarkup(await ProductPurchasePage({ params: { productId }, searchParams }));
}
function input(markup: string, field: string) {
  const tag = markup.match(new RegExp(`<input[^>]*id="pay-${field}"[^>]*>`))?.[0] ?? null;
  return tag ? { tag, value: tag.match(/value="([^"]*)"/)?.[1] ?? '' } : null;
}

beforeEach(async () => {
  db = openDatabase(':memory:');
  current = null;
});
afterEach(async () => {
  await db.close();
});

describe.each(PRODUCTS)('real purchase page: $id', ({ id, price, minor }) => {
  const label = PRODUCT_CATALOGUE.find((p) => p.id === id)!.name;

  it('serves the server-side catalogue price (no browser input can change it)', () => {
    expect(paystackPriceFor(id)).toEqual({ minor, currency: 'GHS' });
    expect(formatPrice(paystackPriceFor(id)!)).toBe(price);
  });

  it('a visitor sees all four customer fields, the product name, the price and the new button — not the old email-only UI', async () => {
    const m = await html(id);
    for (const [field, text] of [['firstName', 'First name'], ['lastName', 'Last name'], ['email', 'Email address'], ['phone', 'Phone number']]) {
      expect(input(m, field), field).not.toBeNull();
      expect(m).toContain(`for="pay-${field}"`);
      expect(m).toContain(text);
    }
    expect(m).toContain(label);
    expect(m).toContain(`Continue to secure payment — ${price}`);
    expect(m).toContain('Secure payment powered by Paystack');
    expect(m).toContain('These details will be used for your payment record and receipt.');
    expect(m).not.toContain('Pay by card');
    expect(m).not.toContain('paystack-email');
  });

  it('is the same shared form for every product (the markup differs only in product name and price)', async () => {
    const strip = (s: string) => s.replace(/GH₵\d+/g, 'PRICE').replace(label, 'NAME');
    const a = strip(await html(id));
    const other = PRODUCTS.find((p) => p.id !== id)!;
    const otherLabel = PRODUCT_CATALOGUE.find((p) => p.id === other.id)!.name;
    const b = (await html(other.id)).replace(/GH₵\d+/g, 'PRICE').replace(otherLabel, 'NAME');
    const fields = (s: string) => s.match(/id="pay-[a-zA-Z]+"/g);
    expect(fields(a)).toEqual(fields(b));
  });

  it('an existing profile pre-fills the fields, and all four are still displayed', async () => {
    const u = (await getOrCreateUser(db, null)).user;
    await attachEmailToUser(db, u.id, 'ama@example.com');
    await saveCustomerProfile(db, u.id, { firstName: 'Ama', lastName: 'Mensah', email: 'ama@example.com', phone: '+233241234567' });
    current = { id: u.id, email: 'ama@example.com' };
    const m = await html(id);
    expect(input(m, 'firstName')?.value).toBe('Ama');
    expect(input(m, 'lastName')?.value).toBe('Mensah');
    expect(input(m, 'email')?.value).toBe('ama@example.com');
    expect(input(m, 'phone')?.value).toBe('+233241234567');
  });

  it('missing profile fields stay visible and empty; the account email still pre-fills', async () => {
    const u = (await getOrCreateUser(db, null)).user;
    current = { id: u.id, email: 'only-email@example.com' };
    const m = await html(id);
    expect(input(m, 'email')?.value).toBe('only-email@example.com');
    for (const f of ['firstName', 'lastName', 'phone']) expect(input(m, f)?.value, f).toBe('');
  });

  it('keeps manual payment separate, under "or pay another way"', async () => {
    const m = await html(id);
    expect(m).toContain('— or pay another way —');
    expect(m.indexOf('Continue to secure payment')).toBeLessThan(m.indexOf('— or pay another way —'));
  });

  it('?payment=success does not show activation for a user without the entitlement', async () => {
    const u = (await getOrCreateUser(db, null)).user;
    current = { id: u.id, email: null };
    const m = await html(id, { payment: 'success' });
    expect(m).not.toContain('has been activated');
    expect(input(m, 'firstName')).not.toBeNull();
  });
});
