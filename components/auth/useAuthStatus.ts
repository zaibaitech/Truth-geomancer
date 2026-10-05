'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// Auth/session redesign: the one client-side read of "am I signed in?",
// always fresh from the server (no-store) and re-checked on every route
// change and when the tab regains focus, so the UI never shows a stale
// signed-in/out state after sign-in, sign-out or a sign-in on another tab.
// Returns only {authenticated, email} — never an id or a token.
export interface AuthStatus {
  authenticated: boolean;
  email: string | null;
}

// `initial` lets a Server Component that already resolved the session pass it
// in, so the first (server-rendered) HTML shows the right state immediately
// instead of nothing until the client-side check completes. The live check
// still runs and replaces it.
export function useAuthStatus(initial: AuthStatus | null = null): AuthStatus | null {
  const pathname = usePathname();
  const [status, setStatus] = useState<AuthStatus | null>(initial);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch('/api/auth/status', { cache: 'no-store', credentials: 'same-origin' })
        .then((r) => (r.ok ? r.json() : { authenticated: false, email: null }))
        .then((s: AuthStatus) => {
          if (!cancelled) setStatus({ authenticated: Boolean(s.authenticated), email: s.email ?? null });
        })
        .catch(() => {
          if (!cancelled) setStatus((prev) => prev ?? { authenticated: false, email: null });
        });
    load();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, [pathname]);

  return status;
}
