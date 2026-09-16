// TEST / LOCAL-DEVELOPMENT ADAPTER ONLY (Prompt 31C — Neon Postgres
// migration). This is the ONLY file in the production request path that
// may import `node:sqlite` — and even here, db.ts's getDb() only ever
// reaches this adapter when DATABASE_URL is unset AND NODE_ENV is not
// 'production' (see db.ts's own comment). Production always uses
// postgresAdapter.ts. This split — never `getDb()` silently falling back
// to a local file in production — is the actual fix for the original
// incident: the old code tried this exact `mkdirSync('.data')` +
// `DatabaseSync` path unconditionally, which does not exist on Vercel's
// serverless filesystem.
//
// Wraps node:sqlite's synchronous DatabaseSync behind the same async Db
// interface postgresAdapter.ts implements (see ./types.ts), so every
// service module written against Db runs unchanged against either
// adapter. Every existing test in this repo calls `openDatabase(':memory:')`
// (lib/server/db.ts) and gets exactly this adapter, fully isolated,
// exactly as before this migration — no test needs a live network
// database to run.
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import type { DatabaseSync as DatabaseSyncType } from 'node:sqlite';
import type { Db } from './types';

// Loaded via `require` rather than a static `import` specifier: Vitest's
// SSR/test runner (vite-node) normalizes `node:`-prefixed builtins by
// their un-prefixed name when deciding what to externalize, but
// `node:sqlite` has no un-prefixed registration in Node itself, so a
// static import trips that mismatch under Vitest even though it runs fine
// under plain `node`. A plain `require()` call resolves directly through
// Node's own module loader in both contexts.
const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite');

// Same logical schema as lib/server/db/migrations/0001_init.sql, in
// SQLite's dialect — the two are kept deliberately parallel (same tables,
// columns, constraints, indexes) so a test run against this adapter
// exercises the same logical data model production runs against Postgres.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  session_token_hash TEXT NOT NULL UNIQUE,
  email TEXT,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS entitlements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  product_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
  granted_at TEXT NOT NULL,
  revoked_at TEXT,
  source TEXT NOT NULL CHECK (source IN ('manual-payment', 'promo'))
);
CREATE INDEX IF NOT EXISTS idx_entitlements_user_status
  ON entitlements(user_id, status);
CREATE INDEX IF NOT EXISTS idx_entitlements_user_product_status
  ON entitlements(user_id, product_id, status);

CREATE TABLE IF NOT EXISTS preview_usage (
  user_id TEXT NOT NULL REFERENCES users(id),
  preview_id TEXT NOT NULL,
  uses_consumed INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('available', 'exhausted')),
  PRIMARY KEY (user_id, preview_id)
);

CREATE TABLE IF NOT EXISTS payment_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  product_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  payment_reference TEXT NOT NULL,
  user_note TEXT,
  admin_note TEXT,
  submitted_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status_submitted
  ON payment_requests(status, submitted_at);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_submitted
  ON payment_requests(user_id, submitted_at);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);

-- Prompt 46: same additive table as
-- lib/server/db/migrations/0002_email_login_tokens.sql, in SQLite's
-- dialect, kept parallel for the same reason every other table here is.
CREATE TABLE IF NOT EXISTS email_login_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_email_login_tokens_email
  ON email_login_tokens(email);

-- Prompt 52: same additive table as
-- lib/server/db/migrations/0003_rate_limit_buckets.sql, in SQLite's
-- dialect, kept parallel for the same reason every other table here is.
-- SQLite's node:sqlite (bundled SQLite >= 3.35) supports the same
-- INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING syntax
-- PostgresRateLimiter relies on, so the identical SQL text in
-- rateLimit.ts's check() runs unchanged against either adapter.
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  scope TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  window_start TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (scope, key_hash, window_start)
);
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_expires_at
  ON rate_limit_buckets(expires_at);
`;

class SqliteDb implements Db {
  // A single node:sqlite connection can only have ONE transaction open at
  // a time — a second `BEGIN` on the same connection while the first is
  // still open throws. The old fully-synchronous code (no `await`
  // anywhere in a transaction) got this serialization "for free": one
  // call always ran start-to-finish (BEGIN..COMMIT/ROLLBACK) before the
  // next began, since nothing ever yielded to the event loop mid-way.
  // Wrapping the same logic in `async`/`await` (Prompt 31C, so the SAME
  // callback also runs against postgresAdapter.ts's real async
  // connection) reintroduces yield points, so two `transaction()` calls
  // fired without awaiting between them (e.g. `Promise.all([...])`) can
  // now genuinely interleave and hit that "transaction within a
  // transaction" error. This queue restores the original guarantee by
  // construction: every transaction against this Db instance still runs
  // one at a time, in call order, never nested.
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly raw: DatabaseSyncType) {}

  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return this.raw.prepare(sql).all(...params) as unknown as T[];
  }

  async queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
    const row = this.raw.prepare(sql).get(...params);
    return row === undefined ? null : (row as T);
  }

  async execute(sql: string, params: unknown[] = []): Promise<void> {
    this.raw.prepare(sql).run(...params);
  }

  async transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
    const run = async (): Promise<T> => {
      this.raw.exec('BEGIN IMMEDIATE');
      try {
        const result = await fn(this);
        this.raw.exec('COMMIT');
        return result;
      } catch (err) {
        this.raw.exec('ROLLBACK');
        throw err;
      }
    };

    // Chain onto the queue regardless of whether the previous transaction
    // succeeded or failed — a failed transaction must never block every
    // later one forever — while still returning THIS call's own real
    // result/rejection to its caller.
    const result = this.queue.then(run, run);
    this.queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  async close(): Promise<void> {
    this.raw.close();
  }
}

/** `path === ':memory:'` for every test in this repo — an isolated,
 * throwaway database, never shared across tests. A real path is only
 * ever used for local `next dev` without DATABASE_URL set (see db.ts). */
export function createSqliteDb(path: string): Db {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }
  const raw = new DatabaseSync(path);
  raw.exec('PRAGMA foreign_keys = ON');
  raw.exec(SCHEMA);
  return new SqliteDb(raw);
}
