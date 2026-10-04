// GET /api/paystack/callback — where Paystack returns the buyer's browser
// after payment.
//
// Nothing here trusts the URL it was reached by: the query string names a
// reference, and fulfilCheckout() re-verifies it against Paystack's API
// before anything is granted — a hand-typed or replayed reference changes
// nothing, since fulfilment only ever acts on what Paystack itself reports.
import { NextResponse } from 'next/server';
import { fulfilCheckout } from '@/lib/server/paystackFulfilment';
import { getDb } from '@/lib/server/db';
import { getPayment } from '@/lib/server/paystackPayments';

function resolveAppOrigin(request: Request): string {
  const configured = process.env.APP_BASE_URL;
  if (configured) return configured.replace(/\/+$/, '');
  return new URL(request.url).origin;
}

/** Where the buyer lands: always the product's own page, which reads live
 * entitlement state — `payment` only picks the wording, it never unlocks
 * anything (the page shows "activated" only if the entitlement exists). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  // Paystack sends both `trxref` and `reference`, historically with the
  // same value. Either is accepted so a change in which one is populated
  // can't break the return journey.
  const reference = url.searchParams.get('reference') || url.searchParams.get('trxref') || '';
  const origin = resolveAppOrigin(request);

  if (!reference) {
    return NextResponse.redirect(`${origin}/purchase`, { status: 303 });
  }

  const db = getDb();
  let productId: string | null = null;
  let payment: 'success' | 'cancelled' | 'failed' | 'pending' = 'pending';
  try {
    productId = (await getPayment(db, reference))?.productId ?? null;
    const result = await fulfilCheckout(db, reference);
    if (result.outcome === 'granted') {
      payment = 'success';
    } else if (result.outcome === 'not-paid') {
      payment = result.status === 'abandoned' ? 'cancelled' : result.status === 'failed' ? 'failed' : 'pending';
    } else if (result.outcome === 'mismatch') {
      payment = 'failed';
    }
  } catch (err) {
    // Don't fail the redirect: the webhook is the reliable path and will
    // still land. The product page reads live entitlement state, so it
    // will correctly show "being verified" rather than crash.
    console.error(`Paystack callback fulfilment failed for ${reference}:`, err instanceof Error ? err.message : 'unknown error');
  }

  if (!productId) return NextResponse.redirect(`${origin}/purchase`, { status: 303 });
  return NextResponse.redirect(`${origin}/purchase/${encodeURIComponent(productId)}?payment=${payment}`, { status: 303 });
}
