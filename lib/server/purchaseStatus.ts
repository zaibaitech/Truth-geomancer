// Server-only composition of "what should the UI show this user for this
// product" (Prompt 28, Phase 13). Adds no access rule of its own — reads
// the customer entitlement check (hasEntitlementAccess, the same rule protected
// routes apply to customers), plus the user's own payment-request history, and
// never the reverse (a payment request is never treated as access).
import { PRODUCT_CATALOGUE } from '@/lib/access/products';
import { hasEntitlementAccess } from './accessService';
import { getPaymentRequestsForUser } from './paymentRequests';
import type { Db } from './db';

export type ProductAccessStatus = 'active' | 'pending' | 'rejected' | 'none';

/**
 * `active`   — an active entitlement already grants this product's book.
 * `pending`  — no active entitlement, but the user's most recent request
 *              for this product is still awaiting review.
 * `rejected` — no active entitlement, and the most recent request was
 *              rejected (a fresh request is still allowed — see
 *              paymentRequests.ts's duplicate policy).
 * `none`     — no entitlement and no request has ever been submitted.
 */
export async function getProductAccessStatus(db: Db, userId: string, productId: string): Promise<ProductAccessStatus> {
  // Customer ownership only (entitlement). Staff reading authority is NOT
  // ownership: it must never mark a product as bought or block checkout.
  // A product is owned when every book it grants is covered. For a single book
  // that is the book id itself; for a bundle it is each member book, so owning
  // both books individually (or the bundle itself) counts as already owning it.
  const grantedBooks = PRODUCT_CATALOGUE.find((p) => p.id === productId)?.entitlementGrants.flatMap((g) => (g.kind === 'book' ? [g.bookId] : [])) ?? [];
  const bookIds = grantedBooks.length > 0 ? grantedBooks : [productId];
  const owned = await Promise.all(bookIds.map((bookId) => hasEntitlementAccess(db, userId, { kind: 'book', bookId })));
  if (owned.every(Boolean)) return 'active';

  const allRequests = await getPaymentRequestsForUser(db, userId);
  const requests = allRequests.filter((r) => r.productId === productId);
  if (requests.length === 0) return 'none';

  // getPaymentRequestsForUser orders by submitted_at DESC, so the first
  // match is the most recent request for this product.
  const mostRecent = requests[0];
  return mostRecent.status === 'pending' ? 'pending' : mostRecent.status === 'rejected' ? 'rejected' : 'none';
}
