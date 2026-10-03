// What can be bought by card, and for how much — deliberately NOT part of
// lib/access/products.ts's Product type. That type has no price field on
// purpose (see its own comment: "none exists in the repository today and
// none is invented here"), because the manual payment-request workflow
// never needed one — the author eyeballs whatever a buyer claims to have
// sent. Paystack checkout genuinely does need a real number to charge, so
// it lives here, scoped to exactly the two figures the author actually
// gave, rather than widening Product's own contract for every caller of it.
//
// A productId with no entry here simply has no "pay by card" option — the
// manual request form (components/purchase/PaymentRequestForm.tsx) is still
// available for it. The bundle product (master-kanzul-bundle) has no entry
// because no bundle price has been given; inventing one would repeat
// exactly the mistake products.ts's own design note warns against.
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
  'master-of-geomancy-vol-1': ghs(100),
  'kanzul-mikban': ghs(150),
};

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
