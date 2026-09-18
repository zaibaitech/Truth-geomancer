// Product catalogue (Prompt 25 — product & entitlement foundation).
// No prices, no currencies, no payment provider — none exist in the
// repository and none are invented here. This catalogue exists so the
// access module (access.ts) and a future admin UI have real, non-fake
// data to operate over, built entirely from facts already established
// elsewhere in the codebase.
// Prompt 27: only chapter ids are needed to enumerate methods — the public
// metadata export carries them, so this catalogue never needs the full,
// protected chapter text in its own import graph.
import { KM_CHAPTER_META as KM_CHAPTERS } from '@/content/manuscripts/kanzulMikbanMeta';
import { practicableMethodsForChapter } from '@/lib/raml/methodPractice';
import type { Product } from './types';

// ---------------------------------------------------------------------------
// Kanzul Mikban's method-set grant
// ---------------------------------------------------------------------------

/** Every verified, practicable Kanzul Mikban method id — built by calling
 * the SAME eligibility function the book's own "Try this method" CTA
 * already uses (lib/raml/methodPractice.ts), never a second, separately
 * maintained list. This is exactly what the Prompt 24 audit identified as
 * the current, explicit "182 verified methods" — recomputed here rather
 * than hard-coded, so it can never drift from the app's own practice
 * eligibility as new chapters are added or a method's status changes. */
export const KANZUL_VERIFIED_METHOD_IDS: string[] = KM_CHAPTERS.flatMap((chapter) =>
  practicableMethodsForChapter(chapter.id).map((m) => m.method.id),
);

// ---------------------------------------------------------------------------
// The Master of Geomancy's practice features
//
// DECISION (Prompt 25, section 3): the Prompt 24 audit found that Counting
// Method and Cancelling Method have no MethodDefinition/method-id of their
// own — they are hand-built adapters over Master of Geomancy's own worked
// examples (content/manuscripts/chapterOneDiagrams.ts), not entries in
// lib/raml/engine/questions. Retrofitting them into the Kanzul Mikban
// MethodDefinition shape would mean inventing an id/status/source
// structure the Master engine does not itself have — exactly the kind of
// invented relationship this task's rules forbid. A FeatureGrant is the
// safe, honest representation instead: it names each procedure by a
// stable, opaque key without pretending it is a Kanzul-style verified
// method. These two keys are this module's only source of truth for
// "what Master of Geomancy's practice grants" — a future route wiring
// them in should reference these constants, not re-invent the strings.
// ---------------------------------------------------------------------------

export const MASTER_COUNTING_METHOD_FEATURE = 'master-counting-method';
export const MASTER_CANCELLING_METHOD_FEATURE = 'master-cancelling-method';

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export const MASTER_PRODUCT: Product = {
  id: 'master-of-geomancy-vol-1',
  name: 'The Master of Geomancy, Vol. 1',
  description: 'The foundation text — how to cast a chart, the Bazdaaho arrangement, and every star’s meaning.',
  active: true,
  entitlementGrants: [
    { kind: 'book', bookId: 'master-of-geomancy-vol-1' },
    { kind: 'feature', featureKey: MASTER_COUNTING_METHOD_FEATURE },
    { kind: 'feature', featureKey: MASTER_CANCELLING_METHOD_FEATURE },
  ],
};

export const KANZUL_PRODUCT: Product = {
  id: 'kanzul-mikban',
  name: 'Kanzul Mikban',
  description: 'The advanced companion volume — 153 question-specific reading methods.',
  active: true,
  entitlementGrants: [
    { kind: 'book', bookId: 'kanzul-mikban' },
    { kind: 'method-set', bookId: 'kanzul-mikban', methodIds: KANZUL_VERIFIED_METHOD_IDS },
  ],
};

/** A bundle is a Product whose grants are the UNION of other products' own
 * grant objects — never a duplicated or re-authored copy of either book's
 * content or method list (Prompt 25, section 2). Because `MASTER_PRODUCT`
 * and `KANZUL_PRODUCT` are the same objects the standalone products use,
 * a change to either (e.g. Kanzul Mikban gaining a 183rd verified method)
 * is automatically reflected in the bundle with no separate edit. */
export const BUNDLE_PRODUCT: Product = {
  id: 'master-kanzul-bundle',
  name: 'Master + Kanzul Bundle',
  description: 'The Master of Geomancy, Vol. 1 and Kanzul Mikban together.',
  active: true,
  entitlementGrants: [...MASTER_PRODUCT.entitlementGrants, ...KANZUL_PRODUCT.entitlementGrants],
};

/** The full catalogue. Easy to extend later (a new book, a future course)
 * without touching access.ts — the access module only ever reads
 * `Product.entitlementGrants` generically. */
export const PRODUCT_CATALOGUE: Product[] = [MASTER_PRODUCT, KANZUL_PRODUCT, BUNDLE_PRODUCT];

// ---------------------------------------------------------------------------
// Prompt 65: which purchasable products grant access to one particular book —
// e.g. `kanzul-mikban` is granted by BOTH the standalone Kanzul product AND
// the bundle, so a "how many readers does Kanzul Mikban have" count must
// look at entitlements for either product id, never just the one whose id
// happens to match the book id. This reuses the exact same BookGrant check
// access.ts's canAccess() already performs — never a second, separately
// maintained "does this product cover this book" rule — it just enumerates
// every product where that check would be true, instead of checking one
// user's entitlements against it.
// ---------------------------------------------------------------------------

/** Every product id (active or not) whose entitlementGrants include a
 * BookGrant for `bookId`. Pure and catalogue-driven — a new bundle or a
 * book gaining a second bundle needs no change here. */
export function productIdsForBook(bookId: string, catalogue: Product[] = PRODUCT_CATALOGUE): string[] {
  return catalogue
    .filter((product) => product.entitlementGrants.some((grant) => grant.kind === 'book' && grant.bookId === bookId))
    .map((product) => product.id);
}
