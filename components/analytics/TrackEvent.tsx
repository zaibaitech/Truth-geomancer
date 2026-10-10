'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

/** Fires book_page_view once per mount. Book slug only. */
export function TrackBookPageView({ bookSlug }: { bookSlug: string }) {
  useEffect(() => {
    trackEvent('book_page_view', { book_slug: bookSlug });
  }, [bookSlug]);
  return null;
}

/** Fires purchase once per product per browser session after a verified success. */
export function TrackPurchase({ bookSlug, currency, value }: { bookSlug: string; currency?: string; value?: number }) {
  useEffect(() => {
    try {
      const key = `ga_purchase_${bookSlug}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // sessionStorage unavailable: still send once per mount.
    }
    trackEvent('purchase', { book_slug: bookSlug, ...(currency ? { currency } : {}), ...(value !== undefined ? { value } : {}) });
  }, [bookSlug, currency, value]);
  return null;
}
