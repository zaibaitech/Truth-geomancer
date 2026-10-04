// Paystack REST client and webhook signature verification (automated card
// payment — see lib/server/paystackCatalogue.ts for what this module is
// allowed to charge, and app/api/paystack/* for the two routes that use it).
//
// This exists ALONGSIDE the manual payment-request + author-approval
// workflow (lib/server/paymentRequests.ts), not instead of it — a buyer who
// can't or doesn't want to pay by card still has that path. The only thing
// this module is trusted to do differently is skip the admin review step,
// and only because Paystack's own verification stands in for it: see
// fulfilCheckout()'s re-verification against /transaction/verify, which
// never trusts a webhook payload's own amount or status.
//
// Server-only: PAYSTACK_SECRET_KEY must never reach a client bundle. Every
// value is read through process.env directly, matching this codebase's own
// existing pattern (see app/api/auth/request-link/route.ts's
// resolveAppOrigin) rather than introducing a separate env-wrapper module.
import { createHmac, timingSafeEqual } from 'node:crypto';

const API = 'https://api.paystack.co';

export class PaystackConfigError extends Error {
  constructor(message = 'PAYSTACK_SECRET_KEY is not configured.') {
    super(message);
    this.name = 'PaystackConfigError';
  }
}

export class PaystackApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'PaystackApiError';
  }
}

export type PaystackMode = 'test' | 'live';

/** Which Paystack environment PAYSTACK_SECRET_KEY belongs to. Switching to
 * live is purely a matter of putting an sk_live_ key in the environment. */
export function paystackMode(key: string | undefined): PaystackMode | null {
  if (key?.startsWith('sk_test_')) return 'test';
  if (key?.startsWith('sk_live_')) return 'live';
  return null;
}

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new PaystackConfigError();
  // Test/live must never be mixed by accident: a key that is neither is
  // rejected, and a live key outside production (a laptop, a Codespace, CI)
  // is refused so a developer can never take real money from a dev build.
  const mode = paystackMode(key);
  if (!mode) throw new PaystackConfigError('PAYSTACK_SECRET_KEY must start with sk_test_ or sk_live_.');
  if (mode === 'live' && process.env.NODE_ENV !== 'production') {
    throw new PaystackConfigError('A live Paystack key is only accepted when NODE_ENV=production.');
  }
  return key;
}

interface Envelope<T> {
  status?: boolean;
  message?: string;
  data?: T;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  });

  const text = await res.text();
  let body: Envelope<T> | null = null;
  try {
    body = JSON.parse(text) as Envelope<T>;
  } catch {
    throw new PaystackApiError(`Paystack returned non-JSON (HTTP ${res.status}): ${text.slice(0, 200)}`, res.status);
  }

  // Paystack signals failure two ways — a non-2xx status, and a 200 carrying
  // `status: false`. Both are errors here; treating only the first as one is
  // a classic way to record a payment that never happened.
  if (!res.ok || body?.status !== true) {
    throw new PaystackApiError(body?.message || `Paystack request failed (HTTP ${res.status})`, res.status);
  }

  return body.data as T;
}

export interface InitializeResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

/**
 * Create a hosted checkout and get the URL to send the buyer to.
 *
 * `metadata.userId`/`metadata.productId` are what fulfilCheckout() reads
 * back after a verified payment — never trust the webhook delivery's own
 * copy of this, always re-read it from Paystack's own verify response (see
 * fulfilCheckout below), which is the authoritative record of what this
 * specific transaction actually was.
 */
export function initializeTransaction(params: {
  email: string;
  amountMinor: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  customer: { firstName: string; lastName: string; phone: string };
  metadata: { userId: string; productId: string; entitlement: string };
}): Promise<InitializeResult> {
  // No `channels` on purpose: Paystack Checkout offers every method enabled
  // for the account/transaction (card, mobile money, bank transfer, ...).
  return call<InitializeResult>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: params.email,
      amount: String(params.amountMinor),
      currency: params.currency,
      reference: params.reference,
      callback_url: params.callbackUrl,
      first_name: params.customer.firstName,
      last_name: params.customer.lastName,
      phone: params.customer.phone,
      metadata: {
        ...params.metadata,
        // Also kept on the transaction itself, independent of the customer record.
        custom_fields: [
          { display_name: 'Customer', variable_name: 'customer_name', value: `${params.customer.firstName} ${params.customer.lastName}` },
          { display_name: 'Phone', variable_name: 'customer_phone', value: params.customer.phone },
        ],
      },
    }),
  });
}

interface PaystackCustomer {
  customer_code: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

/**
 * Make Paystack's own customer record (keyed by email) carry the buyer's
 * name and phone, so the Paystack dashboard and receipts show them.
 *
 * Why this exists: /transaction/initialize silently ignores first_name /
 * last_name / phone — the transaction's `customer` stays null for them
 * (confirmed against the live test API). A transaction takes its customer
 * from the record for its email, so the record is set up first. POST
 * /customer on an email that already exists returns the existing record
 * unchanged, hence the follow-up update when the details differ.
 *
 * Best effort and never a gate: Truth Geomancer's own customer_profiles is
 * the source of truth, and checkout must not depend on this succeeding.
 */
export async function syncCustomer(c: { email: string; firstName: string; lastName: string; phone: string }): Promise<void> {
  const created = await call<PaystackCustomer>('/customer', {
    method: 'POST',
    body: JSON.stringify({ email: c.email, first_name: c.firstName, last_name: c.lastName, phone: c.phone }),
  });
  if (created.first_name === c.firstName && created.last_name === c.lastName && created.phone === c.phone) return;
  await call<PaystackCustomer>(`/customer/${encodeURIComponent(created.customer_code)}`, {
    method: 'PUT',
    body: JSON.stringify({ first_name: c.firstName, last_name: c.lastName, phone: c.phone }),
  });
}

export interface VerifiedTransaction {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at: string | null;
  customer: { email: string };
  metadata?: { userId?: string; productId?: string; entitlement?: string } | null;
}

/** Ask Paystack what actually happened to a reference — the authority on
 * whether a payment succeeded. Both the webhook and the callback route call
 * this rather than trusting their own inputs (a webhook body an attacker
 * could forge without a valid signature check; a redirect query string the
 * buyer's own browser controls). */
export function verifyTransaction(reference: string): Promise<VerifiedTransaction> {
  return call<VerifiedTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

/**
 * Verify the `x-paystack-signature` header on a webhook delivery.
 *
 * Must be given the exact raw request body: HMAC over a re-serialised
 * object will not match, because key order and whitespace differ. The
 * comparison is timing-safe, and a wrong-length signature is rejected
 * before comparing rather than throwing out of timingSafeEqual.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;

  const expected = createHmac('sha512', secretKey()).update(rawBody, 'utf8').digest('hex');

  const given = Buffer.from(signature, 'utf8');
  const want = Buffer.from(expected, 'utf8');
  if (given.length !== want.length) return false;

  return timingSafeEqual(given, want);
}

/** A fresh purchase reference — random enough not to be guessable, and
 * namespaced so it's recognisable in the Paystack dashboard. */
export function newReference(productId: string): string {
  const slug = productId.replace(/[^a-z0-9]+/gi, '-').slice(0, 24);
  const random = crypto.randomUUID().replace(/-/g, '');
  return `tg_${slug}_${random}`;
}
