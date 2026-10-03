// POST /api/paystack/checkout — start a Paystack hosted checkout for one
// product, as an automated alternative to the manual payment-request +
// author-approval flow (app/api/payment-requests/route.ts). Both exist
// side by side; this one simply skips the review step because Paystack's
// own server-to-server verification (lib/server/paystackFulfilment.ts)
// stands in for it.
//
// The request carries a productId and an email, never an amount — the
// price is read server-side from lib/server/paystackCatalogue.ts, so the
// most a tampered request can do is name a different product (still only
// one with a real, author-set price) and be charged that product's real
// price.
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/session';
import { getDb } from '@/lib/server/db';
import { getProductAccessStatus } from '@/lib/server/purchaseStatus';
import { paystackPriceFor, formatPrice } from '@/lib/server/paystackCatalogue';
import { initializeTransaction, newReference, PaystackApiError, PaystackConfigError } from '@/lib/server/paystack';
import { PRODUCT_CATALOGUE } from '@/lib/access/products';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

/** Same derivation as app/api/auth/request-link/route.ts's own
 * resolveAppOrigin — kept as a small local copy rather than extracting a
 * shared helper, so this addition touches no existing file beyond the two
 * narrowly-scoped, additive changes documented in its own commit. Never
 * derived from the request's Host header in production (client-supplied,
 * spoofable); APP_BASE_URL is the trusted, operator-configured origin. */
function resolveAppOrigin(request: Request): string {
  const configured = process.env.APP_BASE_URL;
  if (configured) return configured.replace(/\/+$/, '');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('APP_BASE_URL is not configured for production Paystack checkout.');
  }
  return new URL(request.url).origin;
}

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
  const { productId, email } = body as Record<string, unknown>;
  if (typeof productId !== 'string' || typeof email !== 'string') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: NO_STORE_HEADERS });
  }
  // Deliberately permissive — real deliverability is proven by Paystack's
  // own checkout page accepting it, not by a regex here.
  if (!email.includes('@') || email.length > 254) {
    return NextResponse.json({ error: 'That email address does not look right.' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const product = PRODUCT_CATALOGUE.find((p) => p.id === productId && p.active);
  const price = paystackPriceFor(productId);
  if (!product || !price) {
    return NextResponse.json({ error: 'That product is not available for card payment.' }, { status: 404, headers: NO_STORE_HEADERS });
  }

  // getCurrentUser() (not getCurrentUserIfPresent()) on purpose, matching
  // POST /api/payment-requests's own precedent: starting a real checkout is
  // exactly the kind of action Prompt 46's session-cookie design expects to
  // create an anonymous identity for, if one doesn't exist yet.
  const user = await getCurrentUser();
  const db = getDb();

  // Don't take money for something this address already owns.
  const status = await getProductAccessStatus(db, user.id, productId);
  if (status === 'active') {
    return NextResponse.json({ alreadyOwned: true }, { headers: NO_STORE_HEADERS });
  }

  let origin: string;
  try {
    origin = resolveAppOrigin(request);
  } catch {
    return NextResponse.json({ error: 'Card payment is temporarily unavailable.' }, { status: 503, headers: NO_STORE_HEADERS });
  }

  const reference = newReference(productId);

  try {
    const init = await initializeTransaction({
      email,
      amountMinor: price.minor,
      currency: price.currency,
      reference,
      callbackUrl: `${origin}/api/paystack/callback`,
      metadata: { userId: user.id, productId },
    });
    return NextResponse.json(
      { authorizationUrl: init.authorization_url, reference, price: formatPrice(price) },
      { headers: NO_STORE_HEADERS },
    );
  } catch (err) {
    if (err instanceof PaystackConfigError) {
      console.error('Paystack checkout: PAYSTACK_SECRET_KEY is not configured.');
    } else if (err instanceof PaystackApiError) {
      console.error(`Paystack initialize failed for ${reference}:`, err.message);
    } else {
      console.error(`Paystack checkout failed for ${reference}:`, err);
    }
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 502, headers: NO_STORE_HEADERS });
  }
}
