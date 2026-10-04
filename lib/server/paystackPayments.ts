// Persistence for checkout customer details and the record of every Paystack
// transaction this server starts (tables from migration 0005). Fulfilment
// reads this to check a verified transaction against what WE asked Paystack
// to charge; it is a ledger, never itself a grant of access — only
// grantEntitlement() does that.
import type { Db } from './db';
import type { CustomerDetails } from '@/lib/purchase/customer';

export type PaymentStatus = 'initiating' | 'pending' | 'success' | 'failed' | 'abandoned';

export interface PaystackPayment {
  reference: string;
  userId: string;
  productId: string;
  amountMinor: number;
  currency: string;
  customerEmail: string;
  status: PaymentStatus;
  authorizationUrl: string | null;
  createdAt: string;
}

interface PaymentRow {
  reference: string;
  user_id: string;
  product_id: string;
  amount_minor: number;
  currency: string;
  customer_email: string;
  status: PaymentStatus;
  authorization_url: string | null;
  created_at: string;
}

function toPayment(r: PaymentRow): PaystackPayment {
  return {
    reference: r.reference,
    userId: r.user_id,
    productId: r.product_id,
    amountMinor: Number(r.amount_minor),
    currency: r.currency,
    customerEmail: r.customer_email,
    status: r.status,
    authorizationUrl: r.authorization_url,
    createdAt: r.created_at,
  };
}

export async function getCustomerProfile(
  db: Db,
  userId: string,
): Promise<Pick<CustomerDetails, 'firstName' | 'lastName' | 'phone'> | null> {
  const row = await db.queryOne<{ first_name: string; last_name: string; phone: string }>(
    'SELECT first_name, last_name, phone FROM customer_profiles WHERE user_id = ?',
    [userId],
  );
  return row ? { firstName: row.first_name, lastName: row.last_name, phone: row.phone } : null;
}

export async function saveCustomerProfile(db: Db, userId: string, d: CustomerDetails): Promise<void> {
  await db.execute(
    `INSERT INTO customer_profiles (user_id, first_name, last_name, phone, updated_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET first_name = excluded.first_name, last_name = excluded.last_name,
       phone = excluded.phone, updated_at = excluded.updated_at`,
    [userId, d.firstName, d.lastName, d.phone, new Date().toISOString()],
  );
}

export async function getPayment(db: Db, reference: string): Promise<PaystackPayment | null> {
  const row = await db.queryOne<PaymentRow>('SELECT * FROM paystack_payments WHERE reference = ?', [reference]);
  return row ? toPayment(row) : null;
}

/** A still-open checkout this user started recently for this product, if any.
 * Pressing the pay button twice (or reloading) reuses it rather than creating
 * a second Paystack transaction. */
export async function findOpenPayment(
  db: Db,
  userId: string,
  productId: string,
  maxAgeMs: number,
  now: number = Date.now(),
): Promise<PaystackPayment | null> {
  const since = new Date(now - maxAgeMs).toISOString();
  const row = await db.queryOne<PaymentRow>(
    `SELECT * FROM paystack_payments WHERE user_id = ? AND product_id = ? AND status IN ('initiating', 'pending')
     AND created_at >= ? ORDER BY created_at DESC LIMIT 1`,
    [userId, productId, since],
  );
  return row ? toPayment(row) : null;
}

export async function recordInitiating(
  db: Db,
  p: { reference: string; userId: string; productId: string; amountMinor: number; currency: string; customerEmail: string },
): Promise<void> {
  await db.execute(
    `INSERT INTO paystack_payments (reference, user_id, product_id, amount_minor, currency, customer_email, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'initiating', ?)`,
    [p.reference, p.userId, p.productId, p.amountMinor, p.currency, p.customerEmail, new Date().toISOString()],
  );
}

export async function markPending(db: Db, reference: string, authorizationUrl: string): Promise<void> {
  await db.execute("UPDATE paystack_payments SET status = 'pending', authorization_url = ? WHERE reference = ? AND status = 'initiating'", [
    authorizationUrl,
    reference,
  ]);
}

/** Initialization never reached Paystack's checkout — nothing for the buyer to resume. */
export async function markInitFailed(db: Db, reference: string): Promise<void> {
  await db.execute("UPDATE paystack_payments SET status = 'failed' WHERE reference = ? AND status = 'initiating'", [reference]);
}
