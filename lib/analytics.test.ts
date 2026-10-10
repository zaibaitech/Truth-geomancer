import { describe, expect, it } from 'vitest';
import { GA_MEASUREMENT_ID, isAnalyticsExcludedPath, sanitizeUrl } from './analytics';

describe('analytics privacy helpers', () => {
  it('uses the GA4 measurement id fallback', () => {
    expect(GA_MEASUREMENT_ID).toMatch(/^G-/);
  });
  it('strips query strings and hashes', () => {
    expect(sanitizeUrl('https://truthgeomancer.com/purchase/x?payment=success&reference=abc#q')).toBe(
      'https://truthgeomancer.com/purchase/x',
    );
  });
  it('excludes admin, api and auth paths', () => {
    expect(isAnalyticsExcludedPath('/admin')).toBe(true);
    expect(isAnalyticsExcludedPath('/admin/books')).toBe(true);
    expect(isAnalyticsExcludedPath('/api/paystack/callback')).toBe(true);
    expect(isAnalyticsExcludedPath('/auth/confirm')).toBe(true);
    expect(isAnalyticsExcludedPath('/administrator')).toBe(false);
    expect(isAnalyticsExcludedPath('/raml')).toBe(false);
  });
});
