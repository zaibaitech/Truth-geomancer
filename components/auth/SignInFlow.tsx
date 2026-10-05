'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useAuthStatus } from './useAuthStatus';

/**
 * Sign in to Truth Geomancer (auth/session redesign, Phase 3).
 *
 *   1. Email address -> Continue (a 6-digit code is emailed)
 *   2. Enter the code on THIS screen -> Verify -> back to where you were
 *
 * The code is typed here, so signing in never depends on an email link
 * opening in the right browser or installed app. A magic link stays
 * available as a fallback. Every message is generic: nothing here ever says
 * whether an email address has an account.
 */
type Step = 'email' | 'code' | 'link-sent';
const RESEND_COOLDOWN_SECONDS = 30;

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    cache: 'no-store',
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}

export function SignInFlow({ returnTo }: { returnTo: string }) {
  const status = useAuthStatus();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await postJson('/api/auth/start', { email });
      if (!res.ok) {
        setError(typeof res.data.error === 'string' ? res.data.error : 'Something went wrong. Please try again.');
        return;
      }
      setStep('code');
      setCode('');
      setCooldown(RESEND_COOLDOWN_SECONDS);
      if (e === undefined) setNotice('A new code is on its way. Only the newest code works.');
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await postJson('/api/auth/verify-code', { email, code, returnTo });
      if (!res.ok || res.data.ok !== true) {
        setError(typeof res.data.error === 'string' ? res.data.error : 'That code could not be used.');
        setBusy(false);
        return;
      }
      // A full navigation, not a client-side route change: every server-
      // rendered page is then fetched fresh with the new session cookie.
      window.location.replace(typeof res.data.redirectTo === 'string' ? res.data.redirectTo : returnTo);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setBusy(false);
    }
  }

  async function sendLinkInstead() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await postJson('/api/auth/request-link', { email });
      if (!res.ok) {
        setError(typeof res.data.error === 'string' ? res.data.error : 'Something went wrong. Please try again.');
        return;
      }
      setStep('link-sent');
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  if (status?.authenticated) {
    return (
      <Card>
        <p className="type-body font-semibold text-sand-light">You’re signed in</p>
        <p className="mt-1 type-body text-sand/70">as {status.email}</p>
        <Link
          href={returnTo}
          className="mt-4 flex min-h-[48px] items-center justify-center rounded-xl bg-clay px-4 py-2.5 type-body font-semibold text-ink"
        >
          Continue
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      {step === 'email' ? (
        <form onSubmit={sendCode} noValidate={false}>
          <h2 className="type-section font-semibold text-sand-light">Sign in to Truth Geomancer</h2>
          <label htmlFor="signin-email" className="mt-4 block type-label text-sand/65">
            Email address
          </label>
          <input
            id="signin-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-sand/15 bg-ink px-3.5 py-3 type-body text-sand-light"
          />
          {error ? (
            <p role="alert" className="mt-2 type-body text-red-400">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy || email.trim().length === 0}
            className="mt-4 min-h-[48px] w-full rounded-xl bg-clay px-4 py-2.5 type-body font-semibold text-ink disabled:opacity-50"
          >
            {busy ? 'Sending…' : 'Continue'}
          </button>
          <p className="mt-3 type-meta text-sand/65">We’ll send you a verification code. No password needed.</p>
        </form>
      ) : null}

      {step === 'code' ? (
        <form onSubmit={verify}>
          <h2 className="type-section font-semibold text-sand-light">Check your email</h2>
          <p className="mt-1.5 type-body text-sand/70">
            Enter the 6-digit code sent to <span className="break-all font-semibold text-sand-light">{email}</span>
          </p>
          <label htmlFor="signin-code" className="mt-4 block type-label text-sand/65">
            Verification code
          </label>
          <input
            id="signin-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="mt-1 w-full rounded-xl border border-sand/15 bg-ink px-3.5 py-3 text-center font-mono text-2xl tracking-[0.5em] text-sand-light"
          />
          {error ? (
            <p role="alert" className="mt-2 type-body text-red-400">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p role="status" className="mt-2 type-body text-clay-light">
              {notice}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className="mt-4 min-h-[48px] w-full rounded-xl bg-clay px-4 py-2.5 type-body font-semibold text-ink disabled:opacity-50"
          >
            {busy ? 'Checking…' : 'Verify'}
          </button>
          <div className="mt-4 space-y-2 text-center">
            <p className="type-meta text-sand/65">Didn’t receive it? Check spam, or</p>
            <button
              type="button"
              onClick={() => sendCode()}
              disabled={busy || cooldown > 0}
              className="min-h-[44px] rounded-lg border border-sand/15 px-4 py-2 type-body text-sand-light disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
            </button>
            <div>
              <button
                type="button"
                onClick={sendLinkInstead}
                disabled={busy}
                className="min-h-[44px] type-meta text-clay-light underline underline-offset-2 disabled:opacity-50"
              >
                Email me a sign-in link instead
              </button>
            </div>
            <div>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setError(null);
                  setNotice(null);
                }}
                className="min-h-[44px] type-meta text-sand/65 underline underline-offset-2"
              >
                Use a different email
              </button>
            </div>
          </div>
        </form>
      ) : null}

      {step === 'link-sent' ? (
        <div>
          <h2 className="type-section font-semibold text-sand-light">Check your email</h2>
          <p className="mt-1.5 type-body text-sand/70">
            If that email can be used for an account, we’ve sent a sign-in link to{' '}
            <span className="break-all font-semibold text-sand-light">{email}</span>. Open it on this device to finish.
          </p>
          <button
            type="button"
            onClick={() => setStep('code')}
            className="mt-4 min-h-[44px] type-meta text-clay-light underline underline-offset-2"
          >
            Use a code instead
          </button>
        </div>
      ) : null}
    </Card>
  );
}
