// Resumable 6-digit sign-in: the code screen survives a refresh or a trip to the
// email app, without re-sending, without storing the code on the client, and
// without weakening single-use / expiry / attempt limits.
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from './db';
import {
  CODE_TTL_MS,
  MAX_ATTEMPTS_PER_CODE,
  consumeSignInCode,
  createSignInChallenge,
  createSignInCode,
} from './auth/emailCodes';
import { decodePendingChallenge, decoyChallenge, encodePendingChallenge, resolveChallengeView } from './auth/pendingChallenge';
import { SignInFlow } from '@/components/auth/SignInFlow';

(globalThis as { React?: typeof React }).React = React;

let db: Db | undefined;
afterEach(async () => {
  const open = db;
  db = undefined;
  await open?.close();
});
function fresh(): Db {
  db = openDatabase(':memory:');
  return db;
}
const EMAIL = 'reader@example.com';
const T0 = 1_800_000_000_000;
const read = (p: string) => readFileSync(p, 'utf-8');
const noComments = (src: string) =>
  src
    .split('\n')
    .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
    .join('\n');
const rowCount = async (d: Db) => Number((await d.queryOne<{ n: number }>('SELECT COUNT(*) AS n FROM email_verification_codes'))?.n);
const asCookie = (c: { challengeId: string; expiresAt: number }) => decodePendingChallenge(encodePendingChallenge({ ...c, email: EMAIL }))!;

describe('request code → remount / refresh → the code screen is restored', () => {
  it('the same cookie resolves to a pending challenge every time, and never creates or sends anything', async () => {
    const d = fresh();
    const ch = await createSignInChallenge(d, EMAIL, null, T0);
    const cookie = asCookie(ch);
    const before = await rowCount(d);
    for (let i = 0; i < 3; i++) {
      // each iteration = a remount or a full page refresh
      expect(await resolveChallengeView(d, cookie, T0 + 60_000)).toEqual({ state: 'pending', email: EMAIL, expiresAt: T0 + CODE_TTL_MS });
    }
    expect(await rowCount(d)).toBe(before); // restoring never issues another code
  });

  it('the server-rendered sign-in screen shows the code screen (not the email form) when a challenge is pending', () => {
    const html = renderToStaticMarkup(
      React.createElement(SignInFlow, { returnTo: '/', initialChallenge: { state: 'pending', email: EMAIL, expiresAt: Date.now() + 5 * 60_000 } }),
    );
    expect(html).toContain('Check your email');
    expect(html).toContain('Enter the 6-digit code sent to');
    expect(html).toContain(EMAIL);
    expect(html).not.toContain('Email address'); // no empty email form
  });

  it('with no pending challenge the email form is shown', () => {
    const html = renderToStaticMarkup(React.createElement(SignInFlow, { returnTo: '/', initialChallenge: null }));
    expect(html).toContain('Sign in to Truth Geomancer');
    expect(html).toContain('Email address');
    expect(html).not.toContain('Verification code');
  });
});

describe('expiry', () => {
  it('a challenge past its lifetime resolves to expired', async () => {
    const d = fresh();
    const ch = await createSignInChallenge(d, EMAIL, null, T0);
    expect((await resolveChallengeView(d, asCookie(ch), T0 + CODE_TTL_MS + 1)).state).toBe('expired');
  });

  it('the screen shows "Code expired" with a way to request a new code (server says expired, or its clock has run out)', () => {
    for (const challenge of [
      { state: 'expired' as const, email: EMAIL, expiresAt: Date.now() - 1000 },
      { state: 'pending' as const, email: EMAIL, expiresAt: Date.now() - 1000 },
    ]) {
      const html = renderToStaticMarkup(React.createElement(SignInFlow, { returnTo: '/', initialChallenge: challenge }));
      expect(html).toContain('Code expired');
      expect(html).toContain('Send a new code');
      expect(html).toContain('Use a different email');
      expect(html).not.toContain('Verification code'); // no code input for a dead code
    }
  });
});

describe('cancel and resend', () => {
  it('explicit cancel clears the server-side marker and returns to the email form', () => {
    const route = read('app/api/auth/challenge/route.ts');
    expect(route).toMatch(/export async function DELETE/);
    expect(route).toMatch(/isSameOriginRequest\(request\)/);
    expect(route).toMatch(/clearPendingChallengeCookie\(\)/);
    const flow = read('components/auth/SignInFlow.tsx');
    expect(flow).toMatch(/method: 'DELETE'/);
    expect(flow).toMatch(/onClick=\{cancelChallenge\}/);
    expect(flow).toMatch(/async function cancelChallenge\(\)[\s\S]*?setStep\('email'\)/);
    expect(read('lib/server/auth/pendingChallenge.ts')).toMatch(/maxAge: 0/);
  });

  it('resend issues a NEW challenge: the old one is superseded, the new one is pending, only one is live', async () => {
    const d = fresh();
    const first = await createSignInChallenge(d, EMAIL, null, T0);
    const second = await createSignInChallenge(d, EMAIL, null, T0 + 40_000);
    expect(second.challengeId).not.toBe(first.challengeId);
    expect((await resolveChallengeView(d, asCookie(first), T0 + 41_000)).state).toBe('expired');
    expect((await resolveChallengeView(d, asCookie(second), T0 + 41_000)).state).toBe('pending');
    expect(Number((await d.queryOne<{ n: number }>('SELECT COUNT(*) AS n FROM email_verification_codes WHERE used_at IS NULL AND superseded_at IS NULL'))?.n)).toBe(1);
  });

  it('"Send a new code" and "Resend" go through the same start endpoint (rate limits unchanged)', () => {
    const flow = read('components/auth/SignInFlow.tsx');
    expect(flow.match(/onClick=\{\(\) => sendCode\(\)\}/g)?.length).toBe(2);
    expect(read('app/api/auth/start/route.ts')).toMatch(/CODE_REQUEST_EMAIL_LIMIT/);
    expect(read('app/api/auth/start/route.ts')).toMatch(/CODE_REQUEST_IP_LIMIT/);
  });
});

describe('verification behaviour is unchanged', () => {
  it('a wrong code is rejected and the challenge stays pending until attempts run out', async () => {
    const d = fresh();
    const ch = await createSignInChallenge(d, EMAIL, null, T0);
    const wrong = ch.code === '000000' ? '111111' : '000000';
    await d.transaction(async (tx) => {
      expect(await consumeSignInCode(tx, EMAIL, wrong, T0 + 1000)).toEqual({ ok: false, reason: 'invalid' });
    });
    expect((await resolveChallengeView(d, asCookie(ch), T0 + 2000)).state).toBe('pending');
    for (let i = 1; i < MAX_ATTEMPTS_PER_CODE; i++) {
      await d.transaction(async (tx) => {
        await consumeSignInCode(tx, EMAIL, wrong, T0 + 3000);
      });
    }
    expect((await resolveChallengeView(d, asCookie(ch), T0 + 4000)).state).toBe('expired');
  });

  it('the right code works once, then the challenge is spent (single use)', async () => {
    const d2 = fresh();
    const ch2 = await createSignInChallenge(d2, 'two@example.com', null, T0);
    await d2.transaction(async (tx) => {
      expect(await consumeSignInCode(tx, 'two@example.com', ch2.code, T0 + 1000)).toMatchObject({ ok: true });
      expect(await consumeSignInCode(tx, 'two@example.com', ch2.code, T0 + 2000)).toEqual({ ok: false, reason: 'invalid' });
    });
    expect((await resolveChallengeView(d2, decodePendingChallenge(encodePendingChallenge({ challengeId: ch2.challengeId, expiresAt: ch2.expiresAt, email: 'two@example.com' }))!, T0 + 3000)).state).toBe('expired');
  });

  it('a successful sign-in still goes through the existing session path and clears the resume marker', () => {
    const route = read('app/api/auth/verify-code/route.ts');
    expect(route).toMatch(/consumeSignInCode\(tx, normalized, code\)/);
    expect(route).toMatch(/completeEmailSignIn\(/);
    expect(route).toMatch(/switchBrowserToSession\(outcome\.sessionToken\)[\s\S]*?clearPendingChallengeCookie\(\)/);
    expect(route).toMatch(/CODE_VERIFY_EMAIL_LIMIT/);
    expect(route).toMatch(/CODE_VERIFY_IP_LIMIT/);
  });

  it('createSignInCode still returns just the raw code and supersedes the previous one', async () => {
    const d = fresh();
    const a = await createSignInCode(d, EMAIL, null, T0);
    const b = await createSignInCode(d, EMAIL, null, T0 + 1000);
    expect(a).toMatch(/^\d{6}$/);
    expect(b).toMatch(/^\d{6}$/);
    expect(Number((await d.queryOne<{ n: number }>('SELECT COUNT(*) AS n FROM email_verification_codes WHERE superseded_at IS NULL AND used_at IS NULL'))?.n)).toBe(1);
  });
});

describe('the code is never stored on the client', () => {
  it('the resume cookie holds an opaque id, an expiry and the email — never the code', async () => {
    const d = fresh();
    const ch = await createSignInChallenge(d, EMAIL, null, T0);
    const value = encodePendingChallenge({ challengeId: ch.challengeId, expiresAt: ch.expiresAt, email: EMAIL });
    expect(value).not.toContain(ch.code);
    expect(Buffer.from(value.split('.')[2], 'base64url').toString()).toBe(EMAIL);
    expect(value.split('.')[0]).toBe(ch.challengeId);
  });

  it('no client code touches web storage, document.cookie or a URL for the code', () => {
    const flow = read('components/auth/SignInFlow.tsx').split('\n').filter((l) => !l.trim().startsWith('*') && !l.trim().startsWith('//')).join('\n');
    expect(flow).not.toMatch(/localStorage|sessionStorage|document\.cookie|indexedDB/);
    expect(flow).not.toMatch(/\?code=|[&?]otp=|location\.(hash|search)/);
    // The code only ever travels in the verify-code POST body.
    expect(flow.match(/postJson\([^)]*\bcode\b[^)]*/g)).toEqual(["postJson('/api/auth/verify-code', { email, code, returnTo }"]);
  });

  it('the status endpoint and the start response never return the code or the challenge id', () => {
    const challengeRoute = noComments(read('app/api/auth/challenge/route.ts'));
    expect(challengeRoute).not.toMatch(/\bcode\b\s*[:,}]/);
    expect(challengeRoute).not.toMatch(/challengeId/);
    const start = noComments(read('app/api/auth/start/route.ts'));
    expect(start).toMatch(/\{ \.\.\.GENERIC_RESPONSE, expiresAt/);
    expect(start).not.toMatch(/NextResponse\.json\([^)]*\bcode\b/);
  });
});

describe('the resume marker is tied to the requesting browser and reveals nothing', () => {
  it('is an HttpOnly, SameSite=Lax cookie (host-prefixed in production), not web storage', () => {
    const src = read('lib/server/auth/pendingChallenge.ts');
    expect(src).toMatch(/httpOnly: true/);
    expect(src).toMatch(/sameSite: 'lax'/);
    expect(src).toMatch(/__Host-tg_signin/);
  });

  it('rate-limited requests also set the cookie (decoy id), so the response stays identical to a real send', async () => {
    const start = read('app/api/auth/start/route.ts');
    expect(start).toMatch(/decoyChallenge\(normalized\)[\s\S]*?setPendingChallengeCookie\(decoy\)/);
    const d = fresh();
    const decoy = decoyChallenge(EMAIL, T0);
    expect(await resolveChallengeView(d, decoy, T0 + 1000)).toMatchObject({ state: 'pending', email: EMAIL });
    expect(await resolveChallengeView(d, decoy, T0 + CODE_TTL_MS + 1)).toMatchObject({ state: 'expired' });
    expect(await rowCount(d)).toBe(0);
  });

  it('a forged cookie naming someone else’s email never reveals that email’s real challenge', async () => {
    const d = fresh();
    const real = await createSignInChallenge(d, 'victim@example.com', null, T0);
    const forged = decodePendingChallenge(encodePendingChallenge({ challengeId: real.challengeId, expiresAt: T0 + 5, email: 'attacker@example.com' }))!;
    // No row matches (id, attacker email): the view follows the forger's own cookie, not the victim's row.
    expect(await resolveChallengeView(d, forged, T0 + 1000)).toEqual({ state: 'expired', email: 'attacker@example.com', expiresAt: T0 + 5 });
  });

  it('malformed or tampered cookies are ignored', () => {
    for (const bad of ['', 'x', 'a.b.c', `${'0'.repeat(8)}-0000-0000-0000-000000000000.12.!!`, 'a'.repeat(500)]) {
      expect(decodePendingChallenge(bad)).toBeNull();
    }
    expect(decodePendingChallenge(null)).toBeNull();
  });

  it('GET only reads: it never creates a code or sends email; both routes are no-store', () => {
    const route = read('app/api/auth/challenge/route.ts');
    const get = route.slice(route.indexOf('export async function GET'), route.indexOf('export async function DELETE'));
    expect(get).not.toMatch(/createSignInChallenge|createSignInCode|sendSignInCodeEmail|getEmailProvider/);
    expect((route.match(/NO_STORE_HEADERS/g) ?? []).length).toBeGreaterThanOrEqual(4);
  });

  it('the page restores state server-side and the client re-syncs without ever starting a code', () => {
    expect(read('app/signin/page.tsx')).toMatch(/getCurrentChallengeView\(getDb\(\)\)[\s\S]*initialChallenge=\{initialChallenge\}/);
    const flow = read('components/auth/SignInFlow.tsx');
    const effects = flow.slice(flow.indexOf('useEffect(() => {\n    let cancelled'), flow.indexOf('async function cancelChallenge'));
    expect(effects).toMatch(/\/api\/auth\/challenge/);
    expect(effects).not.toMatch(/\/api\/auth\/start|sendCode|request-link/);
  });

  it('logout clears the pending sign-in cookie (shared-device privacy) after revoking the session', () => {
    const route = read('app/api/auth/logout/route.ts');
    expect(route).toMatch(/await revokeCurrentSession\(\);[\s\S]*?clearPendingChallengeCookie\(\)/);
    // It clears with the cookie's original attributes (see cookieOptions), including the __Host- prefix rules.
    const helper = read('lib/server/auth/pendingChallenge.ts');
    expect(helper).toMatch(/cookies\(\)\.set\(PENDING_CHALLENGE_COOKIE, '', \{ \.\.\.cookieOptions\(\), maxAge: 0 \}\)/);
  });

  it('magic-link behaviour is untouched', () => {
    expect(read('components/auth/SignInFlow.tsx')).toMatch(/postJson\('\/api\/auth\/request-link', \{ email \}\)/);
  });
});
