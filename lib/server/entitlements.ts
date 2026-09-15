// Server-only entitlement persistence (Prompt 26, Phases 3-5). Stores
// only WHICH product a user owns and WHETHER that ownership is active —
// it never stores or duplicates WHAT a product grants. That stays defined
// exactly once, in lib/access/products.ts, which this module treats as
// authoritative (see grantEntitlement's product-lookup below, and
// lib/access/README.md "Which layer is authoritative").
import { randomUUID } from 'node:crypto';
import { PRODUCT_CATALOGUE } from '@/lib/access/products';
import type { Entitlement, EntitlementSource, Product } from '@/lib/access/types';
import type { Db } from './db';

interface EntitlementRow {
  id: string;
  user_id: string;
  product_id: string;
  status: 'active' | 'revoked';
  granted_at: string;
  revoked_at: string | null;
  source: EntitlementSource;
}

function rowToEntitlement(row: EntitlementRow): Entitlement {
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    status: row.status,
    grantedAt: row.granted_at,
    revokedAt: row.revoked_at ?? undefined,
    source: row.source,
  };
}

export function getEntitlementsForUser(db: Db, userId: string): Entitlement[] {
  const rows = db.prepare('SELECT * FROM entitlements WHERE user_id = ? ORDER BY granted_at').all(userId) as unknown as EntitlementRow[];
  return rows.map(rowToEntitlement);
}

export function getActiveEntitlementsForUser(db: Db, userId: string): Entitlement[] {
  const rows = db
    .prepare("SELECT * FROM entitlements WHERE user_id = ? AND status = 'active' ORDER BY granted_at")
    .all(userId) as unknown as EntitlementRow[];
  return rows.map(rowToEntitlement);
}

export interface GrantResult {
  entitlement: Entitlement;
  /** false when an already-active entitlement for this (user, product)
   * pair existed and was returned unchanged, rather than a new row being
   * inserted — see grantEntitlement's own comment. */
  created: boolean;
}

/**
 * Grants `productId` to `userId`. Server-only: nothing exports this from
 * a client-reachable module, and no route calls it yet (Prompt 26 does
 * not wire in a public endpoint — see README.md).
 *
 * Validates `productId` against the static PRODUCT_CATALOGUE and refuses
 * to record an entitlement for an unknown or inactive product — the
 * database can never drift into referencing a product that doesn't exist
 * in code.
 *
 * Idempotent by design: calling this twice for an already-active
 * (user, product) pair returns the EXISTING row unchanged rather than
 * inserting a duplicate. This is the deterministic behavior Prompt 26
 * Phase 5 asks for — a user is never granted "double" access, and a
 * second manual-approval click (e.g. an admin double-submitting a form)
 * can never create ambiguous duplicate entitlement rows.
 *
 * `catalogue` defaults to the real PRODUCT_CATALOGUE and should be left
 * at its default everywhere except tests — it exists as an explicit
 * parameter (rather than only the module-level import) so a test can
 * exercise the "known but inactive product" refusal path with a
 * controlled catalogue, without mutating shared state.
 */
export function grantEntitlement(
  db: Db,
  userId: string,
  productId: string,
  source: EntitlementSource,
  catalogue: Product[] = PRODUCT_CATALOGUE,
): GrantResult {
  const product = catalogue.find((p) => p.id === productId);
  if (!product || !product.active) {
    throw new Error(`grantEntitlement: unknown or inactive product id "${productId}"`);
  }

  const existing = db
    .prepare("SELECT * FROM entitlements WHERE user_id = ? AND product_id = ? AND status = 'active'")
    .get(userId, productId) as EntitlementRow | undefined;
  if (existing) {
    return { entitlement: rowToEntitlement(existing), created: false };
  }

  const grantedAt = new Date().toISOString();
  const id = randomUUID();
  db.prepare(
    'INSERT INTO entitlements (id, user_id, product_id, status, granted_at, revoked_at, source) VALUES (?, ?, ?, ?, ?, NULL, ?)',
  ).run(id, userId, productId, 'active', grantedAt, source);

  return { entitlement: { id, userId, productId, status: 'active', grantedAt, source }, created: true };
}

/**
 * Revokes one entitlement by its own id. Server-only, same as
 * grantEntitlement. Idempotent: revoking an already-revoked entitlement
 * is a harmless no-op that returns its current (already revoked) state
 * rather than erroring or overwriting `revokedAt`. Returns null only if
 * the id does not exist at all.
 */
export function revokeEntitlement(db: Db, entitlementId: string): Entitlement | null {
  const row = db.prepare('SELECT * FROM entitlements WHERE id = ?').get(entitlementId) as EntitlementRow | undefined;
  if (!row) return null;
  if (row.status === 'revoked') return rowToEntitlement(row);

  const revokedAt = new Date().toISOString();
  db.prepare("UPDATE entitlements SET status = 'revoked', revoked_at = ? WHERE id = ?").run(revokedAt, entitlementId);
  return { ...rowToEntitlement(row), status: 'revoked', revokedAt };
}
