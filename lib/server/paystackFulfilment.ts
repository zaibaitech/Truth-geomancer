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
import { getPayment } from './paystackPayments';
import { PRODUCT_CATALOGUE } from '@/lib/access/products';
import type { Db } from './db';

export type FulfilResult =
  | { outcome: 'granted'; userId: string; productId: string }
  | { outcome: 'not-paid'; status: string }
  | { outcome: 'mismatch'; detail: string }
  | { outcome: 'unavailable' };

/**
 * Verify `reference` with Paystack and grant the product only if it really
 * was paid: successful, the exact price, in the catalogue currency, for the
 * user/product/email THIS server recorded when it started the checkout.
 *
 * Nothing here trusts a webhook payload or a redirect's query string for
 * anything beyond "go check this reference" — status, amount and currency
 * come from calling verifyTransaction() fresh, every time, and are compared
 * to our own paystack_payments record rather than to Paystack's metadata
 * alone. Safe to call repeatedly (webhook redelivery, refreshed callback):
 * the grant and the ledger update are one transaction, and
 * grantEntitlement() never inserts a second active row.
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

  const payment = await getPayment(db, reference);
  if (!payment) {
    return { outcome: 'mismatch', detail: 'reference was not started by this server' };
  }

  if (txn.status !== 'success') {
    // Only an unfinished record moves to a terminal failure state; a payment
    // already confirmed successful is never downgraded by a stale delivery.
    const terminal = txn.status === 'failed' ? 'failed' : txn.status === 'abandoned' ? 'abandoned' : null;
    if (terminal) {
      await db.execute("UPDATE paystack_payments SET status = ? WHERE reference = ? AND status IN ('initiating', 'pending')", [
        terminal,
        reference,
      ]);
    }
    return { outcome: 'not-paid', status: txn.status };
  }

  if (txn.reference !== reference) {
    return { outcome: 'mismatch', detail: 'verified reference differs from the one requested' };
  }

  const { userId, productId } = payment;
  if (txn.metadata?.userId !== userId || txn.metadata?.productId !== productId) {
    return { outcome: 'mismatch', detail: 'transaction metadata does not match the recorded checkout' };
  }
  if (txn.metadata.entitlement !== undefined && txn.metadata.entitlement !== productId) {
    return { outcome: 'mismatch', detail: 'transaction entitlement metadata does not match the product' };
  }

  // The price comes from the SAME table checkout charged against; the
  // transaction must match it, and what we recorded, exactly.
  const price = paystackPriceFor(productId);
  if (!price) {
    return { outcome: 'mismatch', detail: `no Paystack price configured for product "${productId}"` };
  }
  if (payment.amountMinor !== price.minor || payment.currency !== price.currency) {
    return { outcome: 'mismatch', detail: 'recorded checkout does not match the current catalogue price' };
  }
  if (txn.amount !== price.minor) {
    return { outcome: 'mismatch', detail: `paid ${txn.amount} minor units, expected exactly ${price.minor}` };
  }
  if (txn.currency !== price.currency) {
    return { outcome: 'mismatch', detail: `paid in ${txn.currency}, expected ${price.currency}` };
  }
  if (txn.customer?.email?.toLowerCase() !== payment.customerEmail.toLowerCase()) {
    return { outcome: 'mismatch', detail: 'transaction customer does not match the recorded checkout' };
  }

  // Checked explicitly rather than letting grantEntitlement's internal throw
  // surface as an unhandled 500 — a real paid charge is exactly the moment to
  // fail cleanly rather than trust that invariant blindly.
  const product = PRODUCT_CATALOGUE.find((p) => p.id === productId);
  if (!product?.active) {
    return { outcome: 'mismatch', detail: `product "${productId}" is unknown or inactive` };
  }

  await db.transaction(async (tx) => {
    await grantEntitlement(tx, userId, productId, 'paystack');
    await tx.execute(
      `UPDATE paystack_payments SET status = 'success', paystack_transaction_id = ?, paid_at = ?,
         verified_at = COALESCE(verified_at, ?) WHERE reference = ?`,
      [String(txn.id), txn.paid_at, new Date().toISOString(), reference],
    );
  });

  return { outcome: 'granted', userId, productId };
}
