-- Truth Geomancer — initial Postgres schema (Prompt 31C — Neon Postgres
-- migration). Direct translation of the logical data model previously
-- defined in lib/server/db.ts's SQLite SCHEMA string (SQLite dialect
-- still lives in lib/server/db/sqliteAdapter.ts for the test/local-dev
-- adapter) — same tables, columns, constraints, and indexes, preserved
-- exactly. Applied by lib/server/db/migrate.ts, which tracks applied
-- migrations in schema_migrations and never re-runs or reverses one.
--
-- Timestamps stay TEXT (ISO-8601 strings), matching every existing
-- read/write in lib/server/*.ts (e.g. `new Date().toISOString()`) exactly
-- — not TIMESTAMPTZ, so no column's meaning or the application code
-- touching it needs to change as part of this migration.

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
-- duplicate/conflicting usage row per user+preview.
CREATE TABLE IF NOT EXISTS preview_usage (
  user_id TEXT NOT NULL REFERENCES users(id),
  preview_id TEXT NOT NULL,
  uses_consumed INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('available', 'exhausted')),
  PRIMARY KEY (user_id, preview_id)
);

-- A PaymentRequest is a CLAIM, never an entitlement — see
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

-- The server-authoritative admin identity. A row here exists only after a
-- caller proved knowledge of TG_ADMIN_SECRET (see lib/server/adminAuth.ts)
-- — the table stores only a hash of the resulting session token, mirroring
-- users.session_token_hash, never the secret itself or the raw token.
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);
