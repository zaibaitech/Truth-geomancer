// Server-only payment-request persistence and state machine (Prompt 28 —
// manual payment + author approval). A PaymentRequest is NOT an
// entitlement (see lib/access/types.ts's own comment): it only records a
// user's claim to have paid, pending admin review. The ONLY path from a
// PaymentRequest to real access is approvePaymentRequest() below calling
// the existing, unmodified grantEntitlement() from ./entitlements — no
// other function in this module, and nothing in any route, ever calls
// grantEntitlement() itself.
//
// PROOF STORAGE LIMITATION (Prompt 28, Phase 3/17): this repository has no
// secure object-storage layer (no S3-equivalent, no authenticated file
// serving) — only the SQLite database via lib/server/db.ts. Storing an
// uploaded proof image/PDF as a BLOB in the same SQLite file both users'
// entitlement and identity data lives in would mean either (a) no access
// control on who can retrieve a given proof file (this database has no
// per-row authorization layer for arbitrary binary content), or (b)
// building one from scratch — a large, security-sensitive undertaking out
// of scope for this prompt. Rather than pretend safe proof storage exists,
// this module implements ONLY the payment-reference + note flow the prompt
// explicitly allows as the fallback ("use payment reference + note only
// and document the limitation"). No proof-file field exists anywhere in
// this system.
import { randomUUID } from 'node:crypto';
import { PRODUCT_CATALOGUE } from '@/lib/access/products';
import type { PaymentRequest, PaymentRequestStatus } from '@/lib/access/types';
import { grantEntitlement } from './entitlements';
import type { Db } from './db';

interface PaymentRequestRow {
  id: string;
  user_id: string;
  product_id: string;
  status: PaymentRequestStatus;
  payment_reference: string;
  user_note: string | null;
  admin_note: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

function rowToPaymentRequest(row: PaymentRequestRow): PaymentRequest {
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    status: row.status,
    paymentReference: row.payment_reference,
    userNote: row.user_note ?? undefined,
    adminNote: row.admin_note ?? undefined,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
  };
}

function getRow(db: Db, id: string): PaymentRequestRow | undefined {
  return db.prepare('SELECT * FROM payment_requests WHERE id = ?').get(id) as PaymentRequestRow | undefined;
}

export function getPaymentRequestById(db: Db, id: string): PaymentRequest | null {
  const row = getRow(db, id);
  return row ? rowToPaymentRequest(row) : null;
}

export function getPaymentRequestsForUser(db: Db, userId: string): PaymentRequest[] {
  const rows = db
    .prepare('SELECT * FROM payment_requests WHERE user_id = ? ORDER BY submitted_at DESC')
    .all(userId) as unknown as PaymentRequestRow[];
  return rows.map(rowToPaymentRequest);
}

/** Admin-facing listing. `status` optionally narrows to one state (the
 * dashboard's "pending" queue); omitted returns everything, newest first. */
export function listPaymentRequestsForAdmin(db: Db, status?: PaymentRequestStatus): PaymentRequest[] {
  const rows = (
    status
      ? db.prepare('SELECT * FROM payment_requests WHERE status = ? ORDER BY submitted_at ASC').all(status)
      : db.prepare('SELECT * FROM payment_requests ORDER BY submitted_at DESC').all()
  ) as unknown as PaymentRequestRow[];
  return rows.map(rowToPaymentRequest);
}

export type CreatePaymentRequestResult =
  | { ok: true; request: PaymentRequest; created: boolean }
  | { ok: false; reason: 'unknown-product' | 'already-entitled' | 'invalid-reference' };

/**
 * Creates a payment request for `userId` claiming payment for `productId`.
 * Never trusts a caller-supplied userId — the caller (the API route) must
 * have resolved it from the current session (Prompt 28, Phase 11).
 *
 * Duplicate/repeat-submission policy (Phase 6):
 *  - An unknown or inactive product is refused outright.
 *  - A blank/whitespace-only paymentReference is refused outright.
 *  - If the user already holds an ACTIVE entitlement for this exact
 *    product, refuse — a new request would be misleading (they already
 *    have access). This does NOT block a Bundle request from a Master-only
 *    holder: Bundle is a different productId that grants strictly more,
 *    so it is never "already entitled" for Bundle specifically.
 *  - If the user already has a PENDING request for this exact product,
 *    return that existing request (created: false) rather than inserting
 *    an uncontrolled duplicate row.
 *  - A previously REJECTED (or none at all) request allows a fresh
 *    submission — always inserts a new row.
 */
export function createPaymentRequest(
  db: Db,
  userId: string,
  productId: string,
  paymentReference: string,
  userNote?: string,
): CreatePaymentRequestResult {
  const product = PRODUCT_CATALOGUE.find((p) => p.id === productId);
  if (!product || !product.active) return { ok: false, reason: 'unknown-product' };

  const trimmedReference = paymentReference.trim();
  if (trimmedReference.length === 0) return { ok: false, reason: 'invalid-reference' };

  const activeEntitlement = db
    .prepare("SELECT 1 FROM entitlements WHERE user_id = ? AND product_id = ? AND status = 'active'")
    .get(userId, productId);
  if (activeEntitlement) return { ok: false, reason: 'already-entitled' };

  const existingPending = db
    .prepare("SELECT * FROM payment_requests WHERE user_id = ? AND product_id = ? AND status = 'pending'")
    .get(userId, productId) as PaymentRequestRow | undefined;
  if (existingPending) {
    return { ok: true, request: rowToPaymentRequest(existingPending), created: false };
  }

  const id = randomUUID();
  const submittedAt = new Date().toISOString();
  const trimmedNote = userNote?.trim();
  db.prepare(
    'INSERT INTO payment_requests (id, user_id, product_id, status, payment_reference, user_note, admin_note, submitted_at, reviewed_at, reviewed_by) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, NULL, NULL)',
  ).run(id, userId, productId, 'pending', trimmedReference, trimmedNote && trimmedNote.length > 0 ? trimmedNote : null, submittedAt);

  return {
    ok: true,
    created: true,
    request: {
      id,
      userId,
      productId,
      status: 'pending',
      paymentReference: trimmedReference,
      userNote: trimmedNote && trimmedNote.length > 0 ? trimmedNote : undefined,
      submittedAt,
    },
  };
}

export type ReviewResult =
  | { ok: true; request: PaymentRequest }
  | { ok: false; reason: 'not-found' | 'not-pending' | 'unknown-product' };

/**
 * Approves a pending payment request: grants the product's entitlement via
 * the existing grantEntitlement() and marks the request approved.
 *
 * Transactional safety (Prompt 28, Phase 16): node:sqlite's DatabaseSync is
 * synchronous and this function contains no `await`, so — Node.js being
 * single-threaded — no other request can interleave between this
 * function's read and its writes; the whole operation is atomic with
 * respect to every other call in this process. Wrapped in an explicit
 * BEGIN IMMEDIATE/COMMIT/ROLLBACK for crash consistency (a process
 * interruption mid-write leaves either the old or the new state, never a
 * half-written row).
 *
 * Idempotent by design, matching grantEntitlement()'s own idempotency:
 *  - Already-APPROVED: re-runs grantEntitlement() (itself a no-op if the
 *    entitlement is already active) and returns the SAME reviewedAt/
 *    reviewedBy from the original approval — a retried click never creates
 *    a duplicate entitlement, never re-stamps the review time.
 *  - REJECTED: refused (`not-pending`) — an already-rejected request can
 *    never be approved after the fact; no accidental entitlement is ever
 *    left behind by a reject-then-approve sequence.
 *  - PENDING: the normal path — grants, then marks approved.
 */
export function approvePaymentRequest(db: Db, requestId: string, reviewerId: string): ReviewResult {
  db.exec('BEGIN IMMEDIATE');
  try {
    const row = getRow(db, requestId);
    if (!row) {
      db.exec('ROLLBACK');
      return { ok: false, reason: 'not-found' };
    }
    if (row.status === 'rejected') {
      db.exec('ROLLBACK');
      return { ok: false, reason: 'not-pending' };
    }

    const product = PRODUCT_CATALOGUE.find((p) => p.id === row.product_id);
    if (!product || !product.active) {
      db.exec('ROLLBACK');
      return { ok: false, reason: 'unknown-product' };
    }

    if (row.status === 'approved') {
      // Idempotent retry: re-run the (itself idempotent) grant, but never
      // touch reviewed_at/reviewed_by again — the original approval's
      // record stays the historical truth.
      grantEntitlement(db, row.user_id, row.product_id, 'manual-payment');
      db.exec('COMMIT');
      return { ok: true, request: rowToPaymentRequest(row) };
    }

    // status === 'pending'
    grantEntitlement(db, row.user_id, row.product_id, 'manual-payment');
    const reviewedAt = new Date().toISOString();
    db.prepare("UPDATE payment_requests SET status = 'approved', reviewed_at = ?, reviewed_by = ? WHERE id = ?").run(
      reviewedAt,
      reviewerId,
      requestId,
    );
    db.exec('COMMIT');
    return {
      ok: true,
      request: { ...rowToPaymentRequest(row), status: 'approved', reviewedAt, reviewedBy: reviewerId },
    };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

/**
 * Rejects a pending payment request. NEVER calls grantEntitlement() or any
 * other access-granting function — a rejected request provides no access,
 * by construction (Phase 9).
 *
 * Idempotent: already-REJECTED returns the existing (unchanged) row.
 * Already-APPROVED is refused (`not-pending`) — an approved request (and
 * its already-granted entitlement) is never silently reversed by a
 * reject call; revoking access, if ever needed, is a distinct decision
 * outside this function's scope (lib/server/entitlements.ts's
 * revokeEntitlement exists for that, and is never invoked from here).
 */
export function rejectPaymentRequest(db: Db, requestId: string, reviewerId: string, adminNote?: string): ReviewResult {
  const row = getRow(db, requestId);
  if (!row) return { ok: false, reason: 'not-found' };
  if (row.status === 'approved') return { ok: false, reason: 'not-pending' };
  if (row.status === 'rejected') return { ok: true, request: rowToPaymentRequest(row) };

  const reviewedAt = new Date().toISOString();
  const trimmedNote = adminNote?.trim();
  const noteToStore = trimmedNote && trimmedNote.length > 0 ? trimmedNote : null;
  db.prepare(
    "UPDATE payment_requests SET status = 'rejected', reviewed_at = ?, reviewed_by = ?, admin_note = ? WHERE id = ?",
  ).run(reviewedAt, reviewerId, noteToStore, requestId);

  return {
    ok: true,
    request: { ...rowToPaymentRequest(row), status: 'rejected', reviewedAt, reviewedBy: reviewerId, adminNote: noteToStore ?? undefined },
  };
}
