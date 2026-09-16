// Tests for the SQLite test/local-dev adapter's schema (Prompt 26, Phase
// 3; updated for Prompt 31C's async Db interface). These exercise
// lib/server/db/sqliteAdapter.ts specifically — the constraints and
// indexes it declares actually behave as claimed — since that is the
// adapter every other test in this repo runs against via
// `openDatabase(':memory:')`. The equivalent Postgres schema lives in
// lib/server/db/migrations/0001_init.sql and is applied to a real Neon
// database by lib/server/db/migrate.ts, not exercised here (no live
// Postgres connection is available to a normal `npm test` run — see
// lib/server/db/postgresAdapter.concurrency.test.ts for the tests that
// DO run against a real Postgres connection when DATABASE_URL is set).
//
// Every test opens its own ':memory:' database — fully isolated, no file
// left behind, no shared state between tests.
import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from './db';

let db: Db;
afterEach(async () => {
  try {
    await db?.close();
  } catch {
    // Not open for a test that never called openDatabase(); nothing to clean up.
  }
});

async function makeUser(database: Db, id = randomUUID()) {
  await database.execute(
    'INSERT INTO users (id, session_token_hash, email, created_at, last_seen_at) VALUES (?, ?, NULL, ?, ?)',
    [id, `hash-${id}`, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'],
  );
  return id;
}

describe('users table', () => {
  it('enforces session_token_hash uniqueness', async () => {
    db = openDatabase(':memory:');
    await db.execute(
      'INSERT INTO users (id, session_token_hash, email, created_at, last_seen_at) VALUES (?, ?, NULL, ?, ?)',
      ['u1', 'same-hash', 't', 't'],
    );
    await expect(
      db.execute('INSERT INTO users (id, session_token_hash, email, created_at, last_seen_at) VALUES (?, ?, NULL, ?, ?)', [
        'u2',
        'same-hash',
        't',
        't',
      ]),
    ).rejects.toThrow();
  });
});

describe('entitlements table', () => {
  it('rejects a status outside active|revoked (CHECK constraint)', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser(db);
    await expect(
      db.execute('INSERT INTO entitlements (id, user_id, product_id, status, granted_at, source) VALUES (?, ?, ?, ?, ?, ?)', [
        'e1',
        userId,
        'kanzul-mikban',
        'lifetime-vip',
        '2026-01-01T00:00:00Z',
        'manual-payment',
      ]),
    ).rejects.toThrow();
  });

  it('rejects a source outside manual-payment|promo (CHECK constraint)', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser(db);
    await expect(
      db.execute('INSERT INTO entitlements (id, user_id, product_id, status, granted_at, source) VALUES (?, ?, ?, ?, ?, ?)', [
        'e1',
        userId,
        'kanzul-mikban',
        'active',
        '2026-01-01T00:00:00Z',
        'stripe-webhook',
      ]),
    ).rejects.toThrow();
  });

  it('rejects an entitlement referencing a non-existent user (foreign key)', async () => {
    db = openDatabase(':memory:');
    await expect(
      db.execute('INSERT INTO entitlements (id, user_id, product_id, status, granted_at, source) VALUES (?, ?, ?, ?, ?, ?)', [
        'e1',
        'no-such-user',
        'kanzul-mikban',
        'active',
        '2026-01-01T00:00:00Z',
        'manual-payment',
      ]),
    ).rejects.toThrow();
  });
});

describe('preview_usage table', () => {
  it('rejects a duplicate (user_id, preview_id) row (composite PRIMARY KEY)', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser(db);
    await db.execute('INSERT INTO preview_usage (user_id, preview_id, uses_consumed, status) VALUES (?, ?, ?, ?)', [
      userId,
      'preview-1',
      1,
      'exhausted',
    ]);
    await expect(
      db.execute('INSERT INTO preview_usage (user_id, preview_id, uses_consumed, status) VALUES (?, ?, ?, ?)', [
        userId,
        'preview-1',
        1,
        'exhausted',
      ]),
    ).rejects.toThrow();
  });

  it('allows the same preview_id for two different users', async () => {
    db = openDatabase(':memory:');
    const userA = await makeUser(db);
    const userB = await makeUser(db);
    await db.execute('INSERT INTO preview_usage (user_id, preview_id, uses_consumed, status) VALUES (?, ?, ?, ?)', [
      userA,
      'preview-1',
      1,
      'exhausted',
    ]);
    await expect(
      db.execute('INSERT INTO preview_usage (user_id, preview_id, uses_consumed, status) VALUES (?, ?, ?, ?)', [
        userB,
        'preview-1',
        1,
        'exhausted',
      ]),
    ).resolves.not.toThrow();
  });
});

describe('indexes', () => {
  it('declares the userId+status and userId+productId+status indexes', async () => {
    db = openDatabase(':memory:');
    const rows = await db.query<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'index'");
    const names = rows.map((r) => r.name);
    expect(names).toContain('idx_entitlements_user_status');
    expect(names).toContain('idx_entitlements_user_product_status');
  });
});
