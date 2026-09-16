import { NextResponse } from 'next/server';
import { currentAdminReviewerId } from '@/lib/server/adminSession';
import { getDb } from '@/lib/server/db';
import { approvePaymentRequest } from '@/lib/server/paymentRequests';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

// Prompt 28, Phase 8/11: the ONLY route in this whole system that can lead
// to the entitlement-granting function in lib/server/entitlements.ts being
// called — via approvePaymentRequest(), never directly. Admin-gated; never
// accepts a userId/productId from the request body (the request id in the
// URL already pins both, via the existing payment_requests row).
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const reviewerId = await currentAdminReviewerId();
  if (!reviewerId) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403, headers: NO_STORE_HEADERS });
  }

  const db = getDb();
  const result = await approvePaymentRequest(db, params.id, reviewerId);

  if (!result.ok) {
    const status = result.reason === 'not-found' ? 404 : 409;
    const messages: Record<typeof result.reason, string> = {
      'not-found': 'Payment request not found.',
      'not-pending': 'This request has already been reviewed and cannot be approved.',
      'unknown-product': 'This product is no longer available.',
    };
    return NextResponse.json({ error: messages[result.reason] }, { status, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json({ request: result.request }, { headers: NO_STORE_HEADERS });
}
