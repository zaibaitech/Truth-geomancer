// Product/entitlement domain contract (Prompt 25 — product & entitlement
// foundation). Backend-agnostic on purpose: nothing here reads or writes
// localStorage, calls a network, or assumes any particular persistence —
// it is the shape a future backend, admin dashboard, and content-delivery
// layer all plug into, not an implementation of any of them. See
// lib/access/README.md for the full explanation of why each type looks
// the way it does.

// ---------------------------------------------------------------------------
// Entitlement grants — what owning a product actually unlocks
// ---------------------------------------------------------------------------

/** Grants an entire book (its content/reading access) — never implies
 * access to that book's methods; a product must grant a MethodSetGrant or
 * FeatureGrant separately for those (see products.ts's own comment on
 * this — the repository's audit found no basis for "buying a book buys
 * every method in it" as an assumption). */
export interface BookGrant {
  kind: 'book';
  bookId: string;
}

/** Grants a named, explicit list of method ids within one book. Never
 * "all methods" — the list must be spelled out by whoever builds the
 * product (see products.ts, which builds Kanzul Mikban's list from the
 * same `practicableMethodsForChapter` eligibility the app's own "Try this
 * method" CTA already uses, never a separate invented list). */
export interface MethodSetGrant {
  kind: 'method-set';
  bookId: string;
  methodIds: string[];
}

/** Grants a named feature that isn't shaped like a Kanzul Mikban
 * MethodDefinition — e.g. one of The Master of Geomancy's two practice
 * procedures (Counting Method, Cancelling Method), which the repository
 * audit found have no MethodDefinition/method-id of their own (see
 * products.ts's decision note). `featureKey` is an opaque, product-defined
 * string — this module does not enumerate valid keys, the same way it
 * does not enumerate valid book or method ids. */
export interface FeatureGrant {
  kind: 'feature';
  featureKey: string;
}

export type EntitlementGrant = BookGrant | MethodSetGrant | FeatureGrant;

// ---------------------------------------------------------------------------
// Product — what can be purchased
// ---------------------------------------------------------------------------

/** A purchasable unit granting one or more EntitlementGrants. Deliberately
 * has no price/currency field: none exists in the repository today and
 * none is invented here (Prompt 25, non-negotiable rules). A bundle is
 * simply a Product whose `entitlementGrants` is the union of other
 * products' own grants — see products.ts — never a duplicated copy of a
 * book or method list. */
export interface Product {
  id: string;
  name: string;
  description: string;
  active: boolean;
  entitlementGrants: EntitlementGrant[];
}

// ---------------------------------------------------------------------------
// Entitlement — a user's ownership of a product
// ---------------------------------------------------------------------------

export type EntitlementStatus = 'active' | 'revoked';

/** How an entitlement came to exist. Kept separate from `status` and from
 * any payment-processing detail: this module never inspects `source` to
 * decide anything — it exists purely as an audit/provenance field for a
 * future admin view. `'manual-payment'` covers the Phase 1 author-approval
 * workflow described in the prior audit; `'promo'` covers a
 * non-payment-derived grant (e.g. a courtesy account). Neither implies any
 * payment-processing code lives here — none does. */
export type EntitlementSource = 'manual-payment' | 'promo';

/** A user's ownership of one Product. This type is a domain contract only
 * — no Entitlement records are created, persisted, or faked by this
 * module. There are no users in this repository yet (no auth, no
 * database — see the Prompt 24 audit), so `userId` is an opaque string
 * this module never validates against a real user store. */
export interface Entitlement {
  id: string;
  userId: string;
  productId: string;
  status: EntitlementStatus;
  grantedAt: string; // ISO 8601 — a plain string, not a Date, so this type
  // has zero serialization ambiguity once it does cross a real network/DB
  // boundary later.
  revokedAt?: string;
  source: EntitlementSource;
}

// ---------------------------------------------------------------------------
// PaymentRequest — manual-payment record (Prompt 28 — manual payment +
// author approval workflow). A PaymentRequest is NOT an entitlement: it is
// only a claim ("I paid for this, please review") that an admin must
// explicitly approve before the entitlement-granting function in
// lib/server/entitlements.ts is ever called. See
// lib/server/paymentRequests.ts for the persistence and state-machine
// logic that operates on this shape.
//
// Deliberately has no `amount`/`currency`/`paymentMethod` field: Prompt 25
// never defined a price for any product, and Prompt 28 explicitly forbids
// inventing one now — see lib/access/paymentInstructions.ts. Deliberately
// has no proof-file field either: this repository has no secure object
// storage, and Prompt 28 Phase 17 requires documenting that limitation
// rather than pretending file storage exists — see paymentRequests.ts's
// module comment for the full reasoning.
// ---------------------------------------------------------------------------

export type PaymentRequestStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentRequest {
  id: string;
  userId: string;
  productId: string;
  status: PaymentRequestStatus;
  /** Whatever reference the user's payment method gave them (a transaction
   * ID, a confirmation code, a sender name) — free text the admin uses to
   * cross-check against payment they received outside this app. Never
   * validated or parsed by this system beyond "non-empty". */
  paymentReference: string;
  /** Optional free-text note from the user to the admin (e.g. "paid via
   * my brother's account", "sent twice by mistake"). */
  userNote?: string;
  submittedAt: string;
  reviewedAt?: string;
  /** The admin identity that reviewed this request — see
   * lib/server/adminAuth.ts. Opaque, not a display name (there is no
   * admin-identity/name system beyond the single configured secret). */
  reviewedBy?: string;
  /** Optional free-text note from the admin, most useful on rejection
   * (why), but allowed on approval too. */
  adminNote?: string;
}

// ---------------------------------------------------------------------------
// Free preview — a limited, non-paid trial of one method or feature
// ---------------------------------------------------------------------------

/** What a preview lets someone try — exactly one method OR one feature,
 * mirroring the two non-book grant kinds above. A discriminated union
 * rather than an optional `methodId OR featureKey` pair, so an invalid
 * "both set" or "neither set" state is unrepresentable rather than merely
 * discouraged by convention. */
export type FreePreviewTarget =
  | { kind: 'method'; bookId: string; methodId: string }
  | { kind: 'feature'; bookId: string; featureKey: string };

/** The definition of a preview offer — never a record of anyone using it
 * (see PreviewUsage below). `maxUses` defaults conceptually to 1 per the
 * author's stated initial requirement (Prompt 25 section 7), but is a
 * plain number here specifically so a later "3 free uses" or "one free
 * chapter" policy needs no shape change, only a different value. */
export interface FreePreview {
  id: string;
  target: FreePreviewTarget;
  maxUses: number;
  active: boolean;
}

export type PreviewUsageStatus = 'available' | 'exhausted';

/** A record of one user's consumption against one FreePreview. This type
 * exists as a domain contract only — see README.md's "Why localStorage is
 * NOT a secure entitlement source" section. No code in this repository
 * persists a PreviewUsage anywhere; doing so commercially requires a
 * backend, which does not exist yet. */
export interface PreviewUsage {
  userId: string;
  previewId: string;
  usesConsumed: number;
  status: PreviewUsageStatus;
}
