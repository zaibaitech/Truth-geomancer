// Regression tests for defects found in the final pre-commit review of the
// auth/session redesign:
//   1. A legacy cookie migrated by a CONCURRENT request between this request's
//      own lookup and its legacy fallback must still resolve — never fall
//      through to "no session", which would hand the browser a brand-new
//      anonymous identity and strand the old one's records.
//   2. The late-payment catch-up (run on every account-status check) must be
//      a cheap no-op when nothing can move, and must never write an audit row
//      for a claim that moved nothing.
import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from './db';
import { attachEmailToUser, createAnonymousUser, generateSessionToken, getOrCreateUser } from './identity';
import { listActiveSessions, resolveSession } from './sessions';
import { catchUpPriorClaims, claimAnonymousIdentity } from './auth/claim';
import { grantEntitlement } from './entitlements';
import { consumeSignInCode, createSignInCode } from './auth/emailCodes';
import { completeEmailSignIn } from './auth/signIn';
import { createPaymentRequest } from './paymentRequests';

let db: Db | undefined;
afterEach(async () => {
  const handle = db;
  db = undefined;
  if (handle) await handle.close();
});

/** Wraps a Db so a callback can run just BEFORE a matching statement — used
 * to interleave a "concurrent request" deterministically — and records every
 * statement executed. */
function instrument(inner: Db, before?: { match: RegExp; run: () => Promise<void> }) {
  const statements: string[] = [];
  let fired = false;
  const hook = async (sql: string) => {
    statements.push(sql);
    if (before && !fired && before.match.test(sql)) {
      fired = true;
      await before.run();
    }
  };
  const wrap = (target: Db): Db => ({
    async query(sql, params) {
      await hook(sql);
      return target.query(sql, params);
    },
    async queryOne(sql, params) {
      await hook(sql);
      return target.queryOne(sql, params);
    },
    async execute(sql, params) {
      await hook(sql);
      return target.execute(sql, params);
    },
    transaction(fn) {
      return target.transaction((tx) => fn(wrap(tx)));
    },
    close: () => target.close(),
  });
  return { db: wrap(inner), statements };
}

async function legacyUser(d: Db, email: string | null) {
  const token = generateSessionToken();
  const id = `legacy-${Math.random().toString(36).slice(2)}`;
  const now = new Date().toISOString();
  await d.execute('INSERT INTO users (id, session_token_hash, email, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?)', [
    id,
    createHash('sha256').update(token).digest('hex'),
    email,
    now,
    now,
  ]);
  return { id, token };
}

describe('legacy migration race: another request migrates the cookie mid-resolution', () => {
  it('commit lands between the lookup and the "does a sessions row exist" check', async () => {
    db = openDatabase(':memory:');
    const real = db;
    const { id, token } = await legacyUser(real, null);
    const { db: racing } = instrument(real, {
      match: /^SELECT id FROM sessions WHERE token_hash = \?$/,
      run: async () => {
        await resolveSession(real, token); // the other request completes the migration
      },
    });
    const resolved = await resolveSession(racing, token);
    expect(resolved?.user.id).toBe(id);
  });

  it('commit lands between the existence check and the legacy-user read', async () => {
    db = openDatabase(':memory:');
    const real = db;
    const { id, token } = await legacyUser(real, null);
    const { db: racing } = instrument(real, {
      match: /FROM users WHERE session_token_hash = \?/,
      run: async () => {
        await resolveSession(real, token);
      },
    });
    const resolved = await resolveSession(racing, token);
    expect(resolved?.user.id).toBe(id);
  });

  it('end to end: the racing request keeps the SAME anonymous identity (no new user, no stranded records)', async () => {
    db = openDatabase(':memory:');
    const real = db;
    const { id, token } = await legacyUser(real, null);
    await grantEntitlement(real, id, 'kanzul-mikban', 'paystack');
    const { db: racing } = instrument(real, {
      match: /^SELECT id FROM sessions WHERE token_hash = \?$/,
      run: async () => {
        await resolveSession(real, token);
      },
    });
    const result = await getOrCreateUser(racing, token);
    expect(result.isNew).toBe(false);
    expect(result.user.id).toBe(id);
    expect(await real.query('SELECT id FROM users')).toHaveLength(1);
    expect(await listActiveSessions(real, id)).toHaveLength(1);
  });

  it('a revoked migrated session still never authenticates through the race path', async () => {
    db = openDatabase(':memory:');
    const real = db;
    const { token } = await legacyUser(real, null);
    await resolveSession(real, token);
    await real.execute('UPDATE sessions SET revoked_at = ?', [new Date().toISOString()]);
    expect(await resolveSession(real, token)).toBeNull();
  });
});

describe('late-payment catch-up stays cheap and idempotent on every status check', () => {
  async function account(d: Db, email: string): Promise<string> {
    const u = await createAnonymousUser(d, generateSessionToken());
    await attachEmailToUser(d, u.id, email);
    return u.id;
  }

  it('a leftover duplicate the account already owns does not re-run the claim on every check', async () => {
    db = openDatabase(':memory:');
    const real = db;
    const acct = await account(real, 'owner@example.com');
    const anon = await createAnonymousUser(real, generateSessionToken());
    await grantEntitlement(real, anon.id, 'kanzul-mikban', 'paystack');
    await real.transaction((tx) => claimAnonymousIdentity(tx, anon.id, acct, 'email-code'));
    // A redelivered webhook re-grants to the anonymous id after the claim.
    await grantEntitlement(real, anon.id, 'kanzul-mikban', 'paystack');
    await real.transaction((tx) => catchUpPriorClaims(tx, acct)); // settles it (left in place)

    const { db: watched, statements } = instrument(real);
    for (let i = 0; i < 5; i++) await watched.transaction((tx) => catchUpPriorClaims(tx, acct));
    expect(statements.filter((s) => /^\s*(UPDATE|INSERT)/i.test(s))).toEqual([]);
    expect(await real.query("SELECT id FROM entitlements WHERE user_id = ? AND status = 'active'", [acct])).toHaveLength(1);
  });

  it('an unresolved pending-request conflict never adds an audit row per status check', async () => {
    db = openDatabase(':memory:');
    const real = db;
    const acct = await account(real, 'pending@example.com');
    const anon = await createAnonymousUser(real, generateSessionToken());
    await createPaymentRequest(real, acct, 'kanzul-mikban', 'REF-ACCOUNT');
    await createPaymentRequest(real, anon.id, 'kanzul-mikban', 'REF-ANON');
    await real.transaction((tx) => claimAnonymousIdentity(tx, anon.id, acct, 'email-code'));
    const before = (await real.query('SELECT id FROM identity_claims')).length;
    expect(before).toBe(1); // the original claim, recording the conflict for review

    for (let i = 0; i < 5; i++) await real.transaction((tx) => catchUpPriorClaims(tx, acct));
    expect(await real.query('SELECT id FROM identity_claims')).toHaveLength(before);
    // The conflicting request is still preserved on the anonymous id.
    expect(await real.query('SELECT id FROM payment_requests WHERE user_id = ?', [anon.id])).toHaveLength(1);
  });

  it('a genuinely late Paystack entitlement is still picked up, exactly once', async () => {
    db = openDatabase(':memory:');
    const real = db;
    const acct = await account(real, 'late@example.com');
    const anon = await createAnonymousUser(real, generateSessionToken());
    await real.transaction((tx) => claimAnonymousIdentity(tx, anon.id, acct, 'email-code'));
    await grantEntitlement(real, anon.id, 'master-of-geomancy-vol-1', 'paystack');

    expect(await real.transaction((tx) => catchUpPriorClaims(tx, acct))).toBe(1);
    expect(await real.transaction((tx) => catchUpPriorClaims(tx, acct))).toBe(0);
    expect(
      await real.query("SELECT id FROM entitlements WHERE user_id = ? AND product_id = 'master-of-geomancy-vol-1' AND status = 'active'", [acct]),
    ).toHaveLength(1);
    expect(await real.query('SELECT id FROM identity_claims')).toHaveLength(2); // original + one catch-up
  });

  it('an account with no prior claims costs one read', async () => {
    db = openDatabase(':memory:');
    const real = db;
    const acct = await account(real, 'plain@example.com');
    const { db: watched, statements } = instrument(real);
    await watched.transaction((tx) => catchUpPriorClaims(tx, acct));
    expect(statements).toHaveLength(1);
  });
});

describe('claim security: browser B cannot finish browser A\'s sign-in and take its records', () => {
  it('A (anonymous) starts, B (anonymous) finishes with the code: nothing of A or B is claimed', async () => {
    db = openDatabase(':memory:');
    const real = db;
    const existing = await createAnonymousUser(real, generateSessionToken());
    await attachEmailToUser(real, existing.id, 'victim-or-owner@example.com');
    const browserA = await createAnonymousUser(real, generateSessionToken());
    const browserB = await createAnonymousUser(real, generateSessionToken());
    await grantEntitlement(real, browserA.id, 'kanzul-mikban', 'paystack');
    await grantEntitlement(real, browserB.id, 'master-of-geomancy-vol-1', 'paystack');

    // Browser A requests the code (the start route records A as the claimant).
    const code = await createSignInCode(real, 'victim-or-owner@example.com', browserA.id);

    // Browser B presents it — exactly what app/api/auth/verify-code does.
    const outcome = await real.transaction(async (tx) => {
      const verified = await consumeSignInCode(tx, 'victim-or-owner@example.com', code);
      if (!verified.ok) throw new Error('code should verify');
      return completeEmailSignIn(tx, {
        normalizedEmail: 'victim-or-owner@example.com',
        browserUserId: browserB.id,
        claimAllowed: verified.claimUserId === browserB.id,
        method: 'email-code',
      });
    });
    expect(outcome.ok && outcome.claim).toBeNull();
    expect(await real.query('SELECT id FROM identity_claims')).toHaveLength(0);
    expect((await real.queryOne<{ user_id: string }>("SELECT user_id FROM entitlements WHERE product_id = 'kanzul-mikban'"))?.user_id).toBe(
      browserA.id,
    );
    expect(
      (await real.queryOne<{ user_id: string }>("SELECT user_id FROM entitlements WHERE product_id = 'master-of-geomancy-vol-1'"))?.user_id,
    ).toBe(browserB.id);
    expect(await real.query('SELECT id FROM entitlements WHERE user_id = ?', [existing.id])).toHaveLength(0);
  });
});
