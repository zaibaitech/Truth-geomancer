import { NextResponse } from 'next/server';
import { isCurrentUserAdmin } from '@/lib/server/adminSession';
import { getDb } from '@/lib/server/db';
import { listPaymentRequestsForAdmin } from '@/lib/server/paymentRequests';
import type { PaymentRequestStatus } from '@/lib/access/types';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };
const VALID_STATUSES: PaymentRequestStatus[] = ['pending', 'approved', 'rejected'];

// Prompt 28, Phase 11: admin listing requires the server-authoritative
// admin check (isCurrentUserAdmin) — never inferred from any client-
// supplied value. Returns ALL users' requests, which is exactly what an
// admin (and only an admin) is authorized to see.
export async function GET(request: Request) {
  if (!isCurrentUserAdmin()) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403, headers: NO_STORE_HEADERS });
  }

  const statusParam = new URL(request.url).searchParams.get('status');
  if (statusParam !== null && !VALID_STATUSES.includes(statusParam as PaymentRequestStatus)) {
    return NextResponse.json({ error: 'Invalid status filter.' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const db = getDb();
  const requests = listPaymentRequestsForAdmin(db, statusParam as PaymentRequestStatus | undefined);
  return NextResponse.json({ requests }, { headers: NO_STORE_HEADERS });
}
