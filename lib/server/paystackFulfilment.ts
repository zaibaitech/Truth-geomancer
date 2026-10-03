// Turning a verified Paystack payment into a real entitlement — the one
// function both the webhook and the browser-return callback call, so a
// reader is covered whichever one actually reaches the server first (the
// webhook is reliable but can lag; the callback is instant but only fires
// if the browser comes back). Both paths are safe to call for the same
// reference any number of times: grantEntitlement() is already idempotent
// (lib/server/entitlements.ts), so a retried webhook delivery or a
// refreshed callback page never double-grants or errors.
import { verifyTransaction, type VerifiedTransaction } from './paystack';
import { paystackPriceFor } from './paystackCatalogue';
import { grantEntitlement } from './entitlements';
import { PRODUCT_CATALOGUE } from '@/lib/access/products';
import type { Db } from './db';

export type FulfilResult =
  | { outcome: 'granted'; userId: string; productId: string }
  | { outcome: 'not-paid'; status: string }
  | { outcome: 'mismatch'; detail: string }
  | { outcome: 'unavailable' };

/**
 * Verify `reference` with Paystack and grant the product if it really was
 * paid, for the full amount, by the user named in Paystack's OWN record of
 * the transaction's metadata.
 *
 * Nothing here trusts a webhook payload or a redirect's query string for
 * anything beyond "go check this reference" — identity, amount and status
 * all come from calling verifyTransaction() fresh, every time.
 */
export async function fulfilCheckout(db: Db, reference: string): Promise<FulfilResult> {
  let txn: VerifiedTransaction;
  try {
    txn = await verifyTransaction(reference);
  } catch {
    // Paystack could not confirm it right now — an API hiccup is not
    // evidence the payment failed, so nothing is granted and nothing is
    // reported as a hard failure; the caller's normal retry (webhook
    // redelivery, or the buyer reloading the outcome page) tries again.
    return { outcome: 'unavailable' };
  }

  if (txn.status !== 'success') {
    return { outcome: 'not-paid', status: txn.status };
  }

  const userId = txn.metadata?.userId;
  const productId = txn.metadata?.productId;
  if (!userId || !productId) {
    return { outcome: 'mismatch', detail: 'verified transaction carries no userId/productId metadata' };
  }

  // Re-check the price against the SAME table checkout charged against,
  // rather than trusting the transaction's own amount to be correct for
  // whatever productId its metadata claims — the two must agree.
  const price = paystackPriceFor(productId);
  if (!price) {
    return { outcome: 'mismatch', detail: `no Paystack price configured for product "${productId}"` };
  }
  if (txn.amount < price.minor) {
    return { outcome: 'mismatch', detail: `paid ${txn.amount} minor units, expected at least ${price.minor}` };
  }
  if (txn.currency && txn.currency !== price.currency) {
    return { outcome: 'mismatch', detail: `paid in ${txn.currency}, expected ${price.currency}` };
  }

  // Checked explicitly, matching paymentRequests.ts's own approvePaymentRequest
  // pattern, rather than letting grantEntitlement's internal throw surface as an
  // unhandled 500 — a paystackPriceFor() entry existing for a productId that
  // has since been removed or deactivated from PRODUCT_CATALOGUE should never
  // happen, but a real paid charge is exactly the moment to fail cleanly rather
  // than trust that invariant blindly.
  const product = PRODUCT_CATALOGUE.find((p) => p.id === productId);
  if (!product?.active) {
    return { outcome: 'mismatch', detail: `product "${productId}" is unknown or inactive` };
  }

  await grantEntitlement(db, userId, productId, 'paystack');

  return { outcome: 'granted', userId, productId };
}
