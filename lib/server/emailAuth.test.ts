// Tests for the Prompt 46 persistent (email-verified) identity foundation.
// Real ':memory:' SQLite database per test, mirroring adminAuth.test.ts's
// and paymentRequests.test.ts's own established pattern — never a mock of
// the crypto or the database transaction itself, since those ARE the
// security-relevant logic.
import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from './db';
import { attachEmailToUser, createAnonymousUser, getUserByToken } from './identity';
import { grantEntitlement } from './entitlements';
import { createPaymentRequest } from './paymentRequests';
import { consumePreviewUse } from './previews';
import {
  consumeLoginToken,
  createLoginToken,
  generateLoginToken,
  normalizeEmail,
  resolveUserForVerifiedEmail,
} from './emailAuth';

let db: Db;
afterEach(async () => {
  try {
    await db?.close();
  } catch {
    // Not open for a test that never called openDatabase(); nothing to clean up.
  }
});

async function countRows(target: Db, table: string): Promise<number> {
  const [{ count }] = await target.query<{ count: number }>(`SELECT count(*) as count FROM ${table}`);
  return count;
}

describe('A: token generation', () => {
  it('produces distinct, high-entropy (256-bit base64url) tokens', () => {
    const a = generateLoginToken();
    const b = generateLoginToken();
    expect(a).not.toBe(b);
    // base64url-encoded 32 bytes is 43 chars (no padding).
    expect(a.length).toBe(43);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('B: token hashing', () => {
  it('the stored token_hash never equals the raw token, and the raw token itself cannot be used as if it were a pre-hashed value', async () => {
    db = openDatabase(':memory:');
    const raw = await createLoginToken(db, 'person@example.com', null);
    const row = await db.queryOne<{ token_hash: string }>('SELECT token_hash FROM email_login_tokens WHERE email = ?', [
      'person@example.com',
    ]);
    expect(row).not.toBeNull();
    expect(row!.token_hash).not.toBe(raw);
    expect(row!.token_hash).toBe(createHash('sha256').update(raw).digest('hex'));
  });
});

describe('C: token expiration', () => {
  it('an expired token is rejected even though it is otherwise valid and unused', async () => {
    db = openDatabase(':memory:');
    const raw = await createLoginToken(db, 'person@example.com', null);
    // Backdate expires_at directly — the same technique
    // adminAuth.test.ts uses to simulate a stale session, since
    // createLoginToken() itself always computes a real ~15-minute future
    // expiry.
    await db.execute("UPDATE email_login_tokens SET expires_at = '2000-01-01T00:00:00.000Z' WHERE email = ?", [
      'person@example.com',
    ]);
    const result = await consumeLoginToken(db, raw);
    expect(result).toEqual({ ok: false, reason: 'expired' });
  });
});

describe('D: token single-use', () => {
  it('a second consume attempt with the same raw token is rejected as used', async () => {
    db = openDatabase(':memory:');
    const raw = await createLoginToken(db, 'person@example.com', null);
    const first = await consumeLoginToken(db, raw);
    expect(first.ok).toBe(true);
    const second = await consumeLoginToken(db, raw);
    expect(second).toEqual({ ok: false, reason: 'used' });
  });

  it('an unknown token is rejected as not-found', async () => {
    db = openDatabase(':memory:');
    const result = await consumeLoginToken(db, generateLoginToken());
    expect(result).toEqual({ ok: false, reason: 'not-found' });
  });
});

describe('E: concurrent token consumption', () => {
  it('two simultaneous consume attempts for the same token never both succeed', async () => {
    db = openDatabase(':memory:');
    const raw = await createLoginToken(db, 'person@example.com', null);
    const [a, b] = await Promise.all([consumeLoginToken(db, raw), consumeLoginToken(db, raw)]);
    const successes = [a, b].filter((r) => r.ok);
    const usedOrNotFound = [a, b].filter((r) => !r.ok);
    expect(successes).toHaveLength(1);
    expect(usedOrNotFound).toHaveLength(1);
  });
});

describe('F: email normalization', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Person@Example.COM  ')).toBe('person@example.com');
  });

  it('rejects empty/whitespace-only input', () => {
    expect(normalizeEmail('')).toBeNull();
    expect(normalizeEmail('   ')).toBeNull();
  });

  it('rejects obviously invalid shapes', () => {
    expect(normalizeEmail('not-an-email')).toBeNull();
    expect(normalizeEmail('missing-domain@')).toBeNull();
    expect(normalizeEmail('@missing-local.com')).toBeNull();
    expect(normalizeEmail('no-at-sign.example.com')).toBeNull();
  });

  it('never performs provider-specific rewriting — no Gmail dot-removal, no plus-address stripping', () => {
    expect(normalizeEmail('First.Last@example.com')).toBe('first.last@example.com');
    expect(normalizeEmail('person+tag@example.com')).toBe('person+tag@example.com');
  });
});

describe('H: no raw token stored', () => {
  it('the raw token substring never appears in any column of its own row', async () => {
    db = openDatabase(':memory:');
    const raw = await createLoginToken(db, 'person@example.com', null);
    const row = await db.queryOne<Record<string, unknown>>('SELECT * FROM email_login_tokens WHERE email = ?', [
      'person@example.com',
    ]);
    expect(row).not.toBeNull();
    for (const value of Object.values(row!)) {
      if (typeof value === 'string') expect(value).not.toContain(raw);
    }
  });
});

describe('I: existing anonymous user can claim an unused email', () => {
  it('the SAME users.id is used — no new user row is created', async () => {
    db = openDatabase(':memory:');
    const anon = await createAnonymousUser(db, generateLoginToken());
    const raw = await createLoginToken(db, 'claim@example.com', anon.id);
    const result = await consumeLoginToken(db, raw);
    expect(result).toEqual({ ok: true, userId: anon.id, sessionToken: expect.any(String) });

    const row = await db.queryOne<{ email: string | null }>('SELECT email FROM users WHERE id = ?', [anon.id]);
    expect(row?.email).toBe('claim@example.com');
  });
});

describe('J/K: existing account login resolves the existing users.id, never creating a duplicate', () => {
  it('a second login request/verify for the same email (from a device with no anonymous identity) resolves to the SAME id', async () => {
    db = openDatabase(':memory:');
    const anon = await createAnonymousUser(db, generateLoginToken());
    const firstRaw = await createLoginToken(db, 'returning@example.com', anon.id);
    const firstResult = await consumeLoginToken(db, firstRaw);
    expect(firstResult.ok).toBe(true);
    if (!firstResult.ok) return;

    const [{ count: beforeCount }] = await db.query<{ count: number }>('SELECT count(*) as count FROM users');

    // A different device, with no existing anonymous identity of its own,
    // logs in with the same already-verified email.
    const secondRaw = await createLoginToken(db, 'returning@example.com', null);
    const secondResult = await consumeLoginToken(db, secondRaw);

    expect(secondResult).toEqual({ ok: true, userId: anon.id, sessionToken: expect.any(String) });
    expect(secondResult.ok && secondResult.sessionToken).not.toBe(firstResult.ok && firstResult.sessionToken);

    const [{ count: afterCount }] = await db.query<{ count: number }>('SELECT count(*) as count FROM users');
    expect(afterCount).toBe(beforeCount);
  });
});

describe('L/M/N: entitlements, payment_requests, and preview_usage remain attached to the original users.id through a claim', () => {
  it('all three record types survive a claim under the SAME id', async () => {
    db = openDatabase(':memory:');
    const anon = await createAnonymousUser(db, generateLoginToken());

    await grantEntitlement(db, anon.id, 'kanzul-mikban', 'manual-payment');
    await createPaymentRequest(db, anon.id, 'master-of-geomancy-vol-1', 'TXN-TEST-1');
    await consumePreviewUse(db, anon.id, {
      id: 'test-preview',
      target: { kind: 'method', bookId: 'kanzul-mikban', methodId: 'own-house-in-life-method-1' },
      maxUses: 3,
      active: true,
    });

    const raw = await createLoginToken(db, 'claim2@example.com', anon.id);
    const result = await consumeLoginToken(db, raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.userId).toBe(anon.id);

    const entitlements = await db.query('SELECT * FROM entitlements WHERE user_id = ?', [anon.id]);
    const paymentRequests = await db.query('SELECT * FROM payment_requests WHERE user_id = ?', [anon.id]);
    const previewUsage = await db.query('SELECT * FROM preview_usage WHERE user_id = ?', [anon.id]);
    expect(entitlements).toHaveLength(1);
    expect(paymentRequests).toHaveLength(1);
    expect(previewUsage).toHaveLength(1);
  });
});

describe('O: conflicting duplicate email rows produce an explicit conflict, never an automatic pick', () => {
  it('resolveUserForVerifiedEmail reports conflict for two existing rows sharing an email', async () => {
    db = openDatabase(':memory:');
    const userA = await createAnonymousUser(db, generateLoginToken());
    const userB = await createAnonymousUser(db, generateLoginToken());
    // Simulate pre-existing legacy duplicate data (see the Prompt 44/45
    // audit trail) — never how a normal claim flow would produce this,
    // since attachEmailToUser only ever targets one row and the resolve
    // step refuses to attach when the target's email would collide.
    await db.execute('UPDATE users SET email = ? WHERE id = ?', ['dup@example.com', userA.id]);
    await db.execute('UPDATE users SET email = ? WHERE id = ?', ['dup@example.com', userB.id]);

    const resolved = await resolveUserForVerifiedEmail(db, 'dup@example.com');
    expect(resolved).toEqual({ kind: 'conflict', count: 2 });
  });

  it('consumeLoginToken refuses to authenticate — and neither deletes a row, nor transfers an entitlement, nor transfers payment history — when the email is a conflict', async () => {
    db = openDatabase(':memory:');
    const userA = await createAnonymousUser(db, generateLoginToken());
    const userB = await createAnonymousUser(db, generateLoginToken());
    await db.execute('UPDATE users SET email = ? WHERE id = ?', ['dup2@example.com', userA.id]);
    await db.execute('UPDATE users SET email = ? WHERE id = ?', ['dup2@example.com', userB.id]);

    // Seed real records for BOTH duplicate accounts so "nothing is
    // transferred" is a meaningful assertion, not vacuously true on empty
    // tables.
    await grantEntitlement(db, userA.id, 'kanzul-mikban', 'manual-payment');
    await grantEntitlement(db, userB.id, 'master-of-geomancy-vol-1', 'manual-payment');
    await createPaymentRequest(db, userA.id, 'master-of-geomancy-vol-1', 'TXN-DUPA');
    await createPaymentRequest(db, userB.id, 'kanzul-mikban', 'TXN-DUPB');

    const beforeUsers = await db.query('SELECT * FROM users ORDER BY id');
    const beforeEntitlements = await db.query('SELECT * FROM entitlements ORDER BY id');
    const beforePaymentRequests = await db.query('SELECT * FROM payment_requests ORDER BY id');

    const raw = await createLoginToken(db, 'dup2@example.com', null);
    const result = await consumeLoginToken(db, raw);
    expect(result).toEqual({ ok: false, reason: 'conflict' });

    const afterUsers = await db.query('SELECT * FROM users ORDER BY id');
    const afterEntitlements = await db.query('SELECT * FROM entitlements ORDER BY id');
    const afterPaymentRequests = await db.query('SELECT * FROM payment_requests ORDER BY id');
    expect(afterUsers).toEqual(beforeUsers);
    expect(afterEntitlements).toEqual(beforeEntitlements);
    expect(afterPaymentRequests).toEqual(beforePaymentRequests);
  });
});

// ---------------------------------------------------------------------------
// Prompt 48 — closes the test gaps Prompt 47's security audit identified.
// ---------------------------------------------------------------------------

describe('Scenario D (Prompt 47 HIGH finding): anonymous user A attempts to claim an email that already belongs to existing user B', () => {
  it('is refused as an explicit conflict — A and B are both left completely unchanged, no row is created, and no record is transferred', async () => {
    db = openDatabase(':memory:');

    // B already owns the email, via a real prior claim (attachEmailToUser
    // — the same path a genuine first login takes), not a raw UPDATE.
    const userB = await createAnonymousUser(db, generateLoginToken());
    await attachEmailToUser(db, userB.id, 'shared@example.com');
    await grantEntitlement(db, userB.id, 'kanzul-mikban', 'manual-payment');
    await createPaymentRequest(db, userB.id, 'kanzul-mikban', 'TXN-B-OWNS-THIS');
    await consumePreviewUse(db, userB.id, {
      id: 'preview-b',
      target: { kind: 'method', bookId: 'kanzul-mikban', methodId: 'own-house-in-life-method-1' },
      maxUses: 3,
      active: true,
    });

    // A is a genuinely separate, unrelated anonymous user with its own
    // records, who requests a link for B's email — e.g. a typo, or an
    // attempt to see what happens. Its own real anonymous session token
    // is kept so we can prove afterward that A's own session survives
    // untouched.
    const anonTokenA = generateLoginToken();
    const userA = await createAnonymousUser(db, anonTokenA);
    await grantEntitlement(db, userA.id, 'master-of-geomancy-vol-1', 'manual-payment');
    await createPaymentRequest(db, userA.id, 'master-of-geomancy-vol-1', 'TXN-A-OWNS-THIS');
    await consumePreviewUse(db, userA.id, {
      id: 'preview-a',
      target: { kind: 'method', bookId: 'kanzul-mikban', methodId: 'own-house-in-life-method-1' },
      maxUses: 3,
      active: true,
    });

    const beforeUserA = await db.queryOne('SELECT * FROM users WHERE id = ?', [userA.id]);
    const beforeUserB = await db.queryOne('SELECT * FROM users WHERE id = ?', [userB.id]);
    const beforeUserCount = await countRows(db, 'users');
    const beforeEntitlements = await db.query('SELECT * FROM entitlements ORDER BY id');
    const beforePaymentRequests = await db.query('SELECT * FROM payment_requests ORDER BY id');
    const beforePreviewUsage = await db.query('SELECT * FROM preview_usage ORDER BY user_id, preview_id');

    // A requests a magic link for B's already-owned email — the request
    // captures A's current anonymous id as the claim target, exactly as
    // the real request-link route does via getCurrentUserIfPresent().
    const raw = await createLoginToken(db, 'shared@example.com', userA.id);
    const result = await consumeLoginToken(db, raw);

    expect(result).toEqual({ ok: false, reason: 'conflict' });

    // A is unchanged: still no email, same session_token_hash (no
    // rotation happened for A — the conflict is detected and returned
    // BEFORE rotateSessionToken is ever called).
    const afterUserA = await db.queryOne('SELECT * FROM users WHERE id = ?', [userA.id]);
    expect(afterUserA).toEqual(beforeUserA);
    expect((afterUserA as { email: string | null }).email).toBeNull();

    // B is unchanged: still owns the email, same session_token_hash (no
    // session was ever authenticated as B by this attempt).
    const afterUserB = await db.queryOne('SELECT * FROM users WHERE id = ?', [userB.id]);
    expect(afterUserB).toEqual(beforeUserB);
    expect((afterUserB as { email: string | null }).email).toBe('shared@example.com');

    // No third users row was created.
    expect(await countRows(db, 'users')).toBe(beforeUserCount);

    // Every entitlement/payment_request/preview_usage row, for BOTH
    // accounts, is byte-for-byte unchanged — nothing was transferred,
    // copied, or touched.
    expect(await db.query('SELECT * FROM entitlements ORDER BY id')).toEqual(beforeEntitlements);
    expect(await db.query('SELECT * FROM payment_requests ORDER BY id')).toEqual(beforePaymentRequests);
    expect(await db.query('SELECT * FROM preview_usage ORDER BY user_id, preview_id')).toEqual(beforePreviewUsage);

    // A's original anonymous session token still resolves to A — proving
    // A's own session was never disturbed by the rejected attempt.
    const stillA = await getUserByToken(db, anonTokenA);
    expect(stillA?.id).toBe(userA.id);

    // Token reuse after a conflict (Prompt 48 §6): the SAME token cannot
    // be consumed again to try for a different outcome. The
    // implementation marks used_at before branching into the
    // conflict/already-linked/success decision (see consumeLoginToken's
    // own comment), so a second attempt is rejected as already `used` —
    // this is the existing, intentional, secure behavior: a conflict
    // result still permanently spends the token, closing off any retry
    // that might race a since-resolved conflict into a different outcome.
    const secondAttempt = await consumeLoginToken(db, raw);
    expect(secondAttempt).toEqual({ ok: false, reason: 'used' });
  });
});

describe('already-linked (Prompt 47 MEDIUM finding): the current claim identity already has a DIFFERENT verified email', () => {
  it('is refused with the existing "already-linked" reason — the original email stays attached, the new one is never attached anywhere, and no record changes', async () => {
    db = openDatabase(':memory:');

    const userA = await createAnonymousUser(db, generateLoginToken());
    await attachEmailToUser(db, userA.id, 'first@example.com');
    await grantEntitlement(db, userA.id, 'kanzul-mikban', 'manual-payment');
    await createPaymentRequest(db, userA.id, 'kanzul-mikban', 'TXN-FIRST-EMAIL');

    const beforeUsers = await db.query('SELECT * FROM users ORDER BY id');
    const beforeEntitlements = await db.query('SELECT * FROM entitlements ORDER BY id');
    const beforePaymentRequests = await db.query('SELECT * FROM payment_requests ORDER BY id');
    const beforeUserCount = await countRows(db, 'users');

    // A different token, requested from the SAME already-linked
    // anonymous session, for a DIFFERENT email.
    const raw = await createLoginToken(db, 'second@example.com', userA.id);
    const result = await consumeLoginToken(db, raw);

    expect(result).toEqual({ ok: false, reason: 'already-linked' });

    const afterUserA = await db.queryOne<{ email: string | null }>('SELECT * FROM users WHERE id = ?', [userA.id]);
    expect(afterUserA?.email).toBe('first@example.com');

    // second@example.com was never attached to A, or created as anyone
    // else's account.
    const secondEmailOwners = await db.query('SELECT id FROM users WHERE email = ?', ['second@example.com']);
    expect(secondEmailOwners).toEqual([]);

    expect(await countRows(db, 'users')).toBe(beforeUserCount);
    expect(await db.query('SELECT * FROM users ORDER BY id')).toEqual(beforeUsers);
    expect(await db.query('SELECT * FROM entitlements ORDER BY id')).toEqual(beforeEntitlements);
    expect(await db.query('SELECT * FROM payment_requests ORDER BY id')).toEqual(beforePaymentRequests);
  });
});

describe('case-insensitive identity (Prompt 47 MEDIUM finding): different-cased input for the same mailbox never becomes two identities', () => {
  it('a login for "User@Example.com" and a later login for "user@example.com" resolve to the SAME users.id, using the real end-to-end functions — not normalizeEmail() alone', async () => {
    db = openDatabase(':memory:');

    // Exactly what the real request-link route does: normalize first,
    // then pass the normalized value into createLoginToken.
    const normalized1 = normalizeEmail('User@Example.com');
    expect(normalized1).toBe('user@example.com');
    const raw1 = await createLoginToken(db, normalized1!, null);
    const result1 = await consumeLoginToken(db, raw1);
    expect(result1.ok).toBe(true);
    if (!result1.ok) return;
    const originalUserId = result1.userId;

    const [{ count: countAfterFirst }] = await db.query<{ count: number }>('SELECT count(*) as count FROM users');

    // A second, later login — different device, no anonymous identity —
    // using a differently-cased (but same mailbox) input.
    const normalized2 = normalizeEmail('user@example.com');
    expect(normalized2).toBe('user@example.com');
    expect(normalized2).toBe(normalized1); // same mailbox, same normalized identity
    const raw2 = await createLoginToken(db, normalized2!, null);
    const result2 = await consumeLoginToken(db, raw2);

    expect(result2).toEqual({ ok: true, userId: originalUserId, sessionToken: expect.any(String) });

    const [{ count: countAfterSecond }] = await db.query<{ count: number }>('SELECT count(*) as count FROM users');
    expect(countAfterSecond).toBe(countAfterFirst); // no second/duplicate identity was created
  });
});
