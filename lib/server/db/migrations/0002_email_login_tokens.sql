-- Truth Geomancer — email magic-link login tokens (Prompt 46). Additive
-- only: does not alter users, entitlements, payment_requests,
-- preview_usage, or admin_sessions in any way, and does NOT add a unique
-- constraint on users.email (see lib/access/README.md / the Prompt
-- 44/45/46 audit trail for why that is deliberately deferred until
-- production email data has been verified).
--
-- user_id is nullable and set at REQUEST time to the requesting device's
-- current anonymous users.id, if any — this is what lets verification
-- attach a newly-verified email to that SAME existing identity (preserving
-- its entitlements/payment_requests/preview_usage) instead of ever having
-- to create or merge users. A request with no existing anonymous identity
-- stores NULL here; verification then creates exactly one new user only
-- in that specific case (see lib/server/emailAuth.ts).
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
