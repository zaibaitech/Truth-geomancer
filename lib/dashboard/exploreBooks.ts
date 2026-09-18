// Prompt 61: pure data-shaping for the dashboard's "Explore the Books"
// section — no JSX, no DB/cookie access, so it's fully unit-testable. The
// Server Component (components/dashboard/ExploreBooks.tsx) does the real
// per-user entitlement lookup (via the existing getProductAccessStatus —
// never a second, separately maintained access check) and hands this
// module the resulting statuses; this module only decides, from data
// already established elsewhere, which CTA state each book card is in.
//
// IMPORTANT (Prompt 61 business decision): no price exists anywhere in
// Product/Book yet, and none is invented here — a card's "unowned" CTA
// always routes to the existing purchase page or to the author, never to
// an invented/placeholder price string.
import { BOOKS, type Book } from '@/content/books';
import { PRODUCT_CATALOGUE } from '@/lib/access/products';
import type { Product } from '@/lib/access/types';
import type { ProductAccessStatus } from '@/lib/server/purchaseStatus';

export interface ExploreBookCard {
  book: Book;
  product: Product;
  status: ProductAccessStatus;
}

/** Pairs every catalogue book with its matching product and access status
 * (default `'none'` for a book with no status supplied, e.g. no signed-in
 * user yet — see getProductAccessStatus's own 'none' meaning). Skips a book
 * with no matching active product rather than fabricating one — this
 * catalogue is small and hand-maintained, so a mismatch is a real data bug
 * to surface, not something to paper over silently in production. */
export function buildExploreBookCards(statusesByProductId: Partial<Record<string, ProductAccessStatus>>): ExploreBookCard[] {
  return BOOKS.map((book) => {
    const product = PRODUCT_CATALOGUE.find((p) => p.id === book.id && p.active);
    if (!product) return null;
    return { book, product, status: statusesByProductId[product.id] ?? 'none' } satisfies ExploreBookCard;
  }).filter((card): card is ExploreBookCard => card !== null);
}

/** Whether a card's primary action is "get the book" (no active
 * entitlement yet) vs. the owned-state library action. */
export function isUnownedCard(card: ExploreBookCard): boolean {
  return card.status !== 'active';
}
