'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { signInHref } from '@/lib/auth/returnTo';

// Prompt 46: the client-visible account state is ONLY {authenticated,
// email} — see app/api/auth/status/route.ts's own comment. This
// component never sees or stores a userId, a session token, or any
// entitlement detail.
//
// Auth/session redesign: signing in happens on /signin (email + 6-digit
// code), which always switches THIS browser to the verified account — no
// per-device workaround is ever needed.
interface Status {
  authenticated: boolean;
  email: string | null;
}

export function AccountSection() {
  const [status, setStatus] = useState<Status | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);

  useEffect(() => {
    fetch('/api/auth/status', { cache: 'no-store', credentials: 'same-origin' })
      .then((res) => res.json())
      .then((body: Status) => setStatus(body))
      .catch(() => setStatus({ authenticated: false, email: null }));

    // One-time banner after a magic-link sign-in. Read directly from the URL
    // rather than useSearchParams(), which would force this page into a
    // Suspense boundary for a single, non-reactive read on mount.
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === '1') {
      setBanner('You’re signed in.');
      params.delete('verified');
      const next = params.toString();
      window.history.replaceState(null, '', next ? `${window.location.pathname}?${next}` : window.location.pathname);
    }
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError(false);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin', cache: 'no-store' });
      if (!res.ok) throw new Error('logout failed');
      // A full reload so every server-rendered part of the page (book access,
      // purchases) is fetched again without the old session.
      window.location.reload();
    } catch {
      setLogoutError(true);
      setLoggingOut(false);
    }
  }

  return (
    <div>
      {banner ? <p className="mb-3 type-body text-clay-light">{banner}</p> : null}

      {status === null ? (
        <div className="min-h-[48px]" aria-hidden="true" />
      ) : status.authenticated ? (
        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="type-body font-semibold text-sand-light">Signed in</p>
              <p className="break-all type-meta text-sand/65">{status.email}</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="min-h-[44px] shrink-0 rounded-lg border border-sand/15 px-3.5 py-2 type-body text-sand/70 disabled:opacity-50"
            >
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
          <p className="mt-2 type-meta text-sand/65">Signing out here doesn’t sign out your other devices.</p>
          {logoutError ? (
            <p role="alert" className="mt-2 type-body text-red-400">
              Could not sign out. Check your connection and try again.
            </p>
          ) : null}
        </div>
      ) : (
        <div>
          <p className="type-body text-sand-light">Sign in to keep your purchases with you on any device.</p>
          <Link
            href={signInHref('/settings')}
            className="mt-3 flex min-h-[48px] items-center justify-center rounded-xl bg-clay px-4 py-2.5 type-body font-semibold text-ink"
          >
            Sign in
          </Link>
        </div>
      )}
    </div>
  );
}
