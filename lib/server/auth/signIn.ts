// Sign-in completion (auth/session redesign, Phase 2): the single place that
// turns "this email address was just proven" into "this browser is now signed
// in to that account". Shared by the 6-digit code flow and the magic-link
// fallback.
//
// SIGN IN = SWITCH THIS BROWSER TO THE VERIFIED ACCOUNT. It never refuses
// because the browser already had its own anonymous identity (the old
// "this device has its own separate session" dead end). Instead:
//
//   email has no account yet
//     - browser's anonymous identity may be claimed -> that identity BECOMES
//       the account (email attached; every record already on it stays put)
//     - otherwise -> a new account row is created
//   email already has an account
//     - browser's anonymous identity may be claimed -> its claimable records
//       move into the account (lib/server/auth/claim.ts, audited)
//     - otherwise -> nothing moves; the browser simply switches
//   the browser is signed in to a DIFFERENT email account
//     - never merged; the browser simply switches
//
// "May be claimed" (`claimAllowed`) is decided by the caller and means the
// SAME browser both started and completed this sign-in (the anonymous id
// captured when the code/link was requested equals the one presenting it
// now). That stops a link/code started elsewhere — e.g. a link an attacker
// mailed to themselves and tricked someone into opening — from pulling the
// opener's anonymous purchases into the attacker's account.
//
// A brand-new session token is always issued (never the pre-login one), so a
// token planted before sign-in can never become an authenticated session
// (session fixation). Must run inside the caller's transaction.
import type { Db } from '../db';
import { findUsersByEmail, issueSession } from '../identity';
import { catchUpPriorClaims, claimAnonymousIdentity, type ClaimSummary } from './claim';
import { retiredLegacyHash } from '../sessions';
import { randomUUID } from 'node:crypto';

export type SignInResult =
  | { ok: true; userId: string; sessionToken: string; createdAccount: boolean; claim: ClaimSummary | null }
  | { ok: false; reason: 'duplicate-account' };

export async function completeEmailSignIn(
  tx: Db,
  input: {
    normalizedEmail: string;
    /** The users.id behind the session cookie presented right now, if any. */
    browserUserId: string | null;
    claimAllowed: boolean;
    method: 'email-code' | 'magic-link';
  },
): Promise<SignInResult> {
  const matches = await findUsersByEmail(tx, input.normalizedEmail);
  // Legacy data could hold two rows with the same email; never guess which.
  if (matches.length > 1) return { ok: false, reason: 'duplicate-account' };

  const browser = input.browserUserId
    ? await tx.queryOne<{ id: string; email: string | null }>('SELECT id, email FROM users WHERE id = ?', [input.browserUserId])
    : null;
  const claimableAnonymous = browser && browser.email === null && input.claimAllowed ? browser : null;

  let accountId: string;
  let createdAccount = false;
  let claim: ClaimSummary | null = null;

  if (matches.length === 0) {
    if (claimableAnonymous) {
      // The anonymous identity simply becomes the account: same users.id, so
      // every entitlement/request/preview already on it stays exactly where it is.
      await tx.execute('UPDATE users SET email = ? WHERE id = ? AND email IS NULL', [input.normalizedEmail, claimableAnonymous.id]);
      accountId = claimableAnonymous.id;
    } else {
      const now = new Date().toISOString();
      accountId = randomUUID();
      await tx.execute('INSERT INTO users (id, session_token_hash, email, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?)', [
        accountId,
        retiredLegacyHash(),
        input.normalizedEmail,
        now,
        now,
      ]);
      createdAccount = true;
    }
  } else {
    accountId = matches[0].id;
    if (claimableAnonymous && claimableAnonymous.id !== accountId) {
      claim = await claimAnonymousIdentity(tx, claimableAnonymous.id, accountId, input.method);
    }
  }

  await catchUpPriorClaims(tx, accountId);

  const sessionToken = await issueSession(tx, accountId, 'email');

  return { ok: true, userId: accountId, sessionToken, createdAccount, claim };
}
