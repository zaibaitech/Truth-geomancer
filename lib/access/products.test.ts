// Prompt 65: tests for productIdsForBook — the pure lookup the Author
// Dashboard's reader counts are built on. Uses the real PRODUCT_CATALOGUE
// (never a fake one) so a future catalogue change is caught here too.
import { describe, expect, it } from 'vitest';
import { BUNDLE_PRODUCT, KANZUL_PRODUCT, MASTER_PRODUCT, PRODUCT_CATALOGUE, productIdsForBook } from './products';

describe('productIdsForBook', () => {
  it('A: Kanzul Mikban is granted by both the standalone product and the bundle', () => {
    const ids = productIdsForBook('kanzul-mikban');
    expect(ids).toContain(KANZUL_PRODUCT.id);
    expect(ids).toContain(BUNDLE_PRODUCT.id);
    expect(ids).not.toContain(MASTER_PRODUCT.id);
  });

  it('B: The Master of Geomancy is granted by both the standalone product and the bundle', () => {
    const ids = productIdsForBook('master-of-geomancy-vol-1');
    expect(ids).toContain(MASTER_PRODUCT.id);
    expect(ids).toContain(BUNDLE_PRODUCT.id);
    expect(ids).not.toContain(KANZUL_PRODUCT.id);
  });

  it('C: an unknown book id grants no products', () => {
    expect(productIdsForBook('not-a-real-book')).toEqual([]);
  });

  it('D: a controlled catalogue with no bundle returns only the one matching product', () => {
    const ids = productIdsForBook('kanzul-mikban', [KANZUL_PRODUCT, MASTER_PRODUCT]);
    expect(ids).toEqual([KANZUL_PRODUCT.id]);
  });

  it('E: defaults to the real PRODUCT_CATALOGUE when no catalogue is passed', () => {
    expect(productIdsForBook('kanzul-mikban')).toEqual(productIdsForBook('kanzul-mikban', PRODUCT_CATALOGUE));
  });
});
