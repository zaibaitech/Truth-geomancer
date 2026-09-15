// Tests for the pure identity logic (Prompt 26, Phase 11 — IDENTITY).
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from './db';
import { createAnonymousUser, generateSessionToken, getOrCreateUser, getUserByToken } from './identity';

let db: Db;
afterEach(() => {
  try {
    db?.close();
  } catch {
    // Not open for a test that never called openDatabase(); nothing to clean up.
  }
});

describe('new anonymous identity', () => {
  it('creates a user with no token, and a fresh, high-entropy token is returned', () => {
    db = openDatabase(':memory:');
    const { user, token, isNew } = getOrCreateUser(db, null);
    expect(isNew).toBe(true);
    expect(user.id).toBeTruthy();
    expect(user.email).toBeNull();
    expect(token).toBeTruthy();
    expect(token.length).toBeGreaterThanOrEqual(32); // 256 bits, base64url
  });

  it('never persists the raw token, only its hash', () => {
    db = openDatabase(':memory:');
    const { token } = getOrCreateUser(db, null);
    const rows = db.prepare('SELECT session_token_hash FROM users').all() as { session_token_hash: string }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].session_token_hash).not.toBe(token);
  });

  it('two calls with no token create two distinct users', () => {
    db = openDatabase(':memory:');
    const a = getOrCreateUser(db, null);
    const b = getOrCreateUser(db, null);
    expect(a.user.id).not.toBe(b.user.id);
    expect(a.token).not.toBe(b.token);
  });
});

describe('stable identity across requests', () => {
  it('the same token resolves to the same user on a later call', () => {
    db = openDatabase(':memory:');
    const first = getOrCreateUser(db, null);
    const second = getOrCreateUser(db, first.token);
    expect(second.isNew).toBe(false);
    expect(second.user.id).toBe(first.user.id);
    expect(second.token).toBe(first.token);
  });

  it('resolving an existing token advances lastSeenAt', async () => {
    db = openDatabase(':memory:');
    const first = getOrCreateUser(db, null);
    await new Promise((r) => setTimeout(r, 5));
    const second = getOrCreateUser(db, first.token);
    expect(new Date(second.user.lastSeenAt).getTime()).toBeGreaterThanOrEqual(new Date(first.user.lastSeenAt).getTime());
  });
});

describe('invalid/tampered identity cannot impersonate another user', () => {
  it('an unknown, hand-typed token resolves to no user — never an existing one', () => {
    db = openDatabase(':memory:');
    const real = getOrCreateUser(db, null);
    expect(getUserByToken(db, 'userId=paid-user')).toBeNull();
    expect(getUserByToken(db, 'paid-user')).toBeNull();
    expect(getUserByToken(db, real.user.id)).toBeNull(); // the DB id itself is NOT a valid token
  });

  it('a tampered/unknown token in getOrCreateUser silently creates a NEW anonymous user, never an existing one', () => {
    db = openDatabase(':memory:');
    const real = getOrCreateUser(db, null);
    const attempt = getOrCreateUser(db, 'userId=paid-user');
    expect(attempt.isNew).toBe(true);
    expect(attempt.user.id).not.toBe(real.user.id);
    expect(attempt.token).not.toBe('userId=paid-user'); // server issues its own fresh token
  });

  it('every generated token is unique across many calls (no collision, unguessable)', () => {
    const tokens = new Set(Array.from({ length: 200 }, () => generateSessionToken()));
    expect(tokens.size).toBe(200);
  });

  it('createAnonymousUser with a caller-chosen token still requires that exact token to resolve later', () => {
    db = openDatabase(':memory:');
    createAnonymousUser(db, 'a-specific-token');
    expect(getUserByToken(db, 'a-specific-token')).not.toBeNull();
    expect(getUserByToken(db, 'a-specific-token-guessed')).toBeNull();
  });
});
