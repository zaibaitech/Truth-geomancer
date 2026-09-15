// Pure access-control module (Prompt 25 — product & entitlement
// foundation). Every function here is a deterministic function of its
// explicit arguments: no localStorage, no network, no database, no
// authentication, and no payment logic. It answers exactly one kind of
// question — "given these entitlements and this product catalogue, is
// this resource accessible" — and nothing else.
//
// This module is not wired into any route, page, or component yet (see
// README.md, "Why this isn't wired in yet"). It exists so that book
// routes, method/practice routes, offline-download authorization, and any
// future server content-delivery layer can all call the SAME function
// later, rather than each re-implementing this logic.
import type { Entitlement, EntitlementGrant, Product } from './types';

/** Everything an access check needs, passed in explicitly by the caller.
 * This module never looks up a user or a product catalogue on its own —
 * doing so would require exactly the backend/database this task is
 * explicitly not implementing. */
export interface AccessContext {
  entitlements: Entitlement[];
  products: Product[];
}

export type AccessResource =
  | { kind: 'book'; bookId: string }
  | { kind: 'method'; bookId: string; methodId: string }
  | { kind: 'feature'; featureKey: string };

/** The grants contributed by every `active` entitlement whose product is
 * both known in `products` and itself `active`. A `revoked` entitlement,
 * or one pointing at a product that has since been deactivated or isn't
 * in the catalogue at all, contributes nothing — deliberately: a revoked
 * or unknown entitlement must never silently keep granting access. */
function activeGrants(ctx: AccessContext): EntitlementGrant[] {
  const activeProductIds = new Set(
    ctx.entitlements.filter((e) => e.status === 'active').map((e) => e.productId),
  );
  return ctx.products
    .filter((p) => p.active && activeProductIds.has(p.id))
    .flatMap((p) => p.entitlementGrants);
}

function grantCovers(grant: EntitlementGrant, resource: AccessResource): boolean {
  if (resource.kind === 'book') {
    return grant.kind === 'book' && grant.bookId === resource.bookId;
  }
  if (resource.kind === 'method') {
    return grant.kind === 'method-set' && grant.bookId === resource.bookId && grant.methodIds.includes(resource.methodId);
  }
  // resource.kind === 'feature'
  return grant.kind === 'feature' && grant.featureKey === resource.featureKey;
}

/** The one general-purpose access check. Returns true only if some active
 * entitlement's product carries a grant that explicitly covers this exact
 * resource — a book grant never implies method access and vice versa
 * (Prompt 25, section 3: "Do NOT automatically assume 'all methods in
 * book' unless explicitly represented"). */
export function canAccess(ctx: AccessContext, resource: AccessResource): boolean {
  const grants = activeGrants(ctx);
  return grants.some((grant) => grantCovers(grant, resource));
}

export function canAccessBook(ctx: AccessContext, bookId: string): boolean {
  return canAccess(ctx, { kind: 'book', bookId });
}

export function canAccessMethod(ctx: AccessContext, bookId: string, methodId: string): boolean {
  return canAccess(ctx, { kind: 'method', bookId, methodId });
}

export function canAccessFeature(ctx: AccessContext, featureKey: string): boolean {
  return canAccess(ctx, { kind: 'feature', featureKey });
}
