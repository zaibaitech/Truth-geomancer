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
  constructor() {
    super('PAYSTACK_SECRET_KEY is not configured.');
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

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new PaystackConfigError();
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
  metadata: { userId: string; productId: string };
}): Promise<InitializeResult> {
  return call<InitializeResult>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: params.email,
      amount: String(params.amountMinor),
      currency: params.currency,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
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
  metadata?: { userId?: string; productId?: string } | null;
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
