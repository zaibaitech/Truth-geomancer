import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/session';
import { getDb } from '@/lib/server/db';
import { createPaymentRequest, getPaymentRequestsForUser } from '@/lib/server/paymentRequests';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

// Prompt 28, Phase 11/12: userId is NEVER read from the request body — it
// comes only from getCurrentUser(), which resolves it from the session
// cookie. A client cannot submit a request "as" another user by any means
// this route accepts.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: NO_STORE_HEADERS });
  }
  const { productId, paymentReference, userNote } = body as Record<string, unknown>;

  if (typeof productId !== 'string' || typeof paymentReference !== 'string') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: NO_STORE_HEADERS });
  }
  if (userNote !== undefined && typeof userNote !== 'string') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const user = getCurrentUser();
  const db = getDb();
  const result = createPaymentRequest(db, user.id, productId, paymentReference, userNote);

  if (!result.ok) {
    const status = result.reason === 'already-entitled' ? 409 : 400;
    const messages: Record<typeof result.reason, string> = {
      'unknown-product': 'This product is not available.',
      'already-entitled': 'You already have access to this product.',
      'invalid-reference': 'A payment reference is required.',
    };
    return NextResponse.json({ error: messages[result.reason] }, { status, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json({ request: result.request, created: result.created }, { headers: NO_STORE_HEADERS });
}

// Lists ONLY the current session's own requests — never accepts a userId
// query parameter or any other client-supplied identity (Phase 11).
export async function GET() {
  const user = getCurrentUser();
  const db = getDb();
  const requests = getPaymentRequestsForUser(db, user.id);
  return NextResponse.json({ requests }, { headers: NO_STORE_HEADERS });
}
