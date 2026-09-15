// Tests for the pure access-control module (Prompt 25, section 11).
// Every test builds its own explicit AccessContext — no localStorage, no
// network, no real user store — matching the module's own design: it is
// a deterministic function of whatever entitlements/products are passed
// in, nothing more.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { canAccess, canAccessBook, canAccessFeature, canAccessMethod } from './access';
import {
  BUNDLE_PRODUCT,
  KANZUL_PRODUCT,
  KANZUL_VERIFIED_METHOD_IDS,
  MASTER_CANCELLING_METHOD_FEATURE,
  MASTER_COUNTING_METHOD_FEATURE,
  MASTER_PRODUCT,
  PRODUCT_CATALOGUE,
} from './products';
import * as previewCandidatesModule from './previewCandidates';
import { PREVIEW_CANDIDATES } from './previewCandidates';
import type { Entitlement, FreePreview } from './types';

function entitlementFor(productId: string, overrides: Partial<Entitlement> = {}): Entitlement {
  return {
    id: `ent-${productId}`,
    userId: 'user-1',
    productId,
    status: 'active',
    grantedAt: '2026-01-01T00:00:00Z',
    source: 'manual-payment',
    ...overrides,
  };
}

const KANZUL_SAMPLE_METHOD_ID = KANZUL_VERIFIED_METHOD_IDS[0];

describe('A/B. Active Master entitlement grants Master book and Master features', () => {
  const ctx = { entitlements: [entitlementFor(MASTER_PRODUCT.id)], products: PRODUCT_CATALOGUE };

  it('A. Master book is accessible', () => {
    expect(canAccessBook(ctx, 'master-of-geomancy-vol-1')).toBe(true);
  });

  it('B. Master features (Counting and Cancelling) are accessible', () => {
    expect(canAccessFeature(ctx, MASTER_COUNTING_METHOD_FEATURE)).toBe(true);
    expect(canAccessFeature(ctx, MASTER_CANCELLING_METHOD_FEATURE)).toBe(true);
  });
});

describe('C/D. Active Master entitlement never leaks into Kanzul Mikban', () => {
  const ctx = { entitlements: [entitlementFor(MASTER_PRODUCT.id)], products: PRODUCT_CATALOGUE };

  it('C. Kanzul Mikban book is inaccessible', () => {
    expect(canAccessBook(ctx, 'kanzul-mikban')).toBe(false);
  });

  it('D. A Kanzul Mikban method is inaccessible', () => {
    expect(canAccessMethod(ctx, 'kanzul-mikban', KANZUL_SAMPLE_METHOD_ID)).toBe(false);
  });
});

describe('E/F. Active Kanzul entitlement grants Kanzul book and Kanzul methods', () => {
  const ctx = { entitlements: [entitlementFor(KANZUL_PRODUCT.id)], products: PRODUCT_CATALOGUE };

  it('E. Kanzul Mikban book is accessible', () => {
    expect(canAccessBook(ctx, 'kanzul-mikban')).toBe(true);
  });

  it('F. every one of Kanzul Mikban’s verified methods is accessible', () => {
    expect(KANZUL_VERIFIED_METHOD_IDS.length).toBeGreaterThan(100); // sanity: this is the real, large list
    for (const methodId of KANZUL_VERIFIED_METHOD_IDS) {
      expect(canAccessMethod(ctx, 'kanzul-mikban', methodId)).toBe(true);
    }
  });
});

describe('G. Active Kanzul entitlement never leaks into The Master of Geomancy', () => {
  const ctx = { entitlements: [entitlementFor(KANZUL_PRODUCT.id)], products: PRODUCT_CATALOGUE };

  it('Master book is inaccessible', () => {
    expect(canAccessBook(ctx, 'master-of-geomancy-vol-1')).toBe(false);
  });

  it('Master features are inaccessible', () => {
    expect(canAccessFeature(ctx, MASTER_COUNTING_METHOD_FEATURE)).toBe(false);
    expect(canAccessFeature(ctx, MASTER_CANCELLING_METHOD_FEATURE)).toBe(false);
  });
});

describe('H/I/J. Bundle entitlement grants the union of both products', () => {
  const ctx = { entitlements: [entitlementFor(BUNDLE_PRODUCT.id)], products: PRODUCT_CATALOGUE };

  it('H. both books are accessible', () => {
    expect(canAccessBook(ctx, 'master-of-geomancy-vol-1')).toBe(true);
    expect(canAccessBook(ctx, 'kanzul-mikban')).toBe(true);
  });

  it('I. Master features are accessible', () => {
    expect(canAccessFeature(ctx, MASTER_COUNTING_METHOD_FEATURE)).toBe(true);
    expect(canAccessFeature(ctx, MASTER_CANCELLING_METHOD_FEATURE)).toBe(true);
  });

  it('J. Kanzul methods are accessible', () => {
    for (const methodId of KANZUL_VERIFIED_METHOD_IDS) {
      expect(canAccessMethod(ctx, 'kanzul-mikban', methodId)).toBe(true);
    }
  });

  it('the bundle grants the UNION of the standalone products’ own grants, never a duplicated copy', () => {
    for (const grant of MASTER_PRODUCT.entitlementGrants) expect(BUNDLE_PRODUCT.entitlementGrants).toContain(grant);
    for (const grant of KANZUL_PRODUCT.entitlementGrants) expect(BUNDLE_PRODUCT.entitlementGrants).toContain(grant);
  });
});

describe('K. Revoked entitlement denies access', () => {
  it('a revoked Kanzul entitlement no longer grants the Kanzul book or its methods', () => {
    const ctx = {
      entitlements: [entitlementFor(KANZUL_PRODUCT.id, { status: 'revoked', revokedAt: '2026-02-01T00:00:00Z' })],
      products: PRODUCT_CATALOGUE,
    };
    expect(canAccessBook(ctx, 'kanzul-mikban')).toBe(false);
    expect(canAccessMethod(ctx, 'kanzul-mikban', KANZUL_SAMPLE_METHOD_ID)).toBe(false);
  });
});

describe('L. Unknown user / no entitlements denies every protected resource', () => {
  it('an empty entitlement list grants nothing', () => {
    const ctx = { entitlements: [], products: PRODUCT_CATALOGUE };
    expect(canAccessBook(ctx, 'master-of-geomancy-vol-1')).toBe(false);
    expect(canAccessBook(ctx, 'kanzul-mikban')).toBe(false);
    expect(canAccessMethod(ctx, 'kanzul-mikban', KANZUL_SAMPLE_METHOD_ID)).toBe(false);
    expect(canAccessFeature(ctx, MASTER_COUNTING_METHOD_FEATURE)).toBe(false);
  });

  it('an entitlement pointing at a product id not in the catalogue grants nothing', () => {
    const ctx = { entitlements: [entitlementFor('does-not-exist')], products: PRODUCT_CATALOGUE };
    expect(canAccessBook(ctx, 'kanzul-mikban')).toBe(false);
  });
});

describe('M. Free preview definitions never grant paid entitlement', () => {
  it('a FreePreview can be represented for each candidate without any Entitlement existing', () => {
    for (const candidate of PREVIEW_CANDIDATES) {
      const preview: FreePreview = { id: `preview-${candidate.target.bookId}`, target: candidate.target, maxUses: 1, active: true };
      const ctx = { entitlements: [], products: PRODUCT_CATALOGUE };
      // Defining/holding a FreePreview object has no bearing on canAccess —
      // it is a separate concept, never consulted by the paid-access check.
      expect(preview.target.bookId).toBe(candidate.bookId);
      if (preview.target.kind === 'method') {
        expect(canAccessMethod(ctx, preview.target.bookId, preview.target.methodId)).toBe(false);
      } else {
        expect(canAccessFeature(ctx, preview.target.featureKey)).toBe(false);
      }
    }
  });

  it('none of the candidates is marked active as a production decision by this module', () => {
    // This file only ever documents candidates; nothing exports a "the
    // chosen preview" constant, which is itself the assertion here.
    const exportedNames = Object.keys(previewCandidatesModule);
    expect(exportedNames).not.toContain('ACTIVE_FREE_PREVIEW');
    expect(exportedNames).not.toContain('PRODUCTION_PREVIEW');
  });
});

describe('N. Preview definitions do NOT create Entitlement records', () => {
  it('constructing every preview candidate never produces or requires an Entitlement object', () => {
    for (const candidate of PREVIEW_CANDIDATES) {
      const preview: FreePreview = { id: `preview-${candidate.target.bookId}`, target: candidate.target, maxUses: 1, active: true };
      // FreePreview has no productId/userId/status:'active'|'revoked' shape
      // at all — structurally, it cannot BE an Entitlement.
      expect('productId' in preview).toBe(false);
      expect('userId' in preview).toBe(false);
    }
  });

  it('the preview-candidates module imports no Entitlement-producing code', () => {
    const source = readFileSync('lib/access/previewCandidates.ts', 'utf-8');
    expect(source).not.toMatch(/createEntitlement/);
    expect(source).not.toMatch(/status:\s*'active'/);
  });
});

describe('O. No payment code exists in the access module', () => {
  const accessSource = readFileSync('lib/access/access.ts', 'utf-8');
  const rendered = accessSource
    .split('\n')
    .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
    .join('\n');

  it('contains no payment-provider, network, storage, or auth references', () => {
    expect(rendered).not.toMatch(/stripe|paypal|checkout|webhook/i);
    expect(rendered).not.toMatch(/fetch\(|XMLHttpRequest|axios/);
    expect(rendered).not.toMatch(/localStorage|sessionStorage|indexedDB/i);
    expect(rendered).not.toMatch(/password|jwt|session|cookie/i);
  });

  it('every exported function is synchronous (no network/database await)', () => {
    expect(accessSource).not.toMatch(/async function/);
    expect(accessSource).not.toMatch(/\basync\b/);
  });
});

describe('Access resource shape (structural safety net)', () => {
  it('canAccess distinguishes book vs method vs feature resources even with overlapping ids', () => {
    const ctx = { entitlements: [entitlementFor(MASTER_PRODUCT.id)], products: PRODUCT_CATALOGUE };
    // A method-shaped lookup against a book-only entitlement must not
    // accidentally succeed just because the book id matches.
    expect(canAccess(ctx, { kind: 'method', bookId: 'master-of-geomancy-vol-1', methodId: 'anything' })).toBe(false);
  });
});
