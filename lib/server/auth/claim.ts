// Audited anonymous-identity claim (auth/session redesign, Phase 2).
//
// Ordinary use of the app (a reading, a practice, a preview, a payment
// request, a Paystack checkout) runs under an ANONYMOUS users row tied to the
// browser's session cookie. When that browser then proves ownership of an
// email whose account already exists, the browser is switched to that
// account, and whatever the anonymous identity owns is claimed into it HERE —
// one transactional, deterministic, audited operation — instead of the old
// "this device has its own separate session" refusal.
//
// WHAT IS CLAIMED (decided from the schema and the access/payment code, not
// assumed):
//
//   CLAIMABLE
//   - entitlements            moved to the account; an ACTIVE entitlement for
//                             a product the account already actively owns is
//                             left in place (never duplicated). Revoked rows
//                             move as history.
//   - payment_requests        moved (history + pending manual requests, whose
//                             later admin approval then grants to the account);
//                             a PENDING request for a product the account
//                             already has a pending request for is left in
//                             place and reported for review.
//   - preview_usage           moved; if the account already has a row for the
//                             same preview, the account row takes the higher
//                             usage (a preview spent anonymously stays spent).
//   - customer_profiles       moved only when the account has none (the
//                             account's own details are never overwritten).
//
//   NOT CLAIMABLE (left exactly where they are)
//   - paystack_payments       Paystack fulfilment verifies
//                             transaction.metadata.userId === the row's user_id
//                             (lib/server/paystackFulfilment.ts). Moving a row
//                             would make an in-flight payment fail verification,
//                             so none is ever moved. A completed one already
//                             produced an entitlement, which IS claimed. An
//                             in-flight one is reported for review; when it
//                             completes, its entitlement lands on the anonymous
//                             id and is picked up by catchUpPriorClaims() at the
//                             account's next sign-in / account check.
//   - email_login_tokens, email_verification_codes  transient auth records.
//   - users                   the anonymous row is never deleted; its sessions
//                             are revoked (it is retired, not destroyed).
//
// Every claim writes one identity_claims row (who -> whom, how, and a JSON
// summary of exactly what moved, what stayed and what needs review).
import { randomUUID } from 'node:crypto';
import type { Db } from '../db';

export interface ClaimSummary {
  moved: {
    entitlements: number;
    paymentRequests: number;
    previewUsage: number;
    customerProfile: number;
  };
  merged: { previewUsage: number };
  leftInPlace: {
    entitlementsAlreadyOwned: number;
    customerProfile: number;
    paystackPayments: number;
  };
  review: {
    pendingPaymentRequestConflicts: number;
    inFlightPaystackPayments: number;
  };
}

function emptySummary(): ClaimSummary {
  return {
    moved: { entitlements: 0, paymentRequests: 0, previewUsage: 0, customerProfile: 0 },
    merged: { previewUsage: 0 },
    leftInPlace: { entitlementsAlreadyOwned: 0, customerProfile: 0, paystackPayments: 0 },
    review: { pendingPaymentRequestConflicts: 0, inFlightPaystackPayments: 0 },
  };
}

/** True when the claim actually moved or merged a record. Review-only items
 * (a pending-request conflict, an in-flight payment) are recorded by the
 * first claim; repeating them on later catch-ups would add an audit row on
 * every account-status check for as long as they stay unresolved. */
function changedAnything(s: ClaimSummary): boolean {
  return s.moved.entitlements + s.moved.paymentRequests + s.moved.previewUsage + s.moved.customerProfile + s.merged.previewUsage > 0;
}

export class ClaimRefusedError extends Error {
  constructor(reason: string) {
    super(`identity claim refused: ${reason}`);
    this.name = 'ClaimRefusedError';
  }
}

/** Moves the claimable records of `anonymousUserId` into `accountUserId`.
 * MUST be called inside the caller's transaction (`tx`) so the claim and the
 * sign-in it belongs to commit or roll back together. Refuses (throws) unless
 * the source is a genuinely anonymous identity (no email) and the destination
 * is a different, email-verified account — two authenticated accounts are
 * never merged. */
export async function claimAnonymousIdentity(
  tx: Db,
  anonymousUserId: string,
  accountUserId: string,
  method: 'email-code' | 'magic-link' | 'catch-up',
): Promise<ClaimSummary> {
  if (anonymousUserId === accountUserId) throw new ClaimRefusedError('source and destination are the same user');
  const [source] = await tx.query<{ id: string; email: string | null }>('SELECT id, email FROM users WHERE id = ?', [anonymousUserId]);
  const [dest] = await tx.query<{ id: string; email: string | null }>('SELECT id, email FROM users WHERE id = ?', [accountUserId]);
  if (!source || !dest) throw new ClaimRefusedError('unknown user');
  if (source.email !== null) throw new ClaimRefusedError('source is an authenticated account, not an anonymous identity');
  if (dest.email === null) throw new ClaimRefusedError('destination is not a verified account');

  const s = emptySummary();

  // --- entitlements -------------------------------------------------------
  const ents = await tx.query<{ id: string; product_id: string; status: string }>(
    'SELECT id, product_id, status FROM entitlements WHERE user_id = ?',
    [anonymousUserId],
  );
  for (const e of ents) {
    if (e.status === 'active') {
      const owned = await tx.queryOne<{ id: string }>(
        "SELECT id FROM entitlements WHERE user_id = ? AND product_id = ? AND status = 'active'",
        [accountUserId, e.product_id],
      );
      if (owned) {
        s.leftInPlace.entitlementsAlreadyOwned += 1;
        continue;
      }
    }
    await tx.execute('UPDATE entitlements SET user_id = ? WHERE id = ? AND user_id = ?', [accountUserId, e.id, anonymousUserId]);
    s.moved.entitlements += 1;
  }

  // --- manual payment requests -------------------------------------------
  const reqs = await tx.query<{ id: string; product_id: string; status: string }>(
    'SELECT id, product_id, status FROM payment_requests WHERE user_id = ?',
    [anonymousUserId],
  );
  for (const r of reqs) {
    if (r.status === 'pending') {
      const accountPending = await tx.queryOne<{ id: string }>(
        "SELECT id FROM payment_requests WHERE user_id = ? AND product_id = ? AND status = 'pending'",
        [accountUserId, r.product_id],
      );
      if (accountPending) {
        s.review.pendingPaymentRequestConflicts += 1;
        continue;
      }
    }
    await tx.execute('UPDATE payment_requests SET user_id = ? WHERE id = ? AND user_id = ?', [accountUserId, r.id, anonymousUserId]);
    s.moved.paymentRequests += 1;
  }

  // --- preview usage --------------------------------------------------------
  const previews = await tx.query<{ preview_id: string; uses_consumed: number; status: string }>(
    'SELECT preview_id, uses_consumed, status FROM preview_usage WHERE user_id = ?',
    [anonymousUserId],
  );
  for (const p of previews) {
    const existing = await tx.queryOne<{ uses_consumed: number; status: string }>(
      'SELECT uses_consumed, status FROM preview_usage WHERE user_id = ? AND preview_id = ?',
      [accountUserId, p.preview_id],
    );
    if (!existing) {
      await tx.execute('UPDATE preview_usage SET user_id = ? WHERE user_id = ? AND preview_id = ?', [
        accountUserId,
        anonymousUserId,
        p.preview_id,
      ]);
      s.moved.previewUsage += 1;
    } else {
      const uses = Math.max(Number(existing.uses_consumed), Number(p.uses_consumed));
      const status = existing.status === 'exhausted' || p.status === 'exhausted' ? 'exhausted' : 'available';
      if (uses !== Number(existing.uses_consumed) || status !== existing.status) {
        await tx.execute('UPDATE preview_usage SET uses_consumed = ?, status = ? WHERE user_id = ? AND preview_id = ?', [
          uses,
          status,
          accountUserId,
          p.preview_id,
        ]);
        s.merged.previewUsage += 1;
      }
    }
  }

  // --- customer profile ------------------------------------------------------
  const profile = await tx.queryOne<{ user_id: string }>('SELECT user_id FROM customer_profiles WHERE user_id = ?', [anonymousUserId]);
  if (profile) {
    const accountProfile = await tx.queryOne<{ user_id: string }>('SELECT user_id FROM customer_profiles WHERE user_id = ?', [
      accountUserId,
    ]);
    if (accountProfile) {
      s.leftInPlace.customerProfile += 1;
    } else {
      await tx.execute('UPDATE customer_profiles SET user_id = ? WHERE user_id = ?', [accountUserId, anonymousUserId]);
      s.moved.customerProfile += 1;
    }
  }

  // --- Paystack payments: never moved (see header) ---------------------------
  const payments = await tx.query<{ status: string }>('SELECT status FROM paystack_payments WHERE user_id = ?', [anonymousUserId]);
  s.leftInPlace.paystackPayments = payments.length;
  s.review.inFlightPaystackPayments = payments.filter((p) => p.status === 'initiating' || p.status === 'pending').length;

  // --- retire the anonymous identity's sessions -----------------------------
  await tx.execute('UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL', [
    new Date().toISOString(),
    anonymousUserId,
  ]);

  // --- audit -------------------------------------------------------------------
  const alreadyRecorded = await tx.queryOne<{ id: string }>(
    'SELECT id FROM identity_claims WHERE anonymous_user_id = ? AND account_user_id = ?',
    [anonymousUserId, accountUserId],
  );
  if (!alreadyRecorded || changedAnything(s)) {
    await tx.execute(
      'INSERT INTO identity_claims (id, anonymous_user_id, account_user_id, method, claimed_at, summary) VALUES (?, ?, ?, ?, ?, ?)',
      [randomUUID(), anonymousUserId, accountUserId, method, new Date().toISOString(), JSON.stringify(s)],
    );
  }
  return s;
}

/** Re-runs the claim for every anonymous identity previously claimed into
 * this account, so an entitlement that a Paystack payment (left on the
 * anonymous id, by design) granted AFTER the original claim still reaches
 * the account. Writes an audit row only when something actually moved.
 * Call inside a transaction. */
export async function catchUpPriorClaims(tx: Db, accountUserId: string): Promise<number> {
  const prior = await tx.query<{ anonymous_user_id: string }>(
    'SELECT DISTINCT anonymous_user_id FROM identity_claims WHERE account_user_id = ?',
    [accountUserId],
  );
  let moved = 0;
  for (const { anonymous_user_id } of prior) {
    // Only rows the claim would actually MOVE. Rows it deliberately leaves in
    // place (an active entitlement the account already owns, a pending
    // request that conflicts with the account's own) must not trigger a full
    // re-claim on every status check for as long as they exist.
    const pending = await tx.queryOne<{ n: number }>(
      `SELECT COUNT(*) AS n FROM (
         SELECT e.id FROM entitlements e
          WHERE e.user_id = ?
            AND NOT (e.status = 'active' AND EXISTS (
              SELECT 1 FROM entitlements a WHERE a.user_id = ? AND a.product_id = e.product_id AND a.status = 'active'))
         UNION ALL
         SELECT r.id FROM payment_requests r
          WHERE r.user_id = ?
            AND NOT (r.status = 'pending' AND EXISTS (
              SELECT 1 FROM payment_requests p WHERE p.user_id = ? AND p.product_id = r.product_id AND p.status = 'pending'))
       ) t`,
      [anonymous_user_id, accountUserId, anonymous_user_id, accountUserId],
    );
    if (!pending || Number(pending.n) === 0) continue;
    const s = await claimAnonymousIdentity(tx, anonymous_user_id, accountUserId, 'catch-up');
    moved += s.moved.entitlements + s.moved.paymentRequests;
  }
  return moved;
}
