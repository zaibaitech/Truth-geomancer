// POST /api/paystack/webhook — Paystack's server-to-server delivery.
//
// This is the reliable fulfilment path: it fires whether or not the buyer's
// browser ever returns to the site. The callback route
// (app/api/paystack/callback/route.ts) is the fast path for the browser
// that IS still there; both call the same idempotent fulfilCheckout(), so
// whichever lands first wins and the other is a no-op.
//
// The signature is checked against the RAW body before anything is parsed,
// which is why this route is safe to leave genuinely public.
import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/server/paystack';
import { fulfilCheckout } from '@/lib/server/paystackFulfilment';
import { getDb } from '@/lib/server/db';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

/** Events worth acting on. Anything else is acknowledged and ignored, so
 * enabling extra events in the Paystack dashboard can't break this route. */
const HANDLED = new Set(['charge.success']);

export async function POST(request: Request) {
  // request.text(), not request.json(): the HMAC is over the exact bytes
  // Paystack sent. Re-serialising a parsed object changes key order and
  // whitespace, and the signature would never match.
  const raw = await request.text();

  if (!verifyWebhookSignature(raw, request.headers.get('x-paystack-signature'))) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401, headers: NO_STORE_HEADERS });
  }

  let payload: { event?: string; data?: { reference?: string } };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Malformed payload.' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const event = payload.event ?? 'unknown';
  const reference = payload.data?.reference;

  if (!HANDLED.has(event) || !reference) {
    // 200 on purpose: this was a validly-signed delivery for an event this
    // route has nothing to do with. A non-2xx here would put Paystack into
    // a retry loop over an event that will never be acted on.
    return NextResponse.json({ ignored: event }, { headers: NO_STORE_HEADERS });
  }

  try {
    const result = await fulfilCheckout(getDb(), reference);
    if (result.outcome === 'mismatch') {
      // Signed by Paystack, but the transaction doesn't match what it
      // claims. Loud in the log, 200 to Paystack — retrying changes nothing.
      console.error(`Paystack webhook ${reference}: ${result.detail}`);
    }
    return NextResponse.json({ outcome: result.outcome }, { headers: NO_STORE_HEADERS });
  } catch (err) {
    // 500 so Paystack retries. fulfilCheckout() and the entitlement-granting
    // function it wraps are both idempotent, so a retry after a transient
    // failure here is always safe.
    console.error(`Paystack webhook ${reference} failed:`, err);
    return NextResponse.json({ error: 'Temporary failure.' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
