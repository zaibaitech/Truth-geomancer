-- Truth Geomancer — production-grade distributed rate limiting (Prompt
-- 52), reusing the existing Neon/Postgres database rather than adding a
-- second piece of infrastructure (see the Prompt 51 audit's conclusion).
-- Additive only: does not alter users, entitlements, payment_requests,
-- preview_usage, admin_sessions, or email_login_tokens in any way, and
-- does NOT add a unique constraint on users.email.
--
-- Fixed-window counter: (scope, key_hash, window_start) is the natural
-- primary key — one row per policy per hashed identifier per window.
-- scope distinguishes policies sharing this one table (e.g.
-- 'request-link:email', 'request-link:ip', 'verify:ip') so different
-- policies never share a counter even if the same raw key (e.g. the same
-- IP) happens to appear in more than one. key_hash is SHA-256(scope + key)
-- (see lib/server/rateLimit.ts's hashRateLimitKey) — never the raw email
-- address or IP address itself (Prompt 52 §13).
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
-- Supports the opportunistic cleanup delete in PostgresRateLimiter.check()
-- ("WHERE expires_at < ?") — the only query pattern that scans this table
-- by a column other than the primary key.
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_expires_at
  ON rate_limit_buckets(expires_at);
