// Staff authorization — the read side (who is staff, for which books).
//
// Staff access is a SEPARATE path from customer access and is never stored or
// represented as an entitlement:
//
//   customer        user -> entitlement -> product -> book/method/feature
//   author          user -> staff_roles('author') -> book_staff(book) -> that book
//   platform admin  user -> staff_roles('platform_admin') -> every book
//
// Nothing here writes to entitlements, payment_requests or paystack_payments,
// so staff reading never counts as a purchase or a reader in the admin stats.
//
// Fail-closed rules applied on every read:
//   - only rows with revoked_at IS NULL count (revocation is immediate);
//   - the user must have a verified email — an anonymous identity never has
//     staff authority even if a row somehow existed;
//   - a book assignment only counts while the user holds an active 'author'
//     role, and only for a book that exists in the server-side BOOKS catalogue.
//
// Mutations (granting/revoking) live in lib/server/staffAdmin.ts.
import { BOOKS } from '@/content/books';
import { grantsCoverResource, type AccessResource } from '@/lib/access/access';
import { PRODUCT_CATALOGUE } from '@/lib/access/products';
import type { EntitlementGrant, Product } from '@/lib/access/types';
import type { Db } from './db';

export type StaffRole = 'platform_admin' | 'author';
export const STAFF_ROLES: readonly StaffRole[] = ['platform_admin', 'author'];

/** One user's effective staff authority, resolved from the database. */
export interface StaffAccess {
  role: StaffRole | null;
  /** Books this user may read and work with as an author (empty for
   * platform admins, whose authority is platform-wide, and for non-staff). */
  authorBookIds: ReadonlySet<string>;
}

export const NO_STAFF_ACCESS: StaffAccess = { role: null, authorBookIds: new Set() };

const KNOWN_BOOK_IDS: ReadonlySet<string> = new Set(BOOKS.map((book) => book.id));

export function isKnownBookId(bookId: string): boolean {
  return KNOWN_BOOK_IDS.has(bookId);
}

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === 'string' && (STAFF_ROLES as readonly string[]).includes(value);
}

/** The user's active staff role, or null. Requires a verified (email) user. */
export async function getStaffRole(db: Db, userId: string): Promise<StaffRole | null> {
  const row = await db.queryOne<{ role: string }>(
    `SELECT s.role FROM staff_roles s JOIN users u ON u.id = s.user_id
      WHERE s.user_id = ? AND s.revoked_at IS NULL AND u.email IS NOT NULL`,
    [userId],
  );
  return row && isStaffRole(row.role) ? row.role : null;
}

/** Full staff authority for a user (role + active, valid author assignments). */
export async function getStaffAccess(db: Db, userId: string): Promise<StaffAccess> {
  const role = await getStaffRole(db, userId);
  if (role !== 'author') return { role, authorBookIds: new Set() };
  const rows = await db.query<{ book_id: string }>(
    "SELECT book_id FROM book_staff WHERE user_id = ? AND role = 'author' AND revoked_at IS NULL",
    [userId],
  );
  return { role, authorBookIds: new Set(rows.map((r) => r.book_id).filter(isKnownBookId)) };
}

export async function isPlatformAdmin(db: Db, userId: string): Promise<boolean> {
  return (await getStaffRole(db, userId)) === 'platform_admin';
}

export async function isAuthorForBook(db: Db, userId: string, bookId: string): Promise<boolean> {
  return (await getStaffAccess(db, userId)).authorBookIds.has(bookId);
}

/** Book IDs this user may manage as staff: every book for a platform admin,
 * only assigned books for an author, none otherwise. */
export function staffBookIds(staff: StaffAccess): string[] {
  if (staff.role === 'platform_admin') return BOOKS.map((book) => book.id);
  if (staff.role === 'author') return BOOKS.map((book) => book.id).filter((id) => staff.authorBookIds.has(id));
  return [];
}

function bookIdsGrantedBy(product: Product): string[] {
  return product.entitlementGrants.flatMap((grant) => (grant.kind === 'book' ? [grant.bookId] : []));
}

/**
 * The content grants a staff member's authority covers, expressed with the
 * SAME product grants customers receive, so every book/method/feature check
 * uses one coverage rule (grantsCoverResource).
 *
 *  - platform admin: every active product's grants.
 *  - author: the grants of active products whose books are ALL assigned to
 *    them. A bundle that also contains an unassigned book is excluded, so an
 *    author of one book can never reach another book's methods or features
 *    through it.
 */
export function staffGrants(staff: StaffAccess, catalogue: readonly Product[] = PRODUCT_CATALOGUE): EntitlementGrant[] {
  if (staff.role === 'platform_admin') {
    return catalogue.filter((p) => p.active).flatMap((p) => p.entitlementGrants);
  }
  if (staff.role === 'author' && staff.authorBookIds.size > 0) {
    return catalogue
      .filter((p) => {
        if (!p.active) return false;
        const books = bookIdsGrantedBy(p);
        return books.length > 0 && books.every((id) => staff.authorBookIds.has(id));
      })
      .flatMap((p) => p.entitlementGrants);
  }
  return [];
}

export type StaffAccessReason = 'platform-admin' | 'author';

/** Whether staff authority alone covers `resource`, and why. Null = no. */
export function staffAccessReason(
  staff: StaffAccess,
  resource: AccessResource,
  catalogue: readonly Product[] = PRODUCT_CATALOGUE,
): StaffAccessReason | null {
  if (!grantsCoverResource(staffGrants(staff, catalogue), resource)) return null;
  return staff.role === 'platform_admin' ? 'platform-admin' : 'author';
}
