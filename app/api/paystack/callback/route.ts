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

function resolveAppOrigin(request: Request): string {
  const configured = process.env.APP_BASE_URL;
  if (configured) return configured.replace(/\/+$/, '');
  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  // Paystack sends both `trxref` and `reference`, historically with the
  // same value. Either is accepted so a change in which one is populated
  // can't break the return journey.
  const reference = url.searchParams.get('reference') || url.searchParams.get('trxref') || '';
  const origin = resolveAppOrigin(request);

  if (!reference) {
    return NextResponse.redirect(`${origin}/books`, { status: 303 });
  }

  let productId: string | null = null;
  try {
    const result = await fulfilCheckout(getDb(), reference);
    if (result.outcome === 'granted') productId = result.productId;
  } catch (err) {
    // Don't fail the redirect: the webhook is the reliable path and will
    // still land. The product page reads live entitlement state, so it
    // will correctly show "not yet" rather than crash.
    console.error(`Paystack callback fulfilment failed for ${reference}:`, err);
  }

  const destination = productId ? `${origin}/purchase/${productId}` : `${origin}/books`;
  return NextResponse.redirect(`${destination}?paystack_reference=${encodeURIComponent(reference)}`, { status: 303 });
}
