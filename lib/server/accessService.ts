// Server-only access-decision composition (Prompt 26, Phase 4). This
// module adds no access RULE of its own — it only wires the authoritative
// data sources (the database's active entitlements, the static product
// catalogue) into the existing, already-tested `canAccess()` from
// lib/access/access.ts. Duplicating that logic here (e.g. a second SQL
// query that tries to re-derive "is this method covered") is exactly what
// this task's rules forbid; every decision still flows through the one
// pure function.
import { canAccess, type AccessContext, type AccessResource } from '@/lib/access/access';
import { PRODUCT_CATALOGUE } from '@/lib/access/products';
import { getActiveEntitlementsForUser } from './entitlements';
import type { Db } from './db';

/**
 * The authoritative AccessContext for one user: their ACTIVE entitlements
 * loaded from the database (never trusted from a caller — see
 * lib/access/README.md, "Server/client security boundary") plus the
 * static, tested product catalogue.
 */
export function getAccessContextForUser(db: Db, userId: string): AccessContext {
  return { entitlements: getActiveEntitlementsForUser(db, userId), products: PRODUCT_CATALOGUE };
}

/**
 * The one function a future protected route should call: identify the
 * user server-side (already done by the caller, passed in as `userId`),
 * load their authoritative entitlements, and delegate the actual
 * yes/no decision to canAccess(). Deliberately not wired into any route
 * in this task (Prompt 26, Phase 9).
 */
export function canAccessForUser(db: Db, userId: string, resource: AccessResource): boolean {
  return canAccess(getAccessContextForUser(db, userId), resource);
}
