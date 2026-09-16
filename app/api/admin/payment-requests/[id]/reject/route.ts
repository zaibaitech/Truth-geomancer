import { NextResponse } from 'next/server';
import { currentAdminReviewerId } from '@/lib/server/adminSession';
import { getDb } from '@/lib/server/db';
import { rejectPaymentRequest } from '@/lib/server/paymentRequests';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

// Prompt 28, Phase 9/11: never calls the entitlement-granting function or
// any other access-granting function — a rejected request provides no
// access, by construction (see paymentRequests.ts's rejectPaymentRequest).
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const reviewerId = currentAdminReviewerId();
  if (!reviewerId) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403, headers: NO_STORE_HEADERS });
  }

  let adminNote: string | undefined;
  try {
    const body = await request.json();
    if (typeof body === 'object' && body !== null && 'adminNote' in body) {
      const note = (body as Record<string, unknown>).adminNote;
      if (note !== undefined && typeof note !== 'string') {
        return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: NO_STORE_HEADERS });
      }
      adminNote = note;
    }
  } catch {
    // No body / empty body is fine — adminNote is optional.
  }

  const db = getDb();
  const result = rejectPaymentRequest(db, params.id, reviewerId, adminNote);

  if (!result.ok) {
    const status = result.reason === 'not-found' ? 404 : 409;
    const messages: Record<typeof result.reason, string> = {
      'not-found': 'Payment request not found.',
      'not-pending': 'This request has already been approved and cannot be rejected.',
      'unknown-product': 'This product is no longer available.',
    };
    return NextResponse.json({ error: messages[result.reason] }, { status, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json({ request: result.request }, { headers: NO_STORE_HEADERS });
}
