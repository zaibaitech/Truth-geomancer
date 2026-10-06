// What can be bought by card, and for how much — deliberately NOT part of
// lib/access/products.ts's Product type. That type has no price field on
// purpose (see its own comment: "none exists in the repository today and
// none is invented here"), because the manual payment-request workflow
// never needed one — the author eyeballs whatever a buyer claims to have
// sent. Paystack checkout genuinely does need a real number to charge, so
// it lives here, rather than widening Product's own contract for every
// caller of it. The checkout route resolves the price from this table only;
// a client-supplied amount is never read.
//
// A productId with no entry here simply has no "pay by card" option — the
// manual request form (components/purchase/PaymentRequestForm.tsx) is still
// available for it. The legacy bundle (master-kanzul-bundle) has no entry:
// it is no longer sold, only honoured for existing holders.
export type Currency = 'GHS';

export interface PaystackPrice {
  /** Minor units — pesewas for GHS. Always a non-negative integer. */
  minor: number;
  currency: Currency;
}

const MINOR_PER_MAJOR = 100;

function ghs(amount: number): PaystackPrice {
  return { minor: Math.round(amount * MINOR_PER_MAJOR), currency: 'GHS' };
}

const PRICES: Record<string, PaystackPrice> = {
  'master-of-geomancy-vol-1': ghs(120),
  'kanzul-mikban': ghs(180),
  'complete-geomancy-library': ghs(250),
};

/** Sum of the members' individual prices minus the bundle price, or null if
 * any price is missing. Display only — never used to charge. */
export function bundleSaving(bundleId: string, memberIds: string[]): PaystackPrice | null {
  const bundle = PRICES[bundleId];
  const members = memberIds.map((id) => PRICES[id]);
  if (!bundle || members.some((m) => !m)) return null;
  const individual = members.reduce((sum, m) => sum + m.minor, 0);
  return { minor: individual - bundle.minor, currency: bundle.currency };
}

export function paystackPriceFor(productId: string): PaystackPrice | null {
  return PRICES[productId] ?? null;
}

export function formatPrice({ minor, currency }: PaystackPrice): string {
  const symbol = currency === 'GHS' ? 'GH₵' : currency;
  const major = minor / MINOR_PER_MAJOR;
  const whole = minor % MINOR_PER_MAJOR === 0;
  return (
    symbol +
    major.toLocaleString('en-GH', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })
  );
}
