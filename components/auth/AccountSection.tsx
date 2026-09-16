'use client';

import { useEffect, useState } from 'react';
import { SignInForm } from './SignInForm';

// Prompt 46: the client-visible account state is ONLY {authenticated,
// email} — see app/api/auth/status/route.ts's own comment. This
// component never sees or stores a userId, a session token, or any
// entitlement detail.
interface Status {
  authenticated: boolean;
  email: string | null;
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'missing-token': 'That sign-in link is missing its token.',
  'not-found': 'That sign-in link is invalid.',
  expired: 'That sign-in link has expired. Request a new one below.',
  used: 'That sign-in link has already been used. Request a new one below.',
  conflict: 'We couldn’t automatically sign you in with that email — please contact support.',
  'already-linked': 'That device is already linked to a different email.',
};

export function AccountSection() {
  const [status, setStatus] = useState<Status | null>(null);
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  async function refreshStatus() {
    const res = await fetch('/api/auth/status', { cache: 'no-store' });
    const body = (await res.json().catch(() => ({ authenticated: false, email: null }))) as Status;
    setStatus(body);
  }

  useEffect(() => {
    refreshStatus();

    // One-time banner from the magic-link verify redirect. Read directly
    // from the URL rather than useSearchParams(), which would force this
    // statically-rendered page into a Suspense boundary just for a
    // single, non-reactive read on mount.
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === '1') {
      setBanner({ kind: 'success', text: 'You’re signed in.' });
    } else if (params.get('auth_error')) {
      const reason = params.get('auth_error') ?? '';
      setBanner({ kind: 'error', text: AUTH_ERROR_MESSAGES[reason] ?? 'That sign-in link could not be used.' });
    }
    if (params.has('verified') || params.has('auth_error')) {
      params.delete('verified');
      params.delete('auth_error');
      const next = params.toString();
      window.history.replaceState(null, '', next ? `${window.location.pathname}?${next}` : window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setLoggingOut(false);
      await refreshStatus();
    }
  }

  return (
    <div>
      {banner ? (
        <p className={`mb-3 type-body ${banner.kind === 'success' ? 'text-clay-light' : 'text-red-400'}`}>
          {banner.text}
        </p>
      ) : null}

      {status === null ? null : status.authenticated ? (
        <div className="flex items-center justify-between">
          <div>
            <p className="type-body font-semibold text-sand-light">Signed in</p>
            <p className="type-meta text-sand/65">{status.email}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="min-h-[40px] rounded-lg border border-sand/15 px-3.5 py-2 type-body text-sand/70 disabled:opacity-50"
          >
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      ) : (
        <div>
          <p className="type-body text-sand-light">Sign in to keep your purchases with you on any device.</p>
          <SignInForm />
        </div>
      )}
    </div>
  );
}
