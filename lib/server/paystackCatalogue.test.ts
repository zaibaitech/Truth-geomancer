import { describe, expect, it } from 'vitest';
import { paystackPriceFor, formatPrice } from './paystackCatalogue';
import { PRODUCT_CATALOGUE } from '@/lib/access/products';

describe('Paystack price table', () => {
  it('prices the two author-confirmed products in whole integer pesewas', () => {
    expect(paystackPriceFor('master-of-geomancy-vol-1')).toEqual({ minor: 10000, currency: 'GHS' });
    expect(paystackPriceFor('kanzul-mikban')).toEqual({ minor: 15000, currency: 'GHS' });
  });

  it('has no price for the bundle — none was ever given, and none is invented here', () => {
    expect(paystackPriceFor('master-kanzul-bundle')).toBeNull();
  });

  it('has no price for an unknown product id', () => {
    expect(paystackPriceFor('not-a-real-product')).toBeNull();
  });

  it('every priced product id actually exists and is active in PRODUCT_CATALOGUE', () => {
    for (const id of ['master-of-geomancy-vol-1', 'kanzul-mikban']) {
      const product = PRODUCT_CATALOGUE.find((p) => p.id === id);
      expect(product?.active, id).toBe(true);
    }
  });

  it('formats whole amounts without decimals', () => {
    expect(formatPrice({ minor: 10000, currency: 'GHS' })).toBe('GH₵100');
    expect(formatPrice({ minor: 15000, currency: 'GHS' })).toBe('GH₵150');
  });
});
