-- Auth/session redesign (Phases 1-3). ADDITIVE ONLY: three new tables, no
-- ALTER/DROP of any existing table or column. users.session_token_hash is
-- kept (NOT NULL UNIQUE, unchanged) for backward compatibility: existing
-- cookies whose hash still lives there keep working and are migrated into
-- `sessions` lazily, one browser at a time, the first time they are seen
-- (lib/server/sessions.ts, resolveSession). No backfill is needed and no
-- user is signed out by this migration.

-- One row per signed-in browser ("device"). Many per user, each independent:
-- signing in elsewhere never invalidates this one; logging out revokes only
-- this one. Only the SHA-256 of the cookie token is stored, never the token.
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('anonymous', 'email', 'legacy')),
  created_at TEXT NOT NULL,
  last_used_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  absolute_expires_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Short-lived 6-digit sign-in codes. Only a salted scrypt hash of the code is
-- stored. Single use, expiring, attempt-limited; a newer code for the same
-- email supersedes older unused ones.
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  code_salt TEXT NOT NULL,
  claim_user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  superseded_at TEXT,
  attempts INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email
  ON email_verification_codes(email, created_at);

-- Audit trail of every anonymous-identity claim performed at sign-in: which
-- anonymous users.id was claimed into which account, how, and a JSON summary
-- of exactly which records moved, which were left in place, and which need
-- review. Never deleted; the anonymous users row itself is also never deleted.
CREATE TABLE IF NOT EXISTS identity_claims (
  id TEXT PRIMARY KEY,
  anonymous_user_id TEXT NOT NULL REFERENCES users(id),
  account_user_id TEXT NOT NULL REFERENCES users(id),
  method TEXT NOT NULL,
  claimed_at TEXT NOT NULL,
  summary TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_identity_claims_account ON identity_claims(account_user_id);
CREATE INDEX IF NOT EXISTS idx_identity_claims_anonymous ON identity_claims(anonymous_user_id);
