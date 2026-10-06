import { describe, expect, it } from 'vitest';
import { paystackPriceFor, formatPrice, bundleSaving } from './paystackCatalogue';
import { PRODUCT_CATALOGUE } from '@/lib/access/products';

describe('Paystack price table', () => {
  it('prices the two author-confirmed products in whole integer pesewas', () => {
    expect(paystackPriceFor('master-of-geomancy-vol-1')).toEqual({ minor: 12000, currency: 'GHS' });
    expect(paystackPriceFor('kanzul-mikban')).toEqual({ minor: 18000, currency: 'GHS' });
  });

  it('prices the Complete Geomancy Library at GHS 250 and saves GHS 50 over the two books', () => {
    expect(paystackPriceFor('complete-geomancy-library')).toEqual({ minor: 25000, currency: 'GHS' });
    expect(bundleSaving('complete-geomancy-library', ['master-of-geomancy-vol-1', 'kanzul-mikban'])).toEqual({ minor: 5000, currency: 'GHS' });
    expect(formatPrice(paystackPriceFor('complete-geomancy-library')!)).toBe('GH₵250');
  });

  it('keeps the old GHS 100 / GHS 150 prices inactive', () => {
    for (const id of ['master-of-geomancy-vol-1', 'kanzul-mikban']) {
      expect([10000, 15000]).not.toContain(paystackPriceFor(id)!.minor);
    }
  });

  it('has no price for the legacy bundle, which is no longer sold', () => {
    expect(paystackPriceFor('master-kanzul-bundle')).toBeNull();
  });

  it('has no price for an unknown product id', () => {
    expect(paystackPriceFor('not-a-real-product')).toBeNull();
  });

  it('every priced product id actually exists and is active in PRODUCT_CATALOGUE', () => {
    for (const id of ['master-of-geomancy-vol-1', 'kanzul-mikban', 'complete-geomancy-library']) {
      const product = PRODUCT_CATALOGUE.find((p) => p.id === id);
      expect(product?.active, id).toBe(true);
    }
  });

  it('formats whole amounts without decimals', () => {
    expect(formatPrice({ minor: 12000, currency: 'GHS' })).toBe('GH₵120');
    expect(formatPrice({ minor: 18000, currency: 'GHS' })).toBe('GH₵180');
  });
});

describe('Kanzul Mikban is GHS 180 end to end', () => {
  it('sends exactly 18000 pesewas in GHS, and the page label matches the same price object', () => {
    const price = paystackPriceFor('kanzul-mikban')!;
    expect(price).toEqual({ minor: 18000, currency: 'GHS' });
    expect(formatPrice(price)).toBe('GH₵180');
  });

  it('never prices Kanzul at the Master of Geomancy price', () => {
    expect(paystackPriceFor('kanzul-mikban')).not.toEqual(paystackPriceFor('master-of-geomancy-vol-1'));
  });
});
