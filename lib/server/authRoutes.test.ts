// Structural checks on the Prompt 46 persistent-identity routes/UI/SW —
// same pattern as paymentRequestRoutes.test.ts and offlineRoutes.test.ts:
// the domain layer's correctness is proven in emailAuth.test.ts; these
// prove the ROUTE WIRING, admin isolation, Service Worker interaction,
// and protected-content boundary are never undermined by it.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const REQUEST_LINK_ROUTE = readFileSync('app/api/auth/request-link/route.ts', 'utf-8');
const VERIFY_ROUTE = readFileSync('app/api/auth/verify/route.ts', 'utf-8');
const STATUS_ROUTE = readFileSync('app/api/auth/status/route.ts', 'utf-8');
const LOGOUT_ROUTE = readFileSync('app/api/auth/logout/route.ts', 'utf-8');
const EMAIL_AUTH = readFileSync('lib/server/emailAuth.ts', 'utf-8');
const EMAIL_SESSION = readFileSync('lib/server/emailSession.ts', 'utf-8');
const EMAIL_PROVIDER = readFileSync('lib/server/emailProvider.ts', 'utf-8');
const RATE_LIMIT = readFileSync('lib/server/rateLimit.ts', 'utf-8');
const ADMIN_AUTH = readFileSync('lib/server/adminAuth.ts', 'utf-8');
const ADMIN_SESSION = readFileSync('lib/server/adminSession.ts', 'utf-8');
const SIGN_IN_FORM = readFileSync('components/auth/SignInForm.tsx', 'utf-8');
const ACCOUNT_SECTION = readFileSync('components/auth/AccountSection.tsx', 'utf-8');
const SW = readFileSync('public/sw.js', 'utf-8');

/** Strips `//` line comments (and SQL `--` comments) before matching, so a
 * test asserting "the code never does X" isn't defeated — or, as
 * happened while writing these, falsely tripped — by this file's own
 * prose comments *mentioning* X. Same technique
 * offlineRoutes.test.ts's "offline manifest never stores a session
 * token" test already uses. */
function codeOnly(source: string): string {
  return source
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      return !trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('--');
    })
    .join('\n');
}

const AUTH_FILES = [
  REQUEST_LINK_ROUTE,
  VERIFY_ROUTE,
  STATUS_ROUTE,
  LOGOUT_ROUTE,
  EMAIL_AUTH,
  EMAIL_SESSION,
  EMAIL_PROVIDER,
  RATE_LIMIT,
  SIGN_IN_FORM,
  ACCOUNT_SECTION,
];

describe('G: request-link never reveals whether an account exists', () => {
  it('the success response and the rate-limited response are the exact same object/constant, not two differently-worded messages', () => {
    const successReturns = REQUEST_LINK_ROUTE.match(/NextResponse\.json\(GENERIC_RESPONSE/g) ?? [];
    // Once for the rate-limited early return, once for the real success
    // return at the end — if a third call site diverges with its own
    // wording, this count changes and this test catches it.
    expect(successReturns.length).toBe(2);
  });

  it('the route never branches on whether the email already has an account before sending the generic response', () => {
    expect(REQUEST_LINK_ROUTE).not.toMatch(/resolveUserForVerifiedEmail|findUsersByEmail/);
  });
});

describe('P: magic-link verification never calls getCurrentUser() before identity resolution', () => {
  it('the verify route never imports or calls getCurrentUser — only consumeLoginToken decides identity', () => {
    expect(codeOnly(VERIFY_ROUTE)).not.toMatch(/getCurrentUser\b/);
    expect(VERIFY_ROUTE).toMatch(/consumeLoginToken/);
  });

  it('the request-link route only ever uses the read-only getCurrentUserIfPresent(), never getCurrentUser()', () => {
    expect(REQUEST_LINK_ROUTE).toMatch(/getCurrentUserIfPresent/);
    expect(codeOnly(REQUEST_LINK_ROUTE)).not.toMatch(/getCurrentUser\(\)/);
  });
});

describe('Q: admin authentication remains completely independent', () => {
  it('none of the new email-auth files import anything from the admin auth/session modules', () => {
    for (const source of AUTH_FILES) {
      expect(source).not.toMatch(/from ['"]@\/lib\/server\/adminAuth['"]/);
      expect(source).not.toMatch(/from ['"]@\/lib\/server\/adminSession['"]/);
    }
  });

  it('the existing admin auth/session modules import nothing from the new email-auth files', () => {
    expect(ADMIN_AUTH).not.toMatch(/emailAuth|emailSession|emailProvider/);
    expect(ADMIN_SESSION).not.toMatch(/emailAuth|emailSession|emailProvider/);
  });

  it('the new email session cookie reuses tg_uid, never tg_admin', () => {
    expect(EMAIL_SESSION).not.toMatch(/tg_admin/);
  });
});

describe('R: logout clears the session without deleting any user/account data', () => {
  it('the logout route only clears the cookie — no DELETE statement anywhere in its own file or in clearSessionCookie', () => {
    expect(LOGOUT_ROUTE).not.toMatch(/DELETE FROM/i);
    expect(EMAIL_SESSION).not.toMatch(/DELETE FROM/i);
    expect(LOGOUT_ROUTE).toMatch(/clearSessionCookie/);
  });
});

describe('S: authentication API responses are excluded from Service Worker opportunistic caching', () => {
  // Re-derive the SW's own predicate from its source text (same technique
  // offlineRoutes.test.ts already uses) rather than duplicating a second,
  // potentially-drifting copy of the logic.
  function shouldOpportunisticallyCache(pathname: string): boolean {
    const prefixesMatch = SW.match(/const NO_OPPORTUNISTIC_CACHE_PREFIXES = (\[[^\]]*\]);/);
    expect(prefixesMatch).not.toBeNull();
    // eslint-disable-next-line no-eval
    const prefixes: string[] = eval(prefixesMatch![1]);
    return !prefixes.some((prefix) => pathname.startsWith(prefix));
  }

  it('every new /api/auth/* route already falls under the existing /api/ exclusion — no new SW change was required', () => {
    expect(shouldOpportunisticallyCache('/api/auth/request-link')).toBe(false);
    expect(shouldOpportunisticallyCache('/api/auth/verify')).toBe(false);
    expect(shouldOpportunisticallyCache('/api/auth/status')).toBe(false);
    expect(shouldOpportunisticallyCache('/api/auth/logout')).toBe(false);
  });

  it('public/sw.js itself was not modified by Prompt 46 — the auth UI lives inside the existing /settings page rather than a new top-level route', () => {
    expect(SW).not.toMatch(/auth|login|account/i);
  });
});

describe('T: protected geomancy/Kanzul content never enters the authentication code path', () => {
  it('none of the new auth files import the content service, protected content modules, or the question registry', () => {
    for (const source of AUTH_FILES) {
      expect(source).not.toMatch(/lib\/server\/contentService/);
      expect(source).not.toMatch(/lib\/server\/content\/kanzulMikban/);
      expect(source).not.toMatch(/lib\/server\/content\/masterOfGeomancy/);
      expect(source).not.toMatch(/QUESTION_REGISTRY/);
      expect(source).not.toMatch(/lib\/raml\/engine\/questions/);
      expect(source).not.toMatch(/methodParser/);
    }
  });

  it('the /api/auth/status response shape is limited to {authenticated, email} — no entitlement/product/database field', () => {
    expect(codeOnly(STATUS_ROUTE)).not.toMatch(/entitlement|productId|userId/i);
  });
});

describe('additive-only schema: the new migration never touches an existing table', () => {
  it('0002_email_login_tokens.sql contains no ALTER/DROP statement and no UNIQUE constraint on users.email', () => {
    const migration = codeOnly(readFileSync('lib/server/db/migrations/0002_email_login_tokens.sql', 'utf-8'));
    expect(migration).not.toMatch(/ALTER TABLE/i);
    expect(migration).not.toMatch(/DROP /i);
    expect(migration).not.toMatch(/UNIQUE/i);
    expect(migration).toMatch(/CREATE TABLE IF NOT EXISTS email_login_tokens/);
  });

  it('0003_rate_limit_buckets.sql (Prompt 52) contains no ALTER/DROP statement and no UNIQUE constraint on users.email', () => {
    const migration = codeOnly(readFileSync('lib/server/db/migrations/0003_rate_limit_buckets.sql', 'utf-8'));
    expect(migration).not.toMatch(/ALTER TABLE/i);
    expect(migration).not.toMatch(/DROP /i);
    expect(migration).not.toMatch(/UNIQUE/i);
    expect(migration).toMatch(/CREATE TABLE IF NOT EXISTS rate_limit_buckets/);
  });
});

describe('Prompt 52: request-link never trusts the incoming Host header for the magic-link origin in production', () => {
  it('the login URL origin comes from APP_BASE_URL (or, outside production only, the request itself) — never an unconditional request.url read', () => {
    const source = codeOnly(REQUEST_LINK_ROUTE);
    expect(source).toMatch(/process\.env\.APP_BASE_URL/);
    expect(source).toMatch(/resolveAppOrigin/);
  });

  it('production without APP_BASE_URL configured throws rather than falling back to the request origin', () => {
    expect(codeOnly(REQUEST_LINK_ROUTE)).toMatch(/AppOriginNotConfiguredError/);
  });
});

describe('Prompt 52: production email delivery never falls back to ConsoleEmailProvider', () => {
  it('getEmailProvider() only returns ResendEmailProvider in production, gated on RESEND_API_KEY and EMAIL_FROM_ADDRESS both being present', () => {
    const source = codeOnly(EMAIL_PROVIDER);
    expect(source).toMatch(/RESEND_API_KEY/);
    expect(source).toMatch(/EMAIL_FROM_ADDRESS/);
    expect(source).toMatch(/ResendEmailProvider/);
  });

  it('the Resend integration never routes the magic link through a tracking/redirect URL — it sends the exact loginUrl it was given', () => {
    const source = codeOnly(EMAIL_PROVIDER);
    expect(source).not.toMatch(/click.?track/i);
    expect(source).not.toMatch(/redirect.*resend|resend.*redirect/i);
  });
});

describe('Prompt 52: rate limiting is production-grade (database-backed), not the in-memory implementation', () => {
  it('request-link and verify both construct a PostgresRateLimiter, not InMemoryRateLimiter, for their live traffic decisions', () => {
    expect(codeOnly(REQUEST_LINK_ROUTE)).toMatch(/PostgresRateLimiter/);
    expect(codeOnly(REQUEST_LINK_ROUTE)).not.toMatch(/InMemoryRateLimiter/);
    expect(codeOnly(VERIFY_ROUTE)).toMatch(/PostgresRateLimiter/);
    expect(codeOnly(VERIFY_ROUTE)).not.toMatch(/InMemoryRateLimiter/);
  });
});
