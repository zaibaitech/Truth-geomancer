// Server-only database handle (Prompt 26 — backend/identity/entitlement
// foundation). Uses Node's built-in `node:sqlite` — no new npm
// dependency, no external service, no credentials to leak. This is a
// deliberate, documented choice; see lib/access/README.md "Database
// engine chosen, and its limits" for why this is a development/
// single-instance implementation rather than a production-scale one, and
// what a real deployment needs instead.
//
// This module must never be imported by client ('use client') code: it
// imports 'node:sqlite', a Node.js built-in that does not exist in a
// browser bundle, so doing so would fail to build. It is not imported by
// anything outside lib/server/ in this task (see Phase 9 — nothing is
// wired into a route yet).
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import type { DatabaseSync as DatabaseSyncType } from 'node:sqlite';

// Loaded via `require` rather than a static `import` specifier: Vite's
// SSR/test runner (vite-node) normalizes `node:`-prefixed builtins by
// their un-prefixed name when deciding what to externalize, but
// `node:sqlite` — unlike long-standing builtins such as `node:fs` — has
// no un-prefixed registration in Node itself, so a static import trips
// that mismatch under Vitest even though it runs fine under plain `node`.
// A plain `require()` call is untouched by that rewriting and resolves
// directly through Node's own module loader in both contexts.
const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite');

export type Db = DatabaseSyncType;

/** File path for the real (non-test) database. Overridable via
 * `TG_DB_PATH` — e.g. set to `:memory:` to run the whole app against a
 * throwaway in-process database. Defaults to a gitignored local file so a
 * dev server's data survives across requests within one run. */
const DEFAULT_DB_PATH = process.env.TG_DB_PATH ?? '.data/truth-geomancer.db';

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

-- PRIMARY KEY(user_id, preview_id) is the constraint that prevents a
-- duplicate/conflicting usage row per user+preview (Prompt 26, Phase 3).
CREATE TABLE IF NOT EXISTS preview_usage (
  user_id TEXT NOT NULL REFERENCES users(id),
  preview_id TEXT NOT NULL,
  uses_consumed INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('available', 'exhausted')),
  PRIMARY KEY (user_id, preview_id)
);

-- Prompt 28: a PaymentRequest is a CLAIM, never an entitlement — see
-- lib/access/types.ts's own comment. reviewed_at/reviewed_by/admin_note
-- stay NULL until an admin acts; grantEntitlement() is only ever called
-- from the approval transaction in lib/server/paymentRequests.ts, never
-- from this table's own writes.
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
-- Administrative queue: "all pending requests, oldest first".
CREATE INDEX IF NOT EXISTS idx_payment_requests_status_submitted
  ON payment_requests(status, submitted_at);
-- User's own history: "my requests, most recent first".
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_submitted
  ON payment_requests(user_id, submitted_at);

-- Prompt 28, Phase 7: the server-authoritative admin identity. A row here
-- exists only after a caller proved knowledge of TG_ADMIN_SECRET (see
-- lib/server/adminAuth.ts) — the table stores only a hash of the resulting
-- session token, mirroring users.session_token_hash, never the secret
-- itself or the raw token.
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);
`;

/** Opens (creating if necessary) a database at `path` with the schema
 * applied. Pass `':memory:'` for an isolated, throwaway database — every
 * test in this module's test suite does exactly that, so tests never
 * share or pollute state with each other or with a real local database
 * file. */
export function openDatabase(path: string = DEFAULT_DB_PATH): Db {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}

let sharedDb: Db | null = null;

/** The process-wide handle for real (non-test) use, opened lazily so
 * merely importing this module never has a filesystem side effect on its
 * own. Not called from anywhere in this task yet (see module comment). */
export function getDb(): Db {
  if (!sharedDb) sharedDb = openDatabase();
  return sharedDb;
}
