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
  conflict: 'We couldn’t automatically sign you in with that email — this device has its own separate session.',
  'already-linked': 'That device is already linked to a different email.',
  'rate-limited': 'Too many attempts. Please wait and try again shortly.',
};

export function AccountSection() {
  const [status, setStatus] = useState<Status | null>(null);
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  // Only 'conflict' has a self-service recovery — see handleResetDevice's
  // comment. Every other reason (expired/used/rate-limited/etc.) is not a
  // device-identity problem, so no reset button is offered for those.
  const [showDeviceReset, setShowDeviceReset] = useState(false);
  const [resettingDevice, setResettingDevice] = useState(false);
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
      setShowDeviceReset(reason === 'conflict');
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

  // A 'conflict' error means THIS device's own anonymous session (created
  // by ordinary browsing before signing in) doesn't match the account that
  // email already belongs to — see the server-side login-token consumer's
  // own reasoning for the full explanation. The fix needs no new server
  // route: /api/auth/logout already does exactly the one thing required —
  // clear this browser's session cookie, touching nothing in the database
  // — since a login only ever reads that cookie, never writes to it.
  // Clearing it here means the NEXT sign-in link this device requests
  // carries no anonymous identity to conflict with, so it resolves
  // straight to the existing account.
  async function handleResetDevice() {
    setResettingDevice(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setShowDeviceReset(false);
      setBanner({
        kind: 'success',
        text: 'This device has been reset. Enter your email below to request a fresh sign-in link.',
      });
    } finally {
      setResettingDevice(false);
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

      {showDeviceReset ? (
        <div className="mb-3 rounded-xl border border-sand/15 bg-ink px-3.5 py-3">
          <p className="type-body text-sand/70">
            This browser has its own separate, unsigned-in session — that’s what’s blocking the link, not your email.
            Resetting it only affects this browser; it won’t delete any account or purchase.
          </p>
          <button
            onClick={handleResetDevice}
            disabled={resettingDevice}
            className="mt-3 min-h-[40px] rounded-lg border border-sand/15 px-3.5 py-2 type-body text-sand-light disabled:opacity-50"
          >
            {resettingDevice ? 'Resetting…' : 'Reset this device and try again'}
          </button>
        </div>
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
