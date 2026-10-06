// Auth/session redesign — domain-level tests for multi-device sessions,
// server-side expiry/revocation, legacy-cookie migration, the audited
// anonymous claim, 6-digit sign-in codes, and safe post-sign-in redirects.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from './db';
import { attachEmailToUser, createAnonymousUser, generateSessionToken, getOrCreateUser, getUserByToken, issueSession } from './identity';
import {
  SESSION_ABSOLUTE_LIFETIME_MS,
  SESSION_IDLE_TIMEOUT_MS,
  SESSION_SLIDE_INTERVAL_MS,
  createSession,
  hashSessionToken,
  listActiveSessions,
  resolveSession,
  revokeSessionByToken,
} from './sessions';
import { catchUpPriorClaims, claimAnonymousIdentity, ClaimRefusedError } from './auth/claim';
import { CODE_TTL_MS, MAX_ATTEMPTS_PER_CODE, consumeSignInCode, createSignInCode, generateSignInCode } from './auth/emailCodes';
import { completeEmailSignIn } from './auth/signIn';
import { grantEntitlement } from './entitlements';
import { createPaymentRequest } from './paymentRequests';
import { consumePreviewUse } from './previews';
import { recordInitiating, saveCustomerProfile } from './paystackPayments';
import { DEFAULT_RETURN_TO, safeReturnTo, signInHref } from '@/lib/auth/returnTo';

let db: Db | undefined;
afterEach(async () => {
  const open = db;
  db = undefined;
  await open?.close();
});

async function account(email: string): Promise<string> {
  if (!db) throw new Error('no db');
  const u = await createAnonymousUser(db, generateSessionToken());
  await attachEmailToUser(db, u.id, email);
  return u.id;
}

// ---------------------------------------------------------------------------
describe('sessions: many independent devices per account', () => {
  it('signing in on device B and C never signs device A out', async () => {
    db = openDatabase(':memory:');
    const userId = await account('multi@example.com');
    const phone = await issueSession(db, userId);
    const laptop = await issueSession(db, userId);
    const tablet = await issueSession(db, userId);
    for (const t of [phone, laptop, tablet]) expect((await getUserByToken(db, t))?.id).toBe(userId);
    expect(await listActiveSessions(db, userId)).toHaveLength(4); // + the anonymous one createAnonymousUser made
  });

  it('logging out on the phone revokes ONLY the phone', async () => {
    db = openDatabase(':memory:');
    const userId = await account('logout@example.com');
    const phone = await issueSession(db, userId);
    const laptop = await issueSession(db, userId);
    const tablet = await issueSession(db, userId);
    await revokeSessionByToken(db, phone);
    expect(await getUserByToken(db, phone)).toBeNull();
    expect((await getUserByToken(db, laptop))?.id).toBe(userId);
    expect((await getUserByToken(db, tablet))?.id).toBe(userId);
  });

  it('a revoked session stays revoked: a surviving copy of the cookie is useless, and getOrCreateUser gives a NEW anonymous identity', async () => {
    db = openDatabase(':memory:');
    const userId = await account('stolen@example.com');
    const token = await issueSession(db, userId);
    await revokeSessionByToken(db, token);
    const resolved = await getOrCreateUser(db, token);
    expect(resolved.isNew).toBe(true);
    expect(resolved.user.id).not.toBe(userId);
  });

  it('only the SHA-256 of a token is stored — never the token', async () => {
    db = openDatabase(':memory:');
    const token = generateSessionToken();
    const user = await createAnonymousUser(db, token);
    const rows = await db.query<Record<string, unknown>>('SELECT * FROM sessions WHERE user_id = ?', [user.id]);
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows)).not.toContain(token);
    expect(rows[0].token_hash).toBe(hashSessionToken(token));
  });

  it('every sign-in issues a brand-new token (session fixation is impossible)', async () => {
    db = openDatabase(':memory:');
    const userId = await account('fixation@example.com');
    const a = await issueSession(db, userId);
    const b = await issueSession(db, userId);
    expect(a).not.toBe(b);
  });
});

describe('sessions: server-side expiry', () => {
  it('expires after the idle timeout, enforced by the server', async () => {
    db = openDatabase(':memory:');
    const user = await createAnonymousUser(db, generateSessionToken());
    const token = generateSessionToken();
    const t0 = Date.parse('2026-01-01T00:00:00Z');
    await createSession(db, user.id, 'email', token, t0);
    expect(await resolveSession(db, token, t0 + SESSION_IDLE_TIMEOUT_MS - 1000)).not.toBeNull();
    expect(await resolveSession(db, token, t0 + SESSION_IDLE_TIMEOUT_MS + 1000 + SESSION_IDLE_TIMEOUT_MS)).toBeNull();
  });

  it('activity slides the idle expiry, but never beyond the absolute lifetime', async () => {
    db = openDatabase(':memory:');
    const user = await createAnonymousUser(db, generateSessionToken());
    const token = generateSessionToken();
    const t0 = Date.parse('2026-01-01T00:00:00Z');
    await createSession(db, user.id, 'email', token, t0);
    // Use it every 60 days: idle never lapses ...
    let t = t0;
    while (t + 60 * 24 * 3600 * 1000 < t0 + SESSION_ABSOLUTE_LIFETIME_MS) {
      t += 60 * 24 * 3600 * 1000;
      expect(await resolveSession(db, token, t)).not.toBeNull();
    }
    // ... but the absolute lifetime still ends it.
    expect(await resolveSession(db, token, t0 + SESSION_ABSOLUTE_LIFETIME_MS + 1000)).toBeNull();
  });

  it('an ordinary request within the slide interval is not a database write', async () => {
    db = openDatabase(':memory:');
    const user = await createAnonymousUser(db, generateSessionToken());
    const token = generateSessionToken();
    const t0 = Date.parse('2026-01-01T00:00:00Z');
    await createSession(db, user.id, 'email', token, t0);
    await resolveSession(db, token, t0 + SESSION_SLIDE_INTERVAL_MS / 2);
    const row = await db.queryOne<{ last_used_at: string }>('SELECT last_used_at FROM sessions WHERE token_hash = ?', [
      hashSessionToken(token),
    ]);
    expect(row?.last_used_at).toBe(new Date(t0).toISOString());
  });
});

describe('legacy (pre-redesign) cookies keep working and are migrated once', () => {
  async function legacyUser(email: string | null) {
    const token = generateSessionToken();
    const id = `legacy-${Math.random().toString(36).slice(2)}`;
    const now = new Date().toISOString();
    await db!.execute('INSERT INTO users (id, session_token_hash, email, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?)', [
      id,
      createHash('sha256').update(token).digest('hex'),
      email,
      now,
      now,
    ]);
    return { id, token };
  }

  it('an existing tg_uid token still resolves to the same user — nobody is signed out by the migration', async () => {
    db = openDatabase(':memory:');
    const { id, token } = await legacyUser('legacy@example.com');
    expect((await getUserByToken(db, token))?.id).toBe(id);
    // Migrated into sessions; the single-token column is retired.
    expect(await listActiveSessions(db, id)).toHaveLength(1);
    const row = await db.queryOne<{ session_token_hash: string }>('SELECT session_token_hash FROM users WHERE id = ?', [id]);
    expect(row?.session_token_hash.startsWith('retired:')).toBe(true);
    // Still the same user afterwards, through the sessions row.
    expect((await getUserByToken(db, token))?.id).toBe(id);
  });

  it('two simultaneous first requests migrate it exactly once', async () => {
    db = openDatabase(':memory:');
    const { id, token } = await legacyUser(null);
    const [a, b] = await Promise.all([getUserByToken(db, token), getUserByToken(db, token)]);
    expect(a?.id).toBe(id);
    expect(b?.id).toBe(id);
    expect(await listActiveSessions(db, id)).toHaveLength(1);
  });

  it('a legacy token can be logged out (revoked) like any other', async () => {
    db = openDatabase(':memory:');
    const { token } = await legacyUser('legacy-out@example.com');
    await revokeSessionByToken(db, token);
    expect(await getUserByToken(db, token)).toBeNull();
  });

  it('migration SQL is additive: the new migration never ALTERs or DROPs an existing table', () => {
    const sql = readFileSync('lib/server/db/migrations/0006_sessions_codes_claims.sql', 'utf-8')
      .split('\n')
      .filter((l) => !l.trim().startsWith('--'))
      .join('\n');
    expect(sql).not.toMatch(/\bALTER\b|\bDROP\b|\bDELETE\b|\bUPDATE\b/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS sessions/);
  });
});

// ---------------------------------------------------------------------------
describe('anonymous -> account claim', () => {
  const PREVIEW = {
    id: 'p1',
    target: { kind: 'method' as const, bookId: 'kanzul-mikban', methodId: 'own-house-in-life-method-1' },
    maxUses: 3,
    active: true,
  };

  it('preserves paid access and never duplicates an entitlement the account already has', async () => {
    db = openDatabase(':memory:');
    const acct = await account('owner@example.com');
    await grantEntitlement(db, acct, 'kanzul-mikban', 'paystack');
    const anon = await createAnonymousUser(db, generateSessionToken());
    await grantEntitlement(db, anon.id, 'kanzul-mikban', 'paystack');
    await grantEntitlement(db, anon.id, 'master-of-geomancy-vol-1', 'paystack');

    const s = await db.transaction((tx) => claimAnonymousIdentity(tx, anon.id, acct, 'email-code'));
    expect(s.moved.entitlements).toBe(1);
    expect(s.leftInPlace.entitlementsAlreadyOwned).toBe(1);
    const active = await db.query<{ product_id: string }>(
      "SELECT product_id FROM entitlements WHERE user_id = ? AND status = 'active' ORDER BY product_id",
      [acct],
    );
    expect(active.map((r) => r.product_id)).toEqual(['kanzul-mikban', 'master-of-geomancy-vol-1']);
    // Nothing was deleted: the duplicate stays on the anonymous id.
    expect(await db.query('SELECT id FROM entitlements')).toHaveLength(3);
  });

  it('never moves a Paystack payment (fulfilment binds it to the original id); in-flight ones are reported and caught up later', async () => {
    db = openDatabase(':memory:');
    const acct = await account('payer@example.com');
    const anon = await createAnonymousUser(db, generateSessionToken());
    await recordInitiating(db, {
      reference: 'ref-1',
      userId: anon.id,
      productId: 'kanzul-mikban',
      amountMinor: 18000,
      currency: 'GHS',
      customerEmail: 'payer@example.com',
    });
    const s = await db.transaction((tx) => claimAnonymousIdentity(tx, anon.id, acct, 'email-code'));
    expect(s.review.inFlightPaystackPayments).toBe(1);
    expect((await db.queryOne<{ user_id: string }>('SELECT user_id FROM paystack_payments WHERE reference = ?', ['ref-1']))?.user_id).toBe(
      anon.id,
    );

    // The payment completes AFTER the claim: fulfilment grants to the anonymous id ...
    await grantEntitlement(db, anon.id, 'kanzul-mikban', 'paystack');
    // ... and the account's next sign-in/status check picks it up.
    await db.transaction((tx) => catchUpPriorClaims(tx, acct));
    expect(await db.query("SELECT id FROM entitlements WHERE user_id = ? AND status = 'active'", [acct])).toHaveLength(1);
  });

  it('a pending manual request conflicting with one the account already has is left for review', async () => {
    db = openDatabase(':memory:');
    const acct = await account('pending@example.com');
    const anon = await createAnonymousUser(db, generateSessionToken());
    await createPaymentRequest(db, acct, 'kanzul-mikban', 'REF-ACCT');
    await createPaymentRequest(db, anon.id, 'kanzul-mikban', 'REF-ANON');
    const s = await db.transaction((tx) => claimAnonymousIdentity(tx, anon.id, acct, 'email-code'));
    expect(s.review.pendingPaymentRequestConflicts).toBe(1);
    expect(await db.query('SELECT id FROM payment_requests WHERE user_id = ?', [anon.id])).toHaveLength(1);
  });

  it('preview usage merges to the higher count; the account\'s own customer profile is never overwritten', async () => {
    db = openDatabase(':memory:');
    const acct = await account('preview@example.com');
    const anon = await createAnonymousUser(db, generateSessionToken());
    await consumePreviewUse(db, acct, PREVIEW);
    for (let i = 0; i < 3; i++) await consumePreviewUse(db, anon.id, PREVIEW);
    await saveCustomerProfile(db, acct, { firstName: 'Acct', lastName: 'Owner', phone: '1', email: 'preview@example.com' } as never);
    await saveCustomerProfile(db, anon.id, { firstName: 'Anon', lastName: 'X', phone: '2', email: 'x@example.com' } as never);
    await db.transaction((tx) => claimAnonymousIdentity(tx, anon.id, acct, 'email-code'));
    const usage = await db.queryOne<{ uses_consumed: number; status: string }>(
      'SELECT uses_consumed, status FROM preview_usage WHERE user_id = ? AND preview_id = ?',
      [acct, 'p1'],
    );
    expect(Number(usage?.uses_consumed)).toBe(3);
    expect(usage?.status).toBe('exhausted');
    expect((await db.queryOne<{ first_name: string }>('SELECT first_name FROM customer_profiles WHERE user_id = ?', [acct]))?.first_name).toBe(
      'Acct',
    );
  });

  it('never merges two authenticated accounts, and never claims into an unverified identity', async () => {
    db = openDatabase(':memory:');
    const a = await account('a@example.com');
    const b = await account('b@example.com');
    const anon = await createAnonymousUser(db, generateSessionToken());
    await expect(db.transaction((tx) => claimAnonymousIdentity(tx, a, b, 'email-code'))).rejects.toBeInstanceOf(ClaimRefusedError);
    await expect(db.transaction((tx) => claimAnonymousIdentity(tx, anon.id, anon.id, 'email-code'))).rejects.toBeInstanceOf(
      ClaimRefusedError,
    );
    const other = await createAnonymousUser(db, generateSessionToken());
    await expect(db.transaction((tx) => claimAnonymousIdentity(tx, anon.id, other.id, 'email-code'))).rejects.toBeInstanceOf(
      ClaimRefusedError,
    );
  });

  it('is atomic: if the surrounding sign-in fails, nothing moved', async () => {
    db = openDatabase(':memory:');
    const acct = await account('atomic@example.com');
    const anon = await createAnonymousUser(db, generateSessionToken());
    await grantEntitlement(db, anon.id, 'kanzul-mikban', 'paystack');
    await expect(
      db.transaction(async (tx) => {
        await claimAnonymousIdentity(tx, anon.id, acct, 'email-code');
        throw new Error('later step failed');
      }),
    ).rejects.toThrow('later step failed');
    expect(await db.query('SELECT id FROM entitlements WHERE user_id = ?', [anon.id])).toHaveLength(1);
    expect(await db.query('SELECT id FROM identity_claims')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
describe('6-digit sign-in codes', () => {
  it('are 6 digits from a CSPRNG and never stored raw', async () => {
    db = openDatabase(':memory:');
    for (let i = 0; i < 50; i++) expect(generateSignInCode()).toMatch(/^\d{6}$/);
    const code = await createSignInCode(db, 'code@example.com', null);
    const rows = await db.query<Record<string, unknown>>('SELECT * FROM email_verification_codes');
    expect(JSON.stringify(rows)).not.toContain(`"${code}"`);
    expect(rows[0].code_hash).not.toBe(code);
  });

  it('a correct code works exactly once', async () => {
    db = openDatabase(':memory:');
    const code = await createSignInCode(db, 'once@example.com', null);
    expect((await db.transaction((tx) => consumeSignInCode(tx, 'once@example.com', code))).ok).toBe(true);
    expect((await db.transaction((tx) => consumeSignInCode(tx, 'once@example.com', code))).ok).toBe(false);
  });

  it('expires', async () => {
    db = openDatabase(':memory:');
    const t0 = Date.now();
    const code = await createSignInCode(db, 'exp@example.com', null, t0);
    expect((await db.transaction((tx) => consumeSignInCode(tx, 'exp@example.com', code, t0 + CODE_TTL_MS + 1))).ok).toBe(false);
  });

  it(`is invalidated after ${MAX_ATTEMPTS_PER_CODE} wrong guesses — even the right code then fails`, async () => {
    db = openDatabase(':memory:');
    const code = await createSignInCode(db, 'brute@example.com', null);
    const wrong = code === '000000' ? '111111' : '000000';
    for (let i = 0; i < MAX_ATTEMPTS_PER_CODE; i++) {
      expect((await db.transaction((tx) => consumeSignInCode(tx, 'brute@example.com', wrong))).ok).toBe(false);
    }
    expect((await db.transaction((tx) => consumeSignInCode(tx, 'brute@example.com', code))).ok).toBe(false);
  });

  it('a newer code supersedes an older one; unknown emails and malformed codes fail the same way', async () => {
    db = openDatabase(':memory:');
    const first = await createSignInCode(db, 'new@example.com', null);
    const second = await createSignInCode(db, 'new@example.com', null);
    if (first !== second) {
      expect(await db.transaction((tx) => consumeSignInCode(tx, 'new@example.com', first))).toEqual({ ok: false, reason: 'invalid' });
    }
    expect(await db.transaction((tx) => consumeSignInCode(tx, 'nobody@example.com', '123456'))).toEqual({ ok: false, reason: 'invalid' });
    expect(await db.transaction((tx) => consumeSignInCode(tx, 'new@example.com', '12a456'))).toEqual({ ok: false, reason: 'invalid' });
    expect((await db.transaction((tx) => consumeSignInCode(tx, 'new@example.com', second))).ok).toBe(true);
  });

  it('code sign-in from the same browser claims; from another browser it signs in without claiming', async () => {
    db = openDatabase(':memory:');
    const acct = await account('switch@example.com');
    const anon = await createAnonymousUser(db, generateSessionToken());
    await grantEntitlement(db, anon.id, 'master-of-geomancy-vol-1', 'paystack');

    const otherBrowser = await createAnonymousUser(db, generateSessionToken());
    const elsewhere = await db.transaction((tx) =>
      completeEmailSignIn(tx, { normalizedEmail: 'switch@example.com', browserUserId: otherBrowser.id, claimAllowed: false, method: 'email-code' }),
    );
    expect(elsewhere.ok && elsewhere.userId).toBe(acct);
    expect(await db.query('SELECT id FROM entitlements WHERE user_id = ?', [anon.id])).toHaveLength(1);

    const same = await db.transaction((tx) =>
      completeEmailSignIn(tx, { normalizedEmail: 'switch@example.com', browserUserId: anon.id, claimAllowed: true, method: 'email-code' }),
    );
    expect(same.ok && same.userId).toBe(acct);
    expect(await db.query('SELECT id FROM entitlements WHERE user_id = ?', [acct])).toHaveLength(1);
  });

  it('a brand-new email with a claimable anonymous browser turns that identity into the account (same users.id, nothing moves)', async () => {
    db = openDatabase(':memory:');
    const anon = await createAnonymousUser(db, generateSessionToken());
    await grantEntitlement(db, anon.id, 'kanzul-mikban', 'paystack');
    const res = await db.transaction((tx) =>
      completeEmailSignIn(tx, { normalizedEmail: 'fresh@example.com', browserUserId: anon.id, claimAllowed: true, method: 'email-code' }),
    );
    expect(res.ok && res.userId).toBe(anon.id);
    expect(res.ok && res.createdAccount).toBe(false);
  });
});

// ---------------------------------------------------------------------------
describe('safe return-to (no open redirect)', () => {
  it.each([
    ['/books/kanzul-mikban', '/books/kanzul-mikban'],
    ['/purchase/kanzul-mikban?x=1#top', '/purchase/kanzul-mikban?x=1#top'],
    ['/settings', '/settings'],
  ])('keeps the same-origin path %s', (input, out) => {
    expect(safeReturnTo(input)).toBe(out);
  });

  it.each([
    'https://evil.example/books',
    '//evil.example',
    '/\\evil.example',
    '\\\\evil.example',
    'javascript:alert(1)',
    'books',
    '/api/auth/logout',
    '/signin?returnTo=/books',
    '/auth/confirm',
    '',
    null,
    undefined,
    '/\u0000x',
    `/${'a'.repeat(600)}`,
  ])('rejects %s', (input) => {
    expect(safeReturnTo(input as string | null | undefined)).toBe(DEFAULT_RETURN_TO);
  });

  it('builds sign-in links through the same validator', () => {
    expect(signInHref('//evil.example')).toBe(`/signin?returnTo=${encodeURIComponent(DEFAULT_RETURN_TO)}`);
    expect(signInHref('/books/kanzul-mikban')).toBe('/signin?returnTo=%2Fbooks%2Fkanzul-mikban');
  });
});
