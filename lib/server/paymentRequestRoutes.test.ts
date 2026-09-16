// Structural security checks on the Prompt 28 payment-request/admin route
// handlers — the same pattern established in
// contentDeliverySecurity.test.ts (Prompt 27): a real database/service
// layer test proves the LOGIC is correct (see paymentRequests.test.ts and
// adminAuth.test.ts); these tests prove the ROUTE WIRING itself never
// undermines that logic — no client-supplied userId, no missing admin
// check, no response caching that could leak one user's data to another.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const PAYMENT_REQUESTS_ROUTE = readFileSync('app/api/payment-requests/route.ts', 'utf-8');
const ADMIN_LOGIN_ROUTE = readFileSync('app/api/admin/login/route.ts', 'utf-8');
const ADMIN_LIST_ROUTE = readFileSync('app/api/admin/payment-requests/route.ts', 'utf-8');
const APPROVE_ROUTE = readFileSync('app/api/admin/payment-requests/[id]/approve/route.ts', 'utf-8');
const REJECT_ROUTE = readFileSync('app/api/admin/payment-requests/[id]/reject/route.ts', 'utf-8');
const PAYMENT_REQUEST_ACTIONS = readFileSync('components/admin/PaymentRequestActions.tsx', 'utf-8');

describe('3: the payment-request creation route never reads a client-supplied userId', () => {
  it('POST /api/payment-requests destructures productId/paymentReference/userNote from the body, never userId', () => {
    expect(PAYMENT_REQUESTS_ROUTE).not.toMatch(/body\.userId|\{\s*userId[,}]/);
    expect(PAYMENT_REQUESTS_ROUTE).toMatch(/getCurrentUser\(\)/);
  });
});

describe('user isolation at the route level', () => {
  it('GET /api/payment-requests resolves the user from the session, never from a query param', () => {
    expect(PAYMENT_REQUESTS_ROUTE).not.toMatch(/searchParams\.get\(['"]userId['"]\)/);
    expect(PAYMENT_REQUESTS_ROUTE).toMatch(/getPaymentRequestsForUser\(db, user\.id\)/);
  });

  it('both routes set Cache-Control: private, no-store so a shared cache never serves one user’s response to another', () => {
    expect(PAYMENT_REQUESTS_ROUTE).toMatch(/private, no-store/);
  });
});

describe('13-16: admin routes are all gated by the server-authoritative admin check', () => {
  it('the admin listing route checks isCurrentUserAdmin() before returning any data', () => {
    expect(ADMIN_LIST_ROUTE).toMatch(/isCurrentUserAdmin\(\)/);
    expect(ADMIN_LIST_ROUTE.indexOf('isCurrentUserAdmin')).toBeLessThan(ADMIN_LIST_ROUTE.indexOf('listPaymentRequestsForAdmin'));
  });

  it('the approve route checks currentAdminReviewerId() before touching the database', () => {
    expect(APPROVE_ROUTE).toMatch(/currentAdminReviewerId\(\)/);
    expect(APPROVE_ROUTE.indexOf('currentAdminReviewerId')).toBeLessThan(APPROVE_ROUTE.indexOf('approvePaymentRequest'));
  });

  it('the reject route checks currentAdminReviewerId() before touching the database', () => {
    expect(REJECT_ROUTE).toMatch(/currentAdminReviewerId\(\)/);
    expect(REJECT_ROUTE.indexOf('currentAdminReviewerId')).toBeLessThan(REJECT_ROUTE.indexOf('rejectPaymentRequest'));
  });

  it('none of the admin routes ever infer admin status from the request body, a query parameter, or a header other than the session cookie read inside isCurrentUserAdmin/currentAdminReviewerId', () => {
    for (const source of [ADMIN_LIST_ROUTE, APPROVE_ROUTE, REJECT_ROUTE]) {
      expect(source).not.toMatch(/isAdmin\s*[:=]\s*(true|body\.|request\.headers\.get)/);
    }
  });

  it('the login route compares the submitted secret only via loginAdmin() — never a direct string/env comparison inline that could be bypassed', () => {
    expect(ADMIN_LOGIN_ROUTE).toMatch(/loginAdmin\(secret\)/);
    expect(ADMIN_LOGIN_ROUTE).not.toMatch(/process\.env\.TG_ADMIN_SECRET/);
  });
});

describe('approval/rejection never accept an entitlement grant directly from the client', () => {
  it('the approve route body is never read for productId/entitlement fields — only the URL param id', () => {
    expect(APPROVE_ROUTE).not.toMatch(/body\.productId|body\.entitlement/);
  });

  it('neither admin route ever imports grantEntitlement directly — only via approvePaymentRequest', () => {
    expect(APPROVE_ROUTE).not.toMatch(/from ['"]@\/lib\/server\/entitlements['"]/);
    expect(REJECT_ROUTE).not.toMatch(/from ['"]@\/lib\/server\/entitlements['"]/);
  });
});

// Prompt 39/40 — a real, reproduced bug: a successful Approve/Reject POST
// (server confirmed working — status updated, entitlement granted) left the
// button stuck on "Approving…"/"Rejecting…" forever, because the shared
// act() function's success branch never released `busy`. It relied entirely
// on router.refresh() causing this component instance to unmount, which is
// not guaranteed to happen immediately (or be visible to the user) even
// when the underlying request fully succeeded. The vitest setup here runs
// in a 'node' environment with no DOM/React Testing Library and does not
// include .tsx files at all (see vitest.config.ts's `include`), so a real
// rendered-interaction test is not supported — these are structural checks
// on the source, consistent with this file's own established pattern.
describe('40: Approve/Reject success path releases the busy state', () => {
  it('setBusy(null) is called on the success path, after router.refresh(), not only on the error/catch paths', () => {
    const actBody = PAYMENT_REQUEST_ACTIONS.slice(
      PAYMENT_REQUEST_ACTIONS.indexOf('async function act('),
      PAYMENT_REQUEST_ACTIONS.indexOf('return (', PAYMENT_REQUEST_ACTIONS.indexOf('async function act(')),
    );
    const refreshIdx = actBody.indexOf('router.refresh()');
    expect(refreshIdx).toBeGreaterThan(-1);
    const afterRefresh = actBody.slice(refreshIdx);
    // setBusy(null) must appear before the success branch ends (i.e. before
    // the `catch` block begins) — not only inside `if (!res.ok)` above it.
    const catchIdx = afterRefresh.indexOf('catch');
    const successTail = catchIdx === -1 ? afterRefresh : afterRefresh.slice(0, catchIdx);
    expect(successTail).toMatch(/setBusy\(null\)/);
  });

  it('this success-path reset is shared by both approve and reject — act() takes the action as a parameter rather than duplicating the request logic per action', () => {
    expect(PAYMENT_REQUEST_ACTIONS).toMatch(/async function act\(action: 'approve' \| 'reject'\)/);
    expect(PAYMENT_REQUEST_ACTIONS.match(/setBusy\(null\)/g)?.length).toBe(3); // error branch, success branch (the fix), and the catch branch
  });

  it('the error/catch paths still call setError and setBusy(null) exactly as before — the fix only added a call, never removed one', () => {
    expect(PAYMENT_REQUEST_ACTIONS).toMatch(/setError\(body\.error \?\? 'Something went wrong\.'\)/);
    expect(PAYMENT_REQUEST_ACTIONS).toMatch(/setError\('Could not reach the server\.'\)/);
  });
});
