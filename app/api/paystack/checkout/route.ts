// POST /api/paystack/checkout — start a Paystack hosted checkout for one
// product, as an automated alternative to the manual payment-request +
// author-approval flow (app/api/payment-requests/route.ts). Both exist
// side by side; this one simply skips the review step because Paystack's
// own server-to-server verification (lib/server/paystackFulfilment.ts)
// stands in for it.
//
// The request carries a productId and the buyer's details (first/last name,
// email, phone), never an amount or a user id — the price is read
// server-side from lib/server/paystackCatalogue.ts and the user comes from
// the session, so the most a tampered request can do is name a different
// product (still only one with a real, author-set price) and be charged
// that product's real price, for which it gets that product and nothing else.
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/session';
import { getDb } from '@/lib/server/db';
import { getProductAccessStatus } from '@/lib/server/purchaseStatus';
import { paystackPriceFor, formatPrice } from '@/lib/server/paystackCatalogue';
import { validateCustomerDetails } from '@/lib/purchase/customer';
import {
  findOpenPayment,
  markInitFailed,
  markPending,
  recordInitiating,
  saveCustomerProfile,
} from '@/lib/server/paystackPayments';
import { syncCustomer, initializeTransaction, newReference, PaystackApiError, PaystackConfigError } from '@/lib/server/paystack';
import { PRODUCT_CATALOGUE } from '@/lib/access/products';

/** A checkout this recent and still open is reused by a repeat click. */
const OPEN_CHECKOUT_MAX_AGE_MS = 15 * 60 * 1000;

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
  const input = body as Record<string, unknown>;
  const { productId } = input;
  if (typeof productId !== 'string') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: NO_STORE_HEADERS });
  }
  // Any `amount`/`price`/`userId` in the body is simply never read.
  const details = validateCustomerDetails(input);
  if (!details.ok) {
    return NextResponse.json(
      { error: 'Please check your details.', fieldErrors: details.errors },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }
  const customer = details.value;

  const product = PRODUCT_CATALOGUE.find((p) => p.id === productId && p.active);
  const price = paystackPriceFor(productId);
  if (!product || !price) {
    return NextResponse.json({ error: 'That product is not available for online payment.' }, { status: 404, headers: NO_STORE_HEADERS });
  }

  // getCurrentUser() (not getCurrentUserIfPresent()) on purpose, matching
  // POST /api/payment-requests's own precedent: starting a real checkout is
  // exactly the kind of action Prompt 46's session-cookie design expects to
  // create an anonymous identity for, if one doesn't exist yet.
  const user = await getCurrentUser();
  const db = getDb();

  // Don't take money for something this account already owns.
  const status = await getProductAccessStatus(db, user.id, productId);
  if (status === 'active') {
    return NextResponse.json({ alreadyOwned: true }, { headers: NO_STORE_HEADERS });
  }

  let origin: string;
  try {
    origin = resolveAppOrigin(request);
  } catch {
    return NextResponse.json({ error: 'Online payment is temporarily unavailable.' }, { status: 503, headers: NO_STORE_HEADERS });
  }

  // A double-click (or a reload) must not start a second Paystack
  // transaction: resume the checkout already open for this user + product.
  const open = await findOpenPayment(db, user.id, productId, OPEN_CHECKOUT_MAX_AGE_MS);
  if (open?.authorizationUrl) {
    return NextResponse.json(
      { authorizationUrl: open.authorizationUrl, reference: open.reference, price: formatPrice(price), resumed: true },
      { headers: NO_STORE_HEADERS },
    );
  }
  if (open) {
    return NextResponse.json({ error: 'Your payment is already starting. Please wait a moment.' }, { status: 409, headers: NO_STORE_HEADERS });
  }

  await saveCustomerProfile(db, user.id, customer);

  // Best effort: put the name/phone on Paystack's customer record too. A
  // failure here never blocks checkout — customer_profiles already has them.
  await syncCustomer(customer).catch((err) => {
    console.error('Paystack customer sync failed:', err instanceof Error ? err.message : 'unknown error');
  });

  const reference = newReference(productId);
  await recordInitiating(db, {
    reference,
    userId: user.id,
    productId,
    amountMinor: price.minor,
    currency: price.currency,
    customerEmail: customer.email,
  });

  try {
    const init = await initializeTransaction({
      email: customer.email,
      amountMinor: price.minor,
      currency: price.currency,
      reference,
      callbackUrl: `${origin}/api/paystack/callback`,
      customer: { firstName: customer.firstName, lastName: customer.lastName, phone: customer.phone },
      metadata: { userId: user.id, productId, entitlement: productId },
    });
    await markPending(db, reference, init.authorization_url);
    return NextResponse.json(
      { authorizationUrl: init.authorization_url, reference, price: formatPrice(price) },
      { headers: NO_STORE_HEADERS },
    );
  } catch (err) {
    await markInitFailed(db, reference).catch(() => {});
    // Log only a reference and a message — never the key, never customer details.
    if (err instanceof PaystackConfigError) {
      console.error(`Paystack checkout: configuration problem — ${err.message}`);
    } else if (err instanceof PaystackApiError) {
      console.error(`Paystack initialize failed for ${reference}:`, err.message);
    } else {
      console.error(`Paystack checkout failed for ${reference}:`, err instanceof Error ? err.message : 'unknown error');
    }
    return NextResponse.json({ error: 'Could not start secure payment. Please try again.' }, { status: 502, headers: NO_STORE_HEADERS });
  }
}
