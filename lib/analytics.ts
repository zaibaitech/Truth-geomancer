// Google Analytics 4 (privacy-restricted). Only page views (origin + pathname,
// never query strings) and four named events are ever sent. Never pass
// questions, form inputs, emails, names, payment references or IDs here.
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-MTFBV3L25B';

// Paths where GA never sends anything.
const EXCLUDED_PREFIXES = ['/admin', '/api', '/auth'];

export function isAnalyticsExcludedPath(pathname: string | null | undefined): boolean {
  if (!pathname) return true;
  return EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Origin + pathname only: drops ?query and #hash (question text, Paystack refs). */
export function sanitizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return '';
  }
}

type Gtag = (...args: unknown[]) => void;

function gtag(): Gtag | null {
  if (typeof window === 'undefined') return null;
  const g = (window as unknown as { gtag?: Gtag }).gtag;
  return typeof g === 'function' ? g : null;
}

export function trackPageView(pathname: string): void {
  const g = gtag();
  if (!g || isAnalyticsExcludedPath(pathname)) return;
  g('event', 'page_view', {
    page_location: `${window.location.origin}${pathname}`,
    page_path: pathname,
    page_title: document.title,
  });
}

type EventMap = {
  free_cast_start: Record<string, never>;
  book_page_view: { book_slug: string };
  whatsapp_click: Record<string, never>;
  purchase: { book_slug: string; currency?: string; value?: number };
};

export function trackEvent<K extends keyof EventMap>(name: K, params?: EventMap[K]): void {
  try {
    const g = gtag();
    if (!g || isAnalyticsExcludedPath(window.location.pathname)) return;
    g('event', name, { ...(params ?? {}), page_location: sanitizeUrl(window.location.href) });
  } catch {
    // Analytics must never break the app.
  }
}
