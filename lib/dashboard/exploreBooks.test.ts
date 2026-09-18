// Tests for the dashboard's book-card data shaping (Prompt 61). Pure
// functions only — no DB, no cookies, no React — so ownership-state logic
// is testable without rendering the Server Component that calls it.
import { describe, expect, it } from 'vitest';
import { buildExploreBookCards, isUnownedCard } from './exploreBooks';
import { BOOKS } from '@/content/books';
import { PRODUCT_CATALOGUE } from '@/lib/access/products';

describe('buildExploreBookCards', () => {
  it('A: returns one card per catalogue book, paired with its matching product', () => {
    const cards = buildExploreBookCards({});
    expect(cards).toHaveLength(BOOKS.length);
    for (const card of cards) {
      expect(card.product.id).toBe(card.book.id);
    }
  });

  it('B: defaults an unsupplied status to "none" (Dashboard book CTA visibility for a first-time/anonymous visitor)', () => {
    const cards = buildExploreBookCards({});
    for (const card of cards) {
      expect(card.status).toBe('none');
    }
  });

  it('C: carries through a real product-specific status for each book independently (owned vs unowned book state)', () => {
    const master = PRODUCT_CATALOGUE.find((p) => p.id === 'master-of-geomancy-vol-1')!;
    const kanzul = PRODUCT_CATALOGUE.find((p) => p.id === 'kanzul-mikban')!;
    const cards = buildExploreBookCards({ [master.id]: 'active', [kanzul.id]: 'pending' });
    const masterCard = cards.find((c) => c.product.id === master.id)!;
    const kanzulCard = cards.find((c) => c.product.id === kanzul.id)!;
    expect(masterCard.status).toBe('active');
    expect(kanzulCard.status).toBe('pending');
  });

  it('D: never invents a card for a product id that has no matching book', () => {
    const cards = buildExploreBookCards({ 'not-a-real-product': 'active' });
    expect(cards.every((c) => BOOKS.some((b) => b.id === c.book.id))).toBe(true);
  });
});

describe('isUnownedCard', () => {
  it('E: true for every non-active status (none/pending/rejected)', () => {
    const [book] = buildExploreBookCards({});
    for (const status of ['none', 'pending', 'rejected'] as const) {
      expect(isUnownedCard({ ...book, status })).toBe(true);
    }
  });

  it('F: false once status is active (owned book state)', () => {
    const [book] = buildExploreBookCards({});
    expect(isUnownedCard({ ...book, status: 'active' })).toBe(false);
  });
});
