// Tests for the database schema itself (Prompt 26, Phase 3): the
// constraints and indexes the schema declares actually behave as claimed.
// Every test opens its own ':memory:' database — fully isolated, no file
// left behind, no shared state between tests.
import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from './db';

let db: Db;
afterEach(() => {
  try {
    db?.close();
  } catch {
    // Not open for a test that never called openDatabase(); nothing to clean up.
  }
});

function makeUser(database: Db, id = randomUUID()) {
  database
    .prepare('INSERT INTO users (id, session_token_hash, email, created_at, last_seen_at) VALUES (?, ?, NULL, ?, ?)')
    .run(id, `hash-${id}`, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z');
  return id;
}

describe('users table', () => {
  it('enforces session_token_hash uniqueness', () => {
    db = openDatabase(':memory:');
    db.prepare('INSERT INTO users (id, session_token_hash, email, created_at, last_seen_at) VALUES (?, ?, NULL, ?, ?)').run(
      'u1',
      'same-hash',
      't',
      't',
    );
    expect(() =>
      db
        .prepare('INSERT INTO users (id, session_token_hash, email, created_at, last_seen_at) VALUES (?, ?, NULL, ?, ?)')
        .run('u2', 'same-hash', 't', 't'),
    ).toThrow();
  });
});

describe('entitlements table', () => {
  it('rejects a status outside active|revoked (CHECK constraint)', () => {
    db = openDatabase(':memory:');
    const userId = makeUser(db);
    expect(() =>
      db
        .prepare('INSERT INTO entitlements (id, user_id, product_id, status, granted_at, source) VALUES (?, ?, ?, ?, ?, ?)')
        .run('e1', userId, 'kanzul-mikban', 'lifetime-vip', '2026-01-01T00:00:00Z', 'manual-payment'),
    ).toThrow();
  });

  it('rejects a source outside manual-payment|promo (CHECK constraint)', () => {
    db = openDatabase(':memory:');
    const userId = makeUser(db);
    expect(() =>
      db
        .prepare('INSERT INTO entitlements (id, user_id, product_id, status, granted_at, source) VALUES (?, ?, ?, ?, ?, ?)')
        .run('e1', userId, 'kanzul-mikban', 'active', '2026-01-01T00:00:00Z', 'stripe-webhook'),
    ).toThrow();
  });

  it('rejects an entitlement referencing a non-existent user (foreign key)', () => {
    db = openDatabase(':memory:');
    expect(() =>
      db
        .prepare('INSERT INTO entitlements (id, user_id, product_id, status, granted_at, source) VALUES (?, ?, ?, ?, ?, ?)')
        .run('e1', 'no-such-user', 'kanzul-mikban', 'active', '2026-01-01T00:00:00Z', 'manual-payment'),
    ).toThrow();
  });
});

describe('preview_usage table', () => {
  it('rejects a duplicate (user_id, preview_id) row (composite PRIMARY KEY)', () => {
    db = openDatabase(':memory:');
    const userId = makeUser(db);
    db.prepare('INSERT INTO preview_usage (user_id, preview_id, uses_consumed, status) VALUES (?, ?, ?, ?)').run(
      userId,
      'preview-1',
      1,
      'exhausted',
    );
    expect(() =>
      db
        .prepare('INSERT INTO preview_usage (user_id, preview_id, uses_consumed, status) VALUES (?, ?, ?, ?)')
        .run(userId, 'preview-1', 1, 'exhausted'),
    ).toThrow();
  });

  it('allows the same preview_id for two different users', () => {
    db = openDatabase(':memory:');
    const userA = makeUser(db);
    const userB = makeUser(db);
    db.prepare('INSERT INTO preview_usage (user_id, preview_id, uses_consumed, status) VALUES (?, ?, ?, ?)').run(
      userA,
      'preview-1',
      1,
      'exhausted',
    );
    expect(() =>
      db
        .prepare('INSERT INTO preview_usage (user_id, preview_id, uses_consumed, status) VALUES (?, ?, ?, ?)')
        .run(userB, 'preview-1', 1, 'exhausted'),
    ).not.toThrow();
  });
});

describe('indexes', () => {
  it('declares the userId+status and userId+productId+status indexes', () => {
    db = openDatabase(':memory:');
    const names = (db.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all() as { name: string }[]).map(
      (r) => r.name,
    );
    expect(names).toContain('idx_entitlements_user_status');
    expect(names).toContain('idx_entitlements_user_product_status');
  });
});
