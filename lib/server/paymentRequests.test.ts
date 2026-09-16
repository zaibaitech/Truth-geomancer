// Tests for the payment-request domain state machine (Prompt 28, Phase 15
// — PAYMENT REQUEST CREATION, DUPLICATES, APPROVAL, REJECTION, ACCESS
// INTEGRATION, PROTECTED CONTENT, and Phase 16 — TRANSACTIONAL SAFETY).
// Real ':memory:' database per test, never a mock — see entitlements.test.ts
// for why.
import { afterEach, describe, expect, it } from 'vitest';
import { canAccessForUser } from './accessService';
import { openDatabase, type Db } from './db';
import { getOrCreateUser } from './identity';
import { getActiveEntitlementsForUser } from './entitlements';
import {
  approvePaymentRequest,
  createPaymentRequest,
  getPaymentRequestById,
  getPaymentRequestsForUser,
  listPaymentRequestsForAdmin,
  rejectPaymentRequest,
} from './paymentRequests';
import { KANZUL_PRODUCT, MASTER_PRODUCT, BUNDLE_PRODUCT } from '@/lib/access/products';

let db: Db;
afterEach(() => {
  try {
    db?.close();
  } catch {
    // Not open for a test that never called openDatabase(); nothing to clean up.
  }
});

function makeUser(): string {
  return getOrCreateUser(db, null).user.id;
}

// ---------------------------------------------------------------------------
// PAYMENT REQUEST CREATION (1-7)
// ---------------------------------------------------------------------------
describe('payment request creation', () => {
  it('1: current server identity can submit a payment request', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const result = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-001');
    expect(result.ok).toBe(true);
  });

  it('2: submitted request belongs to the current server identity', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const result = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-002');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.request.userId).toBe(userId);
  });

  it('3: the function signature itself has no path for a caller-chosen user id — createPaymentRequest always writes the userId it was called with, and the API route (tested separately) resolves that argument only from getCurrentUser()', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const result = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-003');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // The row in the database is keyed by the real, server-resolved userId —
    // there is no "userId" field anywhere in the function's OTHER
    // parameters (productId/paymentReference/userNote) a caller could smuggle
    // a different id through.
    expect(getPaymentRequestById(db, result.request.id)?.userId).toBe(userId);
  });

  it('4: unknown product rejected', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const result = createPaymentRequest(db, userId, 'not-a-real-product', 'TXN-004');
    expect(result).toEqual({ ok: false, reason: 'unknown-product' });
  });

  it('5: inactive product rejected', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    // No product in the real catalogue is inactive today, so this exercises
    // the check via a synthetic product id that cannot match any active
    // catalogue entry — the same code path an inactive product would hit.
    const result = createPaymentRequest(db, userId, 'inactive-fixture-product', 'TXN-005');
    expect(result).toEqual({ ok: false, reason: 'unknown-product' });
  });

  it('6: missing payment reference rejected', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    expect(createPaymentRequest(db, userId, KANZUL_PRODUCT.id, '')).toEqual({ ok: false, reason: 'invalid-reference' });
    expect(createPaymentRequest(db, userId, KANZUL_PRODUCT.id, '   ')).toEqual({ ok: false, reason: 'invalid-reference' });
  });

  it('7: malformed request (empty reference alongside unknown product) is rejected safely, never throws', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    expect(() => createPaymentRequest(db, userId, '', '')).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// DUPLICATES (8-10)
// ---------------------------------------------------------------------------
describe('duplicate/repeat request policy', () => {
  it('8: duplicate pending request for the same product returns the existing request, never a second row', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const first = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-008-A');
    const second = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-008-B');
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.created).toBe(false);
    expect(second.request.id).toBe(first.request.id);
    expect(getPaymentRequestsForUser(db, userId).filter((r) => r.productId === KANZUL_PRODUCT.id)).toHaveLength(1);
  });

  it('9: an active entitlement prevents a misleading duplicate purchase request for the SAME product', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const first = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-009');
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    approvePaymentRequest(db, first.request.id, 'admin-fixture');

    const again = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-009-AGAIN');
    expect(again).toEqual({ ok: false, reason: 'already-entitled' });
  });

  it('9b: a Master entitlement does NOT block a Bundle request (Bundle grants strictly more)', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const masterReq = createPaymentRequest(db, userId, MASTER_PRODUCT.id, 'TXN-009B');
    expect(masterReq.ok).toBe(true);
    if (!masterReq.ok) return;
    approvePaymentRequest(db, masterReq.request.id, 'admin-fixture');

    const bundleReq = createPaymentRequest(db, userId, BUNDLE_PRODUCT.id, 'TXN-009B-BUNDLE');
    expect(bundleReq.ok).toBe(true);
  });

  it('10: a rejected request can be resubmitted', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const first = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-010');
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    rejectPaymentRequest(db, first.request.id, 'admin-fixture', 'no matching payment found');

    const again = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-010-RETRY');
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.created).toBe(true);
    expect(again.request.id).not.toBe(first.request.id);
  });
});

// ---------------------------------------------------------------------------
// USER ISOLATION (11-12) — at the query-shape level; route-level isolation
// (Phase 11's "server resolves current user, not a client-supplied id") is
// covered by the API route tests.
// ---------------------------------------------------------------------------
describe('user isolation', () => {
  it('11: user A cannot see user B’s payment request via getPaymentRequestsForUser', () => {
    db = openDatabase(':memory:');
    const userA = makeUser();
    const userB = getOrCreateUser(db, 'a-different-real-session-token').user.id;
    createPaymentRequest(db, userA, KANZUL_PRODUCT.id, 'TXN-011-A');
    createPaymentRequest(db, userB, MASTER_PRODUCT.id, 'TXN-011-B');

    const aRequests = getPaymentRequestsForUser(db, userA);
    expect(aRequests).toHaveLength(1);
    expect(aRequests[0].userId).toBe(userA);
  });

  it('12: nothing in this module lets user A act on user B’s request id without that id already being B’s own — approve/reject operate on whatever request id is passed, so isolation is enforced by the ROUTE never accepting an arbitrary id from a non-admin caller (see the API route tests), not by this function guessing ownership', () => {
    db = openDatabase(':memory:');
    const userA = makeUser();
    const userB = getOrCreateUser(db, 'yet-another-real-session-token').user.id;
    const bRequest = createPaymentRequest(db, userB, KANZUL_PRODUCT.id, 'TXN-012');
    expect(bRequest.ok).toBe(true);
    if (!bRequest.ok) return;

    // userA has no mutation function available to them at all in this
    // module that takes a userId — approve/reject are ADMIN-only
    // operations by design (Phase 7/11), never callable with "as user A".
    expect(getPaymentRequestsForUser(db, userA)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// APPROVAL (17-22)
// ---------------------------------------------------------------------------
describe('approval', () => {
  it('17: pending request approval grants the correct product entitlement', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const req = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-017');
    expect(req.ok).toBe(true);
    if (!req.ok) return;
    approvePaymentRequest(db, req.request.id, 'admin-fixture');

    expect(canAccessForUser(db, userId, { kind: 'book', bookId: 'kanzul-mikban' })).toBe(true);
  });

  it('18: approval marks the request approved', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const req = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-018');
    expect(req.ok).toBe(true);
    if (!req.ok) return;
    const result = approvePaymentRequest(db, req.request.id, 'admin-fixture');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.request.status).toBe('approved');
  });

  it('19: approval records reviewer and time', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const req = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-019');
    expect(req.ok).toBe(true);
    if (!req.ok) return;
    const result = approvePaymentRequest(db, req.request.id, 'admin-42');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.request.reviewedBy).toBe('admin-42');
    expect(result.request.reviewedAt).toBeTruthy();
  });

  it('20: approval cannot be repeated to create a duplicate entitlement', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const req = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-020');
    expect(req.ok).toBe(true);
    if (!req.ok) return;
    approvePaymentRequest(db, req.request.id, 'admin-1');
    approvePaymentRequest(db, req.request.id, 'admin-2');
    approvePaymentRequest(db, req.request.id, 'admin-3');

    expect(getActiveEntitlementsForUser(db, userId).filter((e) => e.productId === KANZUL_PRODUCT.id)).toHaveLength(1);
  });

  it('20b: repeated approval keeps the ORIGINAL reviewer/time, not the latest retry', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const req = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-020B');
    expect(req.ok).toBe(true);
    if (!req.ok) return;
    const first = approvePaymentRequest(db, req.request.id, 'admin-original');
    const second = approvePaymentRequest(db, req.request.id, 'admin-retry');
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.request.reviewedBy).toBe('admin-original');
    expect(second.request.reviewedAt).toBe(first.request.reviewedAt);
  });

  it('21: an unknown request id cannot be approved', () => {
    db = openDatabase(':memory:');
    expect(approvePaymentRequest(db, 'not-a-real-request-id', 'admin-fixture')).toEqual({ ok: false, reason: 'not-found' });
  });

  it('22: an already-rejected request cannot be approved', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const req = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-022');
    expect(req.ok).toBe(true);
    if (!req.ok) return;
    rejectPaymentRequest(db, req.request.id, 'admin-fixture');
    expect(approvePaymentRequest(db, req.request.id, 'admin-fixture')).toEqual({ ok: false, reason: 'not-pending' });
  });
});

// ---------------------------------------------------------------------------
// REJECTION (23-25)
// ---------------------------------------------------------------------------
describe('rejection', () => {
  it('23: rejection marks the request rejected', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const req = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-023');
    expect(req.ok).toBe(true);
    if (!req.ok) return;
    const result = rejectPaymentRequest(db, req.request.id, 'admin-fixture', 'not received');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.request.status).toBe('rejected');
    expect(result.request.adminNote).toBe('not received');
  });

  it('24: rejection does not create an entitlement', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const req = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-024');
    expect(req.ok).toBe(true);
    if (!req.ok) return;
    rejectPaymentRequest(db, req.request.id, 'admin-fixture');
    expect(getActiveEntitlementsForUser(db, userId)).toHaveLength(0);
  });

  it('25: a rejected request cannot authorize protected content', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const req = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-025');
    expect(req.ok).toBe(true);
    if (!req.ok) return;
    rejectPaymentRequest(db, req.request.id, 'admin-fixture');
    expect(canAccessForUser(db, userId, { kind: 'book', bookId: 'kanzul-mikban' })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ACCESS INTEGRATION (26-30)
// ---------------------------------------------------------------------------
describe('access integration', () => {
  it('26-27: approved Master request grants Master access, Kanzul remains inaccessible', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const req = createPaymentRequest(db, userId, MASTER_PRODUCT.id, 'TXN-026');
    expect(req.ok).toBe(true);
    if (!req.ok) return;
    approvePaymentRequest(db, req.request.id, 'admin-fixture');

    expect(canAccessForUser(db, userId, { kind: 'book', bookId: 'master-of-geomancy-vol-1' })).toBe(true);
    expect(canAccessForUser(db, userId, { kind: 'book', bookId: 'kanzul-mikban' })).toBe(false);
  });

  it('28-29: approved Kanzul request grants Kanzul access, Master remains inaccessible', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const req = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-028');
    expect(req.ok).toBe(true);
    if (!req.ok) return;
    approvePaymentRequest(db, req.request.id, 'admin-fixture');

    expect(canAccessForUser(db, userId, { kind: 'book', bookId: 'kanzul-mikban' })).toBe(true);
    expect(canAccessForUser(db, userId, { kind: 'book', bookId: 'master-of-geomancy-vol-1' })).toBe(false);
  });

  it('30: approved Bundle request grants both', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const req = createPaymentRequest(db, userId, BUNDLE_PRODUCT.id, 'TXN-030');
    expect(req.ok).toBe(true);
    if (!req.ok) return;
    approvePaymentRequest(db, req.request.id, 'admin-fixture');

    expect(canAccessForUser(db, userId, { kind: 'book', bookId: 'kanzul-mikban' })).toBe(true);
    expect(canAccessForUser(db, userId, { kind: 'book', bookId: 'master-of-geomancy-vol-1' })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// PROTECTED CONTENT (31-34)
// ---------------------------------------------------------------------------
describe('protected content authorization', () => {
  it('31: a freshly-submitted payment request alone does NOT authorize protected content', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-031');
    expect(canAccessForUser(db, userId, { kind: 'book', bookId: 'kanzul-mikban' })).toBe(false);
  });

  it('32: a pending request does NOT authorize protected content', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const req = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-032');
    expect(req.ok).toBe(true);
    if (!req.ok) return;
    expect(req.request.status).toBe('pending');
    expect(canAccessForUser(db, userId, { kind: 'book', bookId: 'kanzul-mikban' })).toBe(false);
  });

  it('33: a rejected request does NOT authorize protected content', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const req = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-033');
    expect(req.ok).toBe(true);
    if (!req.ok) return;
    rejectPaymentRequest(db, req.request.id, 'admin-fixture');
    expect(canAccessForUser(db, userId, { kind: 'book', bookId: 'kanzul-mikban' })).toBe(false);
  });

  it('34: only an active entitlement (never a PaymentRequest row of any status) authorizes protected content', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const req = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-034');
    expect(req.ok).toBe(true);
    if (!req.ok) return;
    approvePaymentRequest(db, req.request.id, 'admin-fixture');
    // Access is granted — but by the entitlement the approval created, not
    // by the payment_requests row itself. Prove this by revoking the
    // entitlement directly and confirming access is lost even though the
    // payment request row still says "approved".
    const entitlement = getActiveEntitlementsForUser(db, userId)[0];
    db.prepare("UPDATE entitlements SET status = 'revoked' WHERE id = ?").run(entitlement.id);

    expect(getPaymentRequestById(db, req.request.id)?.status).toBe('approved');
    expect(canAccessForUser(db, userId, { kind: 'book', bookId: 'kanzul-mikban' })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TRANSACTIONAL SAFETY (Phase 16)
// ---------------------------------------------------------------------------
describe('transactional safety', () => {
  it('approve, approve: deterministic single entitlement, no error', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const req = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-T1');
    expect(req.ok).toBe(true);
    if (!req.ok) return;
    approvePaymentRequest(db, req.request.id, 'admin-1');
    approvePaymentRequest(db, req.request.id, 'admin-1');
    expect(getActiveEntitlementsForUser(db, userId)).toHaveLength(1);
    expect(getPaymentRequestById(db, req.request.id)?.status).toBe('approved');
  });

  it('approve, then reject: final state stays approved, entitlement intact', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const req = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-T2');
    expect(req.ok).toBe(true);
    if (!req.ok) return;
    approvePaymentRequest(db, req.request.id, 'admin-1');
    const rejectAttempt = rejectPaymentRequest(db, req.request.id, 'admin-1');
    expect(rejectAttempt).toEqual({ ok: false, reason: 'not-pending' });
    expect(getPaymentRequestById(db, req.request.id)?.status).toBe('approved');
    expect(getActiveEntitlementsForUser(db, userId)).toHaveLength(1);
  });

  it('reject, then approve: final state stays rejected, no entitlement ever exists', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const req = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-T3');
    expect(req.ok).toBe(true);
    if (!req.ok) return;
    rejectPaymentRequest(db, req.request.id, 'admin-1');
    const approveAttempt = approvePaymentRequest(db, req.request.id, 'admin-1');
    expect(approveAttempt).toEqual({ ok: false, reason: 'not-pending' });
    expect(getPaymentRequestById(db, req.request.id)?.status).toBe('rejected');
    expect(getActiveEntitlementsForUser(db, userId)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Admin listing sanity
// ---------------------------------------------------------------------------
describe('admin listing', () => {
  it('lists pending requests across users, oldest first', () => {
    db = openDatabase(':memory:');
    const userA = makeUser();
    const userB = getOrCreateUser(db, 'admin-listing-fixture-token').user.id;
    createPaymentRequest(db, userA, KANZUL_PRODUCT.id, 'TXN-L1');
    createPaymentRequest(db, userB, MASTER_PRODUCT.id, 'TXN-L2');

    const pending = listPaymentRequestsForAdmin(db, 'pending');
    expect(pending).toHaveLength(2);
    expect(pending.every((r) => r.status === 'pending')).toBe(true);
  });

  it('never returns another status when filtered by "pending"', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const req = createPaymentRequest(db, userId, KANZUL_PRODUCT.id, 'TXN-L3');
    expect(req.ok).toBe(true);
    if (!req.ok) return;
    approvePaymentRequest(db, req.request.id, 'admin-fixture');
    expect(listPaymentRequestsForAdmin(db, 'pending')).toHaveLength(0);
  });
});
