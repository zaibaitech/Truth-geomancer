// Structural checks on the auth/session redesign's ROUTE WIRING and UI entry
// points — same pattern as authRoutes.test.ts. The domain logic (sessions,
// codes, claims, returnTo) is proven in authRedesign.test.ts; these prove the
// routes actually use it: generic responses, the database-backed limiter,
// no-store headers, same-origin guards, cookie attributes, and a visible
// "Sign in" wherever authentication is naturally needed.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf-8');

const START = read('app/api/auth/start/route.ts');
const VERIFY_CODE = read('app/api/auth/verify-code/route.ts');
const VERIFY = read('app/api/auth/verify/route.ts');
const REQUEST_LINK = read('app/api/auth/request-link/route.ts');
const LOGOUT = read('app/api/auth/logout/route.ts');
const STATUS = read('app/api/auth/status/route.ts');
const PAYSTACK_CALLBACK = read('app/api/paystack/callback/route.ts');
const SESSION = read('lib/server/session.ts');
const SIGN_IN_FLOW = read('components/auth/SignInFlow.tsx');
const CONFIRM = read('components/auth/ConfirmSignIn.tsx');
const ACCOUNT_SECTION = read('components/auth/AccountSection.tsx');

function codeOnly(source: string): string {
  return source
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*');
    })
    .join('\n');
}

describe('auth endpoints are never cached', () => {
  it.each([
    ['start', START],
    ['verify-code', VERIFY_CODE],
    ['verify', VERIFY],
    ['request-link', REQUEST_LINK],
    ['logout', LOGOUT],
    ['status', STATUS],
  ])('%s sends Cache-Control: private, no-store on every response', (_name, source) => {
    expect(source).toMatch(/'Cache-Control': 'private, no-store'/);
    // Every NextResponse built in the route carries the headers.
    const responses = codeOnly(source).match(/NextResponse\.(json|redirect)\(/g) ?? [];
    const withHeaders = codeOnly(source).match(/headers: (NO_STORE_HEADERS|\{ \.\.\.NO_STORE_HEADERS|\{ 'Cache-Control': 'private, no-store')/g) ?? [];
    expect(responses.length).toBeGreaterThan(0);
    expect(withHeaders.length).toBe(responses.length);
  });

  it('the Paystack callback redirects are no-store, and nothing else about Paystack changed', () => {
    const redirects = PAYSTACK_CALLBACK.match(/NextResponse\.redirect\(/g) ?? [];
    const noStore = PAYSTACK_CALLBACK.match(/headers: NO_STORE_HEADERS/g) ?? [];
    expect(redirects.length).toBeGreaterThan(0);
    expect(noStore.length).toBe(redirects.length);
  });
});

describe('state-changing auth endpoints reject cross-origin requests (login CSRF)', () => {
  it.each([
    ['start', START],
    ['verify-code', VERIFY_CODE],
    ['verify', VERIFY],
    ['request-link', REQUEST_LINK],
    ['logout', LOGOUT],
  ])('%s checks isSameOriginRequest before doing anything', (_name, source) => {
    expect(source).toMatch(/if \(!isSameOriginRequest\(request\)\)/);
    const post = source.slice(source.indexOf('export async function POST'));
    expect(post.indexOf('isSameOriginRequest')).toBeLessThan(post.indexOf('getDb()') === -1 ? Infinity : post.indexOf('getDb()'));
  });
});

describe('code sign-in uses the database-backed limiter and generic responses', () => {
  it('start: per-email and per-IP PostgresRateLimiter with the CODE_REQUEST limits', () => {
    expect(START).toMatch(/new PostgresRateLimiter\(\s*db,\s*'auth-code:request:email',\s*CODE_REQUEST_EMAIL_LIMIT/);
    expect(START).toMatch(/new PostgresRateLimiter\(db, 'auth-code:request:ip', CODE_REQUEST_IP_LIMIT/);
    expect(codeOnly(START)).not.toMatch(/InMemoryRateLimiter|new Map\(/);
  });

  it('start: rate-limited and success return the same GENERIC_RESPONSE (no enumeration)', () => {
    expect((START.match(/NextResponse\.json\(GENERIC_RESPONSE/g) ?? []).length).toBe(2);
    expect(START).not.toMatch(/findUsersByEmail/);
  });

  it('start never creates a user (read-only browser identity)', () => {
    expect(START).toMatch(/getCurrentUserIfPresent/);
    expect(codeOnly(START)).not.toMatch(/getCurrentUser\(\)|createAnonymousUser|createUserWithEmail/);
  });

  it('verify-code: per-IP and per-email limiter, one generic INVALID body for every failure', () => {
    expect(VERIFY_CODE).toMatch(/'auth-code:verify:ip', CODE_VERIFY_IP_LIMIT/);
    expect(VERIFY_CODE).toMatch(/'auth-code:verify:email',\s*CODE_VERIFY_EMAIL_LIMIT/);
    expect(VERIFY_CODE).toMatch(/NextResponse\.json\(INVALID, \{ status: 400/);
  });

  it('verify-code: consumes the code and completes sign-in inside ONE transaction', () => {
    const tx = VERIFY_CODE.slice(VERIFY_CODE.indexOf('db.transaction'));
    expect(tx.indexOf('consumeSignInCode(tx')).toBeGreaterThan(-1);
    expect(tx.indexOf('completeEmailSignIn(tx')).toBeGreaterThan(tx.indexOf('consumeSignInCode(tx'));
  });

  it('verify-code: claims only when the same browser started the sign-in', () => {
    expect(VERIFY_CODE).toMatch(/claimAllowed: browserUserId !== null && verified\.claimUserId === browserUserId/);
  });

  it('verify-code: the redirect target is always passed through safeReturnTo', () => {
    expect(VERIFY_CODE).toMatch(/redirectTo: safeReturnTo\(/);
  });

  it('codes are only ever read from a POST body, never a query string', () => {
    expect(codeOnly(VERIFY_CODE)).not.toMatch(/searchParams/);
    expect(codeOnly(START)).not.toMatch(/searchParams/);
    expect(SIGN_IN_FLOW).toMatch(/postJson\('\/api\/auth\/verify-code', \{ email, code, returnTo \}\)/);
  });
});

describe('magic-link fallback', () => {
  it('GET never consumes the token — it only moves it into a URL fragment', () => {
    const get = VERIFY.slice(VERIFY.indexOf('export async function GET'), VERIFY.indexOf('export async function POST'));
    expect(codeOnly(get)).not.toMatch(/consumeLoginToken|getDb|setSessionCookie|switchBrowserToSession/);
    expect(get).toMatch(/confirm\.hash = `token=\$\{token\}`/);
    expect(get).toMatch(/'Referrer-Policy': 'no-referrer'/);
  });

  it('new emails carry the login token only in the URL fragment (never a query string a server would log)', () => {
    expect(REQUEST_LINK).toMatch(/const loginUrl = `\$\{origin\}\/auth\/confirm#token=\$\{token\}`;/);
    expect(codeOnly(REQUEST_LINK)).not.toMatch(/verify\?token=/);
  });

  it('POST consumes and switches the browser; the confirm page strips the token from the address bar', () => {
    expect(VERIFY).toMatch(/consumeLoginToken\(db, token, browser\?\.id \?\? null\)/);
    expect(VERIFY).toMatch(/switchBrowserToSession\(result\.sessionToken\)/);
    expect(CONFIRM).toMatch(/history\.replaceState/);
  });
});

describe('session cookie attributes', () => {
  it('uses the __Host- prefix in production and still reads the legacy cookie', () => {
    expect(SESSION).toMatch(/SESSION_COOKIE = IS_PRODUCTION \? '__Host-tg_session' : 'tg_session'/);
    expect(SESSION).toMatch(/LEGACY_SESSION_COOKIE = 'tg_uid'/);
    expect(SESSION).toMatch(/store\.get\(LEGACY_SESSION_COOKIE\)/);
  });

  it('HttpOnly, Secure in production, SameSite=Lax, Path=/, and never a Domain attribute', () => {
    const opts = SESSION.slice(SESSION.indexOf('function cookieOptions'), SESSION.indexOf('export function readSessionToken'));
    expect(opts).toMatch(/httpOnly: true/);
    expect(opts).toMatch(/secure: IS_PRODUCTION/);
    expect(opts).toMatch(/sameSite: 'lax'/);
    expect(opts).toMatch(/path: '\/'/);
    expect(codeOnly(SESSION)).not.toMatch(/domain:/i);
  });

  it('setting the session cookie removes the legacy one (no duplicate cookies)', () => {
    const set = SESSION.slice(SESSION.indexOf('export function setSessionCookie'));
    expect(set.slice(0, 300)).toMatch(/store\.delete\(LEGACY_SESSION_COOKIE\)/);
  });

  it('logout expires the cookie with its original attributes (a __Host- delete without Secure is ignored by browsers)', () => {
    const clear = SESSION.slice(SESSION.indexOf('export function clearSessionCookies'));
    expect(clear.slice(0, 300)).toMatch(/store\.set\(SESSION_COOKIE, '', \{ \.\.\.cookieOptions\(\), maxAge: 0 \}\)/);
    expect(clear.slice(0, 300)).not.toMatch(/store\.delete\(SESSION_COOKIE\)/);
  });

  it('no client component ever touches a session token in web storage', () => {
    for (const source of [SIGN_IN_FLOW, CONFIRM, ACCOUNT_SECTION]) {
      expect(codeOnly(source)).not.toMatch(/localStorage|sessionStorage|document\.cookie/);
    }
  });
});

describe('sign-in is discoverable where it is naturally needed', () => {
  it('the main header and dashboard header both render the AccountButton', () => {
    expect(read('components/layout/Header.tsx')).toMatch(/<AccountButton initialStatus=\{initialAuth\} \/>/);
    expect(read('components/dashboard/DashboardHeader.tsx')).toMatch(/<AccountButton initialStatus=\{initialAuth\} \/>/);
  });

  it('every book access gate card offers sign-in', () => {
    const gate = read('components/books/BookAccessGate.tsx');
    expect((gate.match(/<SignInPrompt \/>/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it('both purchase pages offer sign-in', () => {
    expect(read('app/purchase/page.tsx')).toMatch(/<SignInPrompt /);
    expect(read('app/purchase/[productId]/page.tsx')).toMatch(/<SignInPrompt /);
  });

  it('settings links to /signin and the old "reset this device" workaround is gone', () => {
    expect(ACCOUNT_SECTION).toMatch(/signInHref\('\/settings'\)/);
    expect(ACCOUNT_SECTION.toLowerCase()).not.toMatch(/reset this device|separate session|handleresetdevice/);
    expect(existsSync('components/auth/SignInForm.tsx')).toBe(false);
  });

  it('the sign-in page validates returnTo and keeps the referrer private', () => {
    const page = read('app/signin/page.tsx');
    expect(page).toMatch(/safeReturnTo\(/);
    expect(page).toMatch(/referrer: 'no-referrer'/);
  });

  it('the sign-in flow uses the specified wording', () => {
    for (const text of [
      'Sign in to Truth Geomancer',
      'Email address',
      'Continue',
      'We’ll send you a verification code',
      'Check your email',
      'Enter the 6-digit code sent to',
      'Verify',
      'Resend code',
    ]) {
      expect(SIGN_IN_FLOW).toContain(text);
    }
  });
});

describe('purchase pages pass the server-known sign-in state (no blank entry point before hydration)', () => {
  it.each(['app/purchase/page.tsx', 'app/purchase/[productId]/page.tsx'])('%s', (path) => {
    const page = read(path);
    expect(page).toMatch(/const auth = \{ authenticated: Boolean\(user\?\.email\), email: user\?\.email \?\? null \};/);
    expect(page).toMatch(/<Header [^>]*initialAuth=\{auth\}/);
    expect(page).toMatch(/<SignInPrompt [^>]*initialStatus=\{auth\}/);
  });
});

describe('homepage passes the server-known sign-in state, without personal data', () => {
  it('app/page.tsx resolves the session and passes only the yes/no (the page is the offline shell)', () => {
    const page = read('app/page.tsx');
    expect(page).toMatch(/const initialAuth = \{ authenticated: Boolean\(user\?\.email\), email: null \};/);
    expect(page).toMatch(/<DashboardHeader initialAuth=\{initialAuth\} \/>/);
  });
});
