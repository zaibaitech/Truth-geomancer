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
import { getStaffAccess, staffAccessReason } from './staff';
import type { Db } from './db';

/**
 * The authoritative AccessContext for one user: their ACTIVE entitlements
 * loaded from the database (never trusted from a caller — see
 * lib/access/README.md, "Server/client security boundary") plus the
 * static, tested product catalogue.
 */
export async function getAccessContextForUser(db: Db, userId: string): Promise<AccessContext> {
  return { entitlements: await getActiveEntitlementsForUser(db, userId), products: PRODUCT_CATALOGUE };
}

/** CUSTOMER access only: does an active entitlement cover the resource?
 * Use where the question is "has this customer bought / been granted it"
 * (purchase status, checkout), so staff authority never reads as ownership. */
export async function hasEntitlementAccess(db: Db, userId: string, resource: AccessResource): Promise<boolean> {
  return canAccess(await getAccessContextForUser(db, userId), resource);
}

/** Why a user may access a resource. Customer access (entitlement) is
 * checked first; staff access (lib/server/staff.ts) is a separate path that
 * never creates or reads like an entitlement. */
export type AccessReason = 'entitlement' | 'author' | 'platform-admin';
export type AccessDecision = { allowed: true; reason: AccessReason } | { allowed: false };

/**
 * The server-side access decision for one user and one resource. The user is
 * identified by the caller from the session (never from client input); their
 * entitlements and staff authority are loaded from the database here.
 *
 *  1. an active entitlement covering the resource            -> 'entitlement'
 *  2. an active platform_admin role                            -> 'platform-admin'
 *  3. an active author role + an active assignment to the book -> 'author'
 *  otherwise denied (fail closed).
 */
export async function resolveAccessForUser(db: Db, userId: string, resource: AccessResource): Promise<AccessDecision> {
  if (await hasEntitlementAccess(db, userId, resource)) return { allowed: true, reason: 'entitlement' };
  const staffReason = staffAccessReason(await getStaffAccess(db, userId), resource);
  return staffReason ? { allowed: true, reason: staffReason } : { allowed: false };
}

/** Yes/no form of resolveAccessForUser — what every protected page and API
 * route calls. Customers are decided exactly as before (entitlements); staff
 * additionally pass through their own, separate authorization path. */
export async function canAccessForUser(db: Db, userId: string, resource: AccessResource): Promise<boolean> {
  return (await resolveAccessForUser(db, userId, resource)).allowed;
}
