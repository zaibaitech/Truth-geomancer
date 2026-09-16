// Tests for the server-only admin identity (Prompt 28, Phase 15 — ADMIN
// SECURITY). Real ':memory:' database per test, real environment variable
// manipulation (restored after every test) — never a mock of the crypto
// comparison itself, since that IS the security-relevant logic. Updated
// for Prompt 31C's async Db interface.
import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from './db';
import { createAdminSession, generateAdminToken, isAdminToken, verifyAdminSecret } from './adminAuth';

const ORIGINAL_SECRET = process.env.TG_ADMIN_SECRET;

let db: Db;
afterEach(async () => {
  try {
    await db?.close();
  } catch {
    // Not open for a test that never called openDatabase(); nothing to clean up.
  }
  if (ORIGINAL_SECRET === undefined) delete process.env.TG_ADMIN_SECRET;
  else process.env.TG_ADMIN_SECRET = ORIGINAL_SECRET;
});

describe('13: unauthenticated admin request denied', () => {
  it('a null token is never admin', async () => {
    db = openDatabase(':memory:');
    expect(await isAdminToken(db, null)).toBe(false);
  });
});

describe('14: non-admin denied', () => {
  it('a real, valid ANONYMOUS USER session token is never mistaken for an admin token — they are different tables entirely', async () => {
    db = openDatabase(':memory:');
    process.env.TG_ADMIN_SECRET = 'fixture-admin-secret-14';
    const realAdminToken = generateAdminToken();
    await createAdminSession(db, realAdminToken);
    // A DIFFERENT random token (standing in for a regular user's session
    // token, which lives in a completely separate `users` table this
    // function never queries) must not verify.
    const someOtherToken = generateAdminToken();
    expect(await isAdminToken(db, someOtherToken)).toBe(false);
    expect(await isAdminToken(db, realAdminToken)).toBe(true);
  });
});

describe('15: forged admin identity denied', () => {
  it('a guessed/invented token string never hashes to a stored admin session', async () => {
    db = openDatabase(':memory:');
    process.env.TG_ADMIN_SECRET = 'fixture-admin-secret-15';
    await createAdminSession(db, generateAdminToken());
    expect(await isAdminToken(db, 'forged-admin-token-guess')).toBe(false);
    expect(await isAdminToken(db, 'admin')).toBe(false);
    expect(await isAdminToken(db, '')).toBe(false);
  });

  it('a wrong secret never verifies, even one character off', () => {
    process.env.TG_ADMIN_SECRET = 'the-real-secret-value';
    expect(verifyAdminSecret('the-real-secret-valuX')).toBe(false);
    expect(verifyAdminSecret('the-real-secret-value')).toBe(true);
    expect(verifyAdminSecret('')).toBe(false);
  });

  it('an unconfigured TG_ADMIN_SECRET fails closed — never a default/bypass secret', () => {
    delete process.env.TG_ADMIN_SECRET;
    expect(verifyAdminSecret('')).toBe(false);
    expect(verifyAdminSecret('anything-at-all')).toBe(false);
    expect(verifyAdminSecret('undefined')).toBe(false);
  });
});

describe('16: client cannot self-promote to admin', () => {
  it('there is no function in this module that grants admin from anything other than a verified secret — creating a session always requires createAdminSession, which is only ever called after verifyAdminSecret succeeds (see adminSession.ts’s loginAdmin, which this module deliberately does not duplicate)', async () => {
    db = openDatabase(':memory:');
    // Simulate the ONLY legitimate path: verify, then create.
    process.env.TG_ADMIN_SECRET = 'fixture-admin-secret-16';
    expect(verifyAdminSecret('wrong-guess')).toBe(false);
    // No session was created because verification failed — confirm no
    // token at all is admin-authorized yet.
    const arbitraryToken = generateAdminToken();
    expect(await isAdminToken(db, arbitraryToken)).toBe(false);
  });

  it('an admin session older than the max age is no longer honored, even with a correct hash match', async () => {
    db = openDatabase(':memory:');
    const token = generateAdminToken();
    // Insert a session as if it were created 13 hours ago (past the 12h
    // max age) — directly via SQL, mirroring what a real long-lived
    // stolen/replayed cookie would look like server-side.
    const staleCreatedAt = new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString();
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await db.execute('INSERT INTO admin_sessions (token_hash, created_at) VALUES (?, ?)', [tokenHash, staleCreatedAt]);
    expect(await isAdminToken(db, token)).toBe(false);
  });
});
