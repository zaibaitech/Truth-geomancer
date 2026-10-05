# Authentication & sessions

## How it works now

- **Sessions** (`lib/server/sessions.ts`, table `sessions`): one row per signed-in
  browser. The cookie holds a random 256-bit token; only its SHA-256 hash is
  stored. Idle expiry 90 days (slid at most once a day), absolute expiry
  1 year, `revoked_at` for logout. Signing in on one device never touches
  another device's session; logging out revokes only that browser's row.
- **Cookie** (`lib/server/session.ts`): `__Host-tg_session` in production
  (HttpOnly, Secure, SameSite=Lax, Path=/, no Domain). The pre-redesign
  `tg_uid` cookie is still read; its token is migrated into a `sessions` row
  on first use and re-issued under the new name.
- **Sign-in** (`app/signin`, `app/api/auth/start`, `app/api/auth/verify-code`):
  email → 6-digit code (10-minute TTL, single use, 5 attempts, salted scrypt
  hash, database-backed rate limits per email and IP). The magic link
  (`/auth/confirm#token=…`) remains as a fallback.
- **Switching accounts**: a successful sign-in always switches *this* browser
  to the verified account (`lib/server/auth/signIn.ts`). If the same browser
  started and finished the sign-in, its anonymous records are claimed into
  the account (`lib/server/auth/claim.ts`, audited in `identity_claims`).
  The CLAIMABLE / NOT CLAIMABLE / REVIEW rules are documented at the top of
  `claim.ts`.

## Deploying

Migration `0006_sessions_codes_claims.sql` is additive and must be applied
(`npm run db:migrate`) **before** the code that uses it is deployed.

## Passkeys (Phase 4 — planned, not implemented)

Passkeys slot in as another way to *prove the account*, ending in the same
`issueSession()` call as email sign-in — sessions, cookies, logout and claims
need no change.

1. **Library**: `@simplewebauthn/server` (+ `/browser`). RP ID
   `truthgeomancer.com`, origin `https://truthgeomancer.com` only.
2. **Table** `webauthn_credentials` (additive): `id`, `user_id`,
   `credential_id` (unique, base64url), `public_key` (COSE bytes),
   `sign_count`, `transports`, `backed_up`, `device_type`, `name`,
   `created_at`, `last_used_at`, `revoked_at`. **Only the public key is
   stored — private key material never leaves the authenticator.**
3. **Challenges** table `webauthn_challenges` (or reuse the code table's
   pattern): random challenge, hashed, 5-minute TTL, single use, bound to the
   browser's session and purpose (`register` / `authenticate`).
4. **Registration** (signed-in only, from Settings → "Add a passkey"):
   `POST /api/auth/passkey/register/options` → browser ceremony →
   `POST /api/auth/passkey/register/verify`. Require user verification.
   Requires a recent sign-in (e.g. email code within the last 10 minutes)
   so a stolen session alone can't add a passkey.
5. **Sign-in**: `/signin` offers "Sign in with a passkey" (conditional UI /
   autofill on the email field). `options` → ceremony → `verify` →
   `completeEmailSignIn`-equivalent (`completePasskeySignIn`) → claim rules
   unchanged → `issueSession(db, userId, 'passkey')` (add `'passkey'` to the
   `sessions.kind` CHECK in the same migration).
6. **Management**: list / rename / remove passkeys in Settings; removing the
   last passkey is fine because email codes remain available.
7. **Same rules as today**: `Cache-Control: private, no-store`, same-origin
   guard, database-backed rate limits, no enumeration (`allowCredentials`
   empty for discoverable credentials), no secrets in logs or URLs.
8. **Assurance**: synced passkeys are acceptable for this app (NIST
   SP 800-63B-4 allows them at AAL2). The email code stays as the recovery
   path.
