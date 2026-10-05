'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';

/**
 * Finishes a magic-link sign-in (auth/session redesign). The emailed link's
 * token arrives in the URL FRAGMENT (#token=…), which is never sent to any
 * server or included in a Referer header; it is removed from the address bar
 * immediately. Nothing is consumed until the person presses Continue, so an
 * email scanner opening the link can no longer burn it.
 */
const REASONS: Record<string, string> = {
  'missing-token': 'This sign-in link is incomplete. Request a new one.',
  'not-found': 'This sign-in link isn’t valid. Request a new one.',
  expired: 'This sign-in link has expired. Request a new one.',
  used: 'This sign-in link has already been used. Request a new one.',
  conflict: 'We can’t sign you in automatically — please contact us so we can sort out your account.',
  'rate-limited': 'Too many attempts. Please wait a little and try again.',
};

export function ConfirmSignIn() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only ever SET the token: the hash is stripped below, so a second run
    // of this effect (React strict mode) must not overwrite it with null.
    const match = window.location.hash.match(/token=([A-Za-z0-9_-]+)/);
    if (match) setToken(match[1]);
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
    setReady(true);
  }, []);

  async function confirm() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({ token }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; reason?: string };
      if (data.ok) {
        window.location.replace('/settings?verified=1');
        return;
      }
      setError(REASONS[data.reason ?? ''] ?? 'That sign-in link could not be used. Request a new one.');
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    }
    setBusy(false);
  }

  if (!ready) return null;

  return (
    <Card>
      {token && !error ? (
        <>
          <h2 className="type-section font-semibold text-sand-light">Finish signing in</h2>
          <p className="mt-1.5 type-body text-sand/70">Continue to sign in to Truth Geomancer on this device.</p>
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className="mt-4 min-h-[48px] w-full rounded-xl bg-clay px-4 py-2.5 type-body font-semibold text-ink disabled:opacity-50"
          >
            {busy ? 'Signing in…' : 'Continue'}
          </button>
        </>
      ) : (
        <>
          <h2 className="type-section font-semibold text-sand-light">This link can’t be used</h2>
          <p role="alert" className="mt-1.5 type-body text-sand/70">
            {error ?? REASONS['missing-token']}
          </p>
          <Link
            href="/signin"
            className="mt-4 flex min-h-[48px] items-center justify-center rounded-xl bg-clay px-4 py-2.5 type-body font-semibold text-ink"
          >
            Sign in with a code
          </Link>
        </>
      )}
    </Card>
  );
}
