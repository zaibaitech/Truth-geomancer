import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/server/adminActor';
import { isSameOriginRequest } from '@/lib/server/auth/requestGuards';
import { getDb } from '@/lib/server/db';
import { approvePaymentRequest } from '@/lib/server/paymentRequests';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

// Prompt 28, Phase 8/11: one of two routes in this system that can lead to
// the entitlement-granting function in lib/server/entitlements.ts being
// called — via approvePaymentRequest(), never directly (the other is
// app/api/paystack/{webhook,callback}, via paystackFulfilment.ts's own,
// differently-verified path). Admin-gated; never accepts a userId/productId
// from the request body (the request id in the URL already pins both, via
// the existing payment_requests row).
export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403, headers: NO_STORE_HEADERS });
  }
  // Platform admins (or the break-glass session) only. The reviewer is the
  // authenticated actor; the user and product come from the stored request.
  const actor = await requirePlatformAdmin();
  if (!actor) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403, headers: NO_STORE_HEADERS });
  }
  const reviewerId = actor.reviewerId;

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
