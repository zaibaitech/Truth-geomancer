// Safe post-sign-in destination (auth/session redesign, Phase 3). Pure, so
// both the sign-in page (client) and any server code use the same rule.
//
// Only a same-origin, absolute PATH is ever accepted — never a URL with a
// scheme or host, never a protocol-relative "//evil.example", never a
// backslash variant browsers normalise into one ("/\evil.example"), never an
// API route, and never the sign-in/auth pages themselves (no loops).
// Anything else falls back to DEFAULT_RETURN_TO. This closes open redirects.
// After signing in with no specific destination the person lands on the main
// dashboard. A destination that was asked for (e.g. the book they were trying
// to open) is still honoured — see safeReturnTo below.
export const DEFAULT_RETURN_TO = '/';

export function safeReturnTo(raw: string | null | undefined): string {
  if (typeof raw !== 'string') return DEFAULT_RETURN_TO;
  const value = raw.trim();
  if (value.length === 0 || value.length > 512) return DEFAULT_RETURN_TO;
  if (!value.startsWith('/')) return DEFAULT_RETURN_TO;
  if (value.startsWith('//') || value.startsWith('/\\')) return DEFAULT_RETURN_TO;
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return DEFAULT_RETURN_TO;
  let parsed: URL;
  try {
    parsed = new URL(value, 'https://placeholder.invalid');
  } catch {
    return DEFAULT_RETURN_TO;
  }
  if (parsed.origin !== 'https://placeholder.invalid') return DEFAULT_RETURN_TO;
  const path = parsed.pathname;
  if (path.startsWith('/api/') || path === '/signin' || path.startsWith('/signin/') || path.startsWith('/auth/')) {
    return DEFAULT_RETURN_TO;
  }
  return `${path}${parsed.search}${parsed.hash}`;
}

/** The sign-in page URL for a given destination. */
export function signInHref(returnTo: string): string {
  return `/signin?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`;
}
