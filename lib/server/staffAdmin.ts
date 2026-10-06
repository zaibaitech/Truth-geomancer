// Staff authorization — the write side. Only ever called by (a) the
// platform-admin-only staff API (app/api/admin/staff) after the CALLER has been
// authorized server-side, and (b) the one-off bootstrap script
// (lib/server/db/bootstrapPlatformAdmin.ts). Never reachable by a customer or
// an author.
//
// Every write validates its TARGET against the database and the server-side
// catalogue — the caller supplies only which person and which book, never any
// authority:
//   - the target must be an existing user with a verified email (anonymous
//     identities can never become staff);
//   - roles are limited to STAFF_ROLES; book IDs to the BOOKS catalogue;
//   - a book assignment requires an active 'author' role;
//   - `granted_by` is passed in by the server (the acting staff user's id, or
//     a fixed marker for break-glass / bootstrap), never read from a request.
//
// Nothing here touches entitlements, payment_requests or paystack_payments.
import { findUsersByEmail } from './identity';
import { normalizeEmail } from './emailAuth';
import { getStaffRole, isKnownBookId, isStaffRole, type StaffRole } from './staff';
import type { Db } from './db';

export type StaffTargetError = 'invalid-email' | 'no-verified-user' | 'ambiguous-email' | 'unknown-user' | 'not-verified';
export type StaffMutationError =
  | StaffTargetError
  | 'invalid-role'
  | 'unknown-book'
  | 'not-an-author'
  | 'no-active-role'
  | 'no-active-assignment'
  | 'cannot-revoke-self';

export type StaffMutationResult = { ok: true } | { ok: false; reason: StaffMutationError };
export type StaffTarget = { ok: true; userId: string; email: string } | { ok: false; reason: StaffTargetError };

/** Resolves an email to exactly one VERIFIED user. Never creates a user. */
export async function findVerifiedUserByEmail(db: Db, rawEmail: string): Promise<StaffTarget> {
  const email = normalizeEmail(rawEmail);
  if (!email) return { ok: false, reason: 'invalid-email' };
  const matches = await findUsersByEmail(db, email);
  if (matches.length === 0) return { ok: false, reason: 'no-verified-user' };
  if (matches.length > 1) return { ok: false, reason: 'ambiguous-email' };
  return { ok: true, userId: matches[0].id, email };
}

/** An existing user id that belongs to a verified (email) user. */
async function verifiedUser(db: Db, userId: string): Promise<StaffTarget> {
  const row = await db.queryOne<{ id: string; email: string | null }>('SELECT id, email FROM users WHERE id = ?', [userId]);
  if (!row) return { ok: false, reason: 'unknown-user' };
  if (!row.email) return { ok: false, reason: 'not-verified' };
  return { ok: true, userId: row.id, email: row.email };
}

const now = () => new Date().toISOString();

/** Grants (or changes, or re-activates) a user's single staff role. */
export async function grantStaffRole(
  db: Db,
  input: { targetUserId: string; role: unknown; grantedBy: string },
): Promise<StaffMutationResult> {
  if (!isStaffRole(input.role)) return { ok: false, reason: 'invalid-role' };
  const role: StaffRole = input.role;
  const target = await verifiedUser(db, input.targetUserId);
  if (!target.ok) return target;
  await db.transaction(async (tx) => {
    // One row per user (staff_roles.user_id is the primary key): granting
    // again re-activates or changes that single row — never a second one.
    await tx.execute(
      `INSERT INTO staff_roles (user_id, role, granted_at, granted_by, revoked_at) VALUES (?, ?, ?, ?, NULL)
       ON CONFLICT (user_id) DO UPDATE SET role = excluded.role, granted_at = excluded.granted_at,
         granted_by = excluded.granted_by, revoked_at = NULL`,
      [target.userId, role, now(), input.grantedBy],
    );
    // Book assignments belong to an author role. Moving to platform_admin
    // ends them, so they can never silently return if the person later
    // becomes an author again — books must then be assigned afresh.
    if (role !== 'author') await endAssignments(tx, target.userId);
  });
  return { ok: true };
}

async function endAssignments(db: Db, userId: string): Promise<void> {
  await db.execute('UPDATE book_staff SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL', [now(), userId]);
}

/** Revokes a user's staff role (history kept). Effective immediately: every
 * access check reads revoked_at. A platform admin cannot revoke their own
 * role, so the last signed-in admin can't lock themselves out by accident. */
export async function revokeStaffRole(
  db: Db,
  input: { targetUserId: string; actingUserId: string | null },
): Promise<StaffMutationResult> {
  if (input.actingUserId !== null && input.actingUserId === input.targetUserId) {
    return { ok: false, reason: 'cannot-revoke-self' };
  }
  const active = await db.queryOne<{ role: string }>('SELECT role FROM staff_roles WHERE user_id = ? AND revoked_at IS NULL', [
    input.targetUserId,
  ]);
  if (!active) return { ok: false, reason: 'no-active-role' };
  await db.transaction(async (tx) => {
    await tx.execute('UPDATE staff_roles SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL', [now(), input.targetUserId]);
    // Revoking the role also ends its book assignments, so re-granting the
    // role later starts with no books (no silent resurrection of old access).
    await endAssignments(tx, input.targetUserId);
  });
  return { ok: true };
}

/** Assigns a catalogue book to a user who currently holds the author role. */
export async function assignBookToAuthor(
  db: Db,
  input: { targetUserId: string; bookId: unknown; grantedBy: string },
): Promise<StaffMutationResult> {
  if (typeof input.bookId !== 'string' || !isKnownBookId(input.bookId)) return { ok: false, reason: 'unknown-book' };
  const target = await verifiedUser(db, input.targetUserId);
  if (!target.ok) return target;
  if ((await getStaffRole(db, target.userId)) !== 'author') return { ok: false, reason: 'not-an-author' };
  await db.execute(
    `INSERT INTO book_staff (book_id, user_id, role, granted_at, granted_by, revoked_at) VALUES (?, ?, 'author', ?, ?, NULL)
     ON CONFLICT (book_id, user_id) DO UPDATE SET granted_at = excluded.granted_at,
       granted_by = excluded.granted_by, revoked_at = NULL`,
    [input.bookId, target.userId, now(), input.grantedBy],
  );
  return { ok: true };
}

/** Ends one author → book assignment (history kept). Effective immediately. */
export async function unassignBookFromAuthor(
  db: Db,
  input: { targetUserId: string; bookId: unknown },
): Promise<StaffMutationResult> {
  if (typeof input.bookId !== 'string' || !isKnownBookId(input.bookId)) return { ok: false, reason: 'unknown-book' };
  const active = await db.queryOne<{ book_id: string }>(
    'SELECT book_id FROM book_staff WHERE book_id = ? AND user_id = ? AND revoked_at IS NULL',
    [input.bookId, input.targetUserId],
  );
  if (!active) return { ok: false, reason: 'no-active-assignment' };
  await db.execute('UPDATE book_staff SET revoked_at = ? WHERE book_id = ? AND user_id = ? AND revoked_at IS NULL', [
    now(),
    input.bookId,
    input.targetUserId,
  ]);
  return { ok: true };
}

export interface StaffMember {
  userId: string;
  email: string;
  role: StaffRole;
  grantedAt: string;
  bookIds: string[];
}

/** Active staff, for the platform-admin staff page. Staff emails only —
 * never customer data. */
export async function listStaff(db: Db): Promise<StaffMember[]> {
  const rows = await db.query<{ user_id: string; email: string | null; role: string; granted_at: string }>(
    `SELECT s.user_id, u.email, s.role, s.granted_at FROM staff_roles s JOIN users u ON u.id = s.user_id
      WHERE s.revoked_at IS NULL AND u.email IS NOT NULL ORDER BY s.role, u.email`,
  );
  const assignments = await db.query<{ user_id: string; book_id: string }>(
    "SELECT user_id, book_id FROM book_staff WHERE revoked_at IS NULL AND role = 'author' ORDER BY book_id",
  );
  return rows
    .filter((r) => isStaffRole(r.role) && r.email)
    .map((r) => ({
      userId: r.user_id,
      email: r.email as string,
      role: r.role as StaffRole,
      grantedAt: r.granted_at,
      bookIds: r.role === 'author' ? assignments.filter((a) => a.user_id === r.user_id).map((a) => a.book_id).filter(isKnownBookId) : [],
    }));
}
