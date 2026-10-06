// After a successful sign-in the person lands on the dashboard ("/") instead of
// being left on the sign-in page; a signed-in visitor to /signin is sent on; and
// none of it can loop or become an open redirect.
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_RETURN_TO, safeReturnTo } from '@/lib/auth/returnTo';

const read = (p: string) => readFileSync(p, 'utf-8');

describe('default and requested destinations', () => {
  it('the default destination after sign-in is the dashboard "/"', () => {
    expect(DEFAULT_RETURN_TO).toBe('/');
    expect(safeReturnTo(null)).toBe('/');
    expect(safeReturnTo(undefined)).toBe('/');
    expect(safeReturnTo('')).toBe('/');
  });

  it('an explicitly requested same-origin destination is still honoured', () => {
    expect(safeReturnTo('/books/kanzul-mikban')).toBe('/books/kanzul-mikban');
    expect(safeReturnTo('/purchase/kanzul-mikban?x=1')).toBe('/purchase/kanzul-mikban?x=1');
  });

  it('can never point back at the sign-in or auth pages (no redirect loop) or off-site', () => {
    for (const bad of ['/signin', '/signin?returnTo=/signin', '/signin/', '/auth/confirm', '/api/auth/status', '//evil.example', 'https://evil.example', '/\\evil.example']) {
      const out = safeReturnTo(bad);
      expect(out).toBe('/');
      expect(out.startsWith('/signin')).toBe(false);
    }
  });
});

describe('redirect happens only from a confirmed verification', () => {
  const route = read('app/api/auth/verify-code/route.ts');
  const flow = read('components/auth/SignInFlow.tsx');

  it('the server returns redirectTo only after the code was consumed and the session switched', () => {
    const successReturn = route.indexOf('redirectTo: safeReturnTo(');
    expect(successReturn).toBeGreaterThan(route.indexOf('switchBrowserToSession(outcome.sessionToken)'));
    expect(route.indexOf("if (!outcome.ok)")).toBeLessThan(successReturn);
    expect(route).toMatch(/redirectTo: safeReturnTo\(typeof body\.returnTo === 'string' \? body\.returnTo : null\)/);
  });

  it('the client navigates only inside the success branch (res.ok and data.ok === true), never before', () => {
    const verifyFn = flow.slice(flow.indexOf('async function verify'), flow.indexOf('async function sendLinkInstead'));
    const guard = verifyFn.indexOf("if (!res.ok || res.data.ok !== true)");
    const nav = verifyFn.indexOf('goTo(target)');
    expect(guard).toBeGreaterThan(-1);
    expect(nav).toBeGreaterThan(guard);
    expect(verifyFn.slice(0, guard)).not.toMatch(/goTo\(|location\.replace/);
    // The one navigation helper is the only place that touches window.location.
    expect(flow.match(/window\.location\.replace\(/g)?.length).toBe(1);
  });

  it('shows a visible way forward if navigation is slow or blocked', () => {
    expect(flow).toContain('Signed in successfully');
    expect(flow).toContain('Continue to dashboard');
    expect(flow).toMatch(/<Link\s+href=\{target\}/);
    expect(flow).toMatch(/setStep\('signed-in'\)/);
  });

  it('navigates at most once and never to a page that could send the person back (loop guard)', () => {
    expect(flow).toMatch(/const navigated = useRef\(false\)/);
    expect(flow).toMatch(/if \(navigated\.current\) return;/);
  });
});

// --- the /signin page for someone who is already signed in --------------------
const redirectMock = vi.fn((to: string) => {
  throw new Error(`NEXT_REDIRECT:${to}`);
});
const authState = { authenticated: false, email: null as string | null };

vi.mock('next/navigation', () => ({ redirect: (to: string) => redirectMock(to) }));
vi.mock('@/lib/server/emailSession', () => ({ getAuthenticatedUser: async () => authState }));
vi.mock('@/lib/server/db', () => ({ getDb: () => ({}) }));
vi.mock('@/lib/server/auth/pendingChallenge', () => ({ getCurrentChallengeView: async () => null }));
vi.mock('@/components/layout/Header', () => ({ Header: () => null }));
vi.mock('@/components/auth/SignInFlow', () => ({ SignInFlow: () => null }));

describe('/signin when already signed in', () => {
  beforeEach(() => {
    redirectMock.mockClear();
    authState.authenticated = false;
    authState.email = null;
  });

  it('redirects a signed-in visitor to "/" by default', async () => {
    authState.authenticated = true;
    authState.email = 'reader@example.com';
    const { default: SignInPage } = await import('@/app/signin/page');
    await expect(SignInPage({ searchParams: {} })).rejects.toThrow('NEXT_REDIRECT:/');
    expect(redirectMock).toHaveBeenCalledWith('/');
  });

  it('redirects to a requested safe destination, but never back to /signin (no loop)', async () => {
    authState.authenticated = true;
    const { default: SignInPage } = await import('@/app/signin/page');
    await expect(SignInPage({ searchParams: { returnTo: '/books/kanzul-mikban' } })).rejects.toThrow('NEXT_REDIRECT:/books/kanzul-mikban');
    await expect(SignInPage({ searchParams: { returnTo: '/signin' } })).rejects.toThrow('NEXT_REDIRECT:/');
    await expect(SignInPage({ searchParams: { returnTo: 'https://evil.example' } })).rejects.toThrow('NEXT_REDIRECT:/');
    expect(redirectMock.mock.calls.every(([to]) => !String(to).startsWith('/signin'))).toBe(true);
  });

  it('shows the sign-in form (no redirect) to a signed-out visitor', async () => {
    const { default: SignInPage } = await import('@/app/signin/page');
    const element = await SignInPage({ searchParams: {} });
    expect(element).toBeTruthy();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe('sign-out and protected routes are untouched', () => {
  it('logout still revokes the session server-side', () => {
    const logout = read('app/api/auth/logout/route.ts');
    expect(logout).toMatch(/revokeCurrentSession\(\)/);
    expect(logout).toMatch(/isSameOriginRequest\(request\)/);
  });

  it('the redirect change adds no auth bypass: the verify-code route still requires a valid code', () => {
    const route = read('app/api/auth/verify-code/route.ts');
    expect(route).toMatch(/consumeSignInCode\(tx, normalized, code\)/);
  });
});
