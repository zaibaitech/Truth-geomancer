// Author Dashboard aggregate reads (Prompt 65). Read-only: nothing here
// grants, revokes, or otherwise mutates an entitlement — it only counts
// rows the existing entitlements table (lib/server/entitlements.ts) already
// stores. No schema change, no migration: `entitlements(product_id, status,
// user_id)` already carries everything a "how many readers" count needs.
//
// "Readers" of a book = users with an ACTIVE entitlement to any product that
// grants that book (via productIdsForBook — the same BookGrant check
// access.ts's canAccess() uses, never a second rule). A user who bought the
// bundle counts as a reader of BOTH books but contributes only ONE row to
// entitlements, which is exactly why this counts DISTINCT user_id per book
// rather than assuming one entitlement row = one book = one reader.
import { BOOKS } from '@/content/books';
import { productIdsForBook } from '@/lib/access/products';
import type { Db } from './db';

/** Reader count for every catalogue book, keyed by book id. A book with no
 * product granting it yet (should not happen given the current catalogue,
 * but the function stays honest rather than assuming) gets 0 without a
 * query, never an invented number. */
export async function getReaderCountsByBook(db: Db): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const book of BOOKS) {
    const productIds = productIdsForBook(book.id);
    if (productIds.length === 0) {
      counts[book.id] = 0;
      continue;
    }
    const placeholders = productIds.map(() => '?').join(', ');
    const row = await db.queryOne<{ count: number | string }>(
      `SELECT COUNT(DISTINCT user_id) as count FROM entitlements WHERE status = 'active' AND product_id IN (${placeholders})`,
      productIds,
    );
    // Postgres's node driver can return COUNT(...) as a string; SQLite
    // returns a number. Number() normalizes both, and a missing row (there
    // is always exactly one COUNT row, even for zero matches) never happens.
    counts[book.id] = row ? Number(row.count) : 0;
  }
  return counts;
}

/** Total unique readers across every book — a person who owns both books
 * (individually or via the bundle) is counted once, not twice. */
export async function getTotalUniqueReaders(db: Db): Promise<number> {
  const row = await db.queryOne<{ count: number | string }>(
    "SELECT COUNT(DISTINCT user_id) as count FROM entitlements WHERE status = 'active'",
  );
  return row ? Number(row.count) : 0;
}

/** Total currently-active access grants (entitlement rows). Since
 * grantEntitlement() is only ever called from approvePaymentRequest() (see
 * paymentRequests.ts), this is also, honestly, "how many approvals are
 * currently in effect" — but phrased as a grant count rather than a
 * historical approval count so a revoked entitlement is never counted as
 * still-granted access. */
export async function getTotalActiveAccessGrants(db: Db): Promise<number> {
  const row = await db.queryOne<{ count: number | string }>("SELECT COUNT(*) as count FROM entitlements WHERE status = 'active'");
  return row ? Number(row.count) : 0;
}
