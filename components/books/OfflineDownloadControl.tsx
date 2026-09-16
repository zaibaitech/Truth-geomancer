'use client';

import { useEffect, useState } from 'react';
import { Check, Download, RefreshCw } from 'lucide-react';
import {
  checkBookOfflineVersion,
  downloadBookForOfflineUse,
  isBookAvailableOffline,
  removeBookOffline,
  type OfflineDownloadFailureReason,
} from '@/lib/offline/bookCache';
import { offlineUrlsForBook } from '@/lib/offline/bookOfflineUrls';

type Status = 'checking' | 'available' | 'update-available' | 'unavailable' | 'downloading' | 'error';

const ERROR_MESSAGE: Record<OfflineDownloadFailureReason, string> = {
  unauthorized: 'Offline download requires an active entitlement for this book.',
  'not-found': 'Offline download could not be completed.',
  'network-error': 'Offline download could not be completed.',
  'partial-failure': 'Offline download could not be completed.',
};

/**
 * "Download for offline" / "Available offline" (Prompt 23; Prompt 30
 * extends it with server-verified entitlement and content versioning).
 * Never claims a book is available offline unless its cache actually
 * exists — checked on mount, not assumed from the fact that the page
 * itself rendered. Reuses `offlineUrlsForBook`, so the exact set of URLs
 * downloaded is the one source of truth this and the reader both agree on.
 *
 * `entitled` is computed SERVER-SIDE by the caller (the book detail page)
 * — this component never decides access itself, and the actual download
 * call (`downloadBookForOfflineUse`) independently re-verifies entitlement
 * server-side too (Phase 20's "only show when entitled" is a UI courtesy;
 * the real authorization check happens at download time regardless).
 * Renders nothing at all when `entitled` is false — the caller is
 * responsible for routing an unentitled visitor toward the purchase flow.
 */
export function OfflineDownloadControl({ bookId, entitled }: { bookId: string; entitled: boolean }) {
  const [status, setStatus] = useState<Status>('checking');
  const [isOnline, setIsOnline] = useState(true);
  const [failedCount, setFailedCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!entitled) return;
    setIsOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    let cancelled = false;
    isBookAvailableOffline(bookId).then(async (available) => {
      if (cancelled) return;
      if (!available) {
        setStatus('unavailable');
        return;
      }
      setStatus('available');
      // Version check is best-effort and online-only — never blocks or
      // downgrades the "available offline" state on its own (Phase 14).
      const versionStatus = await checkBookOfflineVersion(bookId);
      if (!cancelled && versionStatus === 'update-available') setStatus('update-available');
    });

    return () => {
      cancelled = true;
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [bookId, entitled]);

  async function download() {
    setStatus('downloading');
    setErrorMessage(null);
    const result = await downloadBookForOfflineUse(bookId, offlineUrlsForBook(bookId));
    if (result.ok) {
      setStatus('available');
      setFailedCount(0);
    } else {
      setStatus('error');
      setFailedCount(result.failed.length);
      setErrorMessage(result.reason ? ERROR_MESSAGE[result.reason] : 'Offline download could not be completed.');
    }
  }

  async function removeOffline() {
    await removeBookOffline(bookId);
    setStatus('unavailable');
  }

  if (!entitled) return null;
  if (status === 'checking') return null;

  if (status === 'available' || status === 'update-available') {
    return (
      <div className="mt-3 flex min-h-[48px] items-center justify-between gap-2 rounded-xl border border-sand/15 px-4 py-3">
        <span role="status" className="flex items-center gap-1.5 type-body text-sand-light">
          <Check size={15} className="text-clay-light" aria-hidden /> Available offline
        </span>
        <div className="flex items-center gap-3">
          {status === 'update-available' && isOnline ? (
            <button
              type="button"
              onClick={download}
              className="flex min-h-[40px] items-center gap-1 type-meta text-clay-light underline underline-offset-2"
            >
              <RefreshCw size={13} aria-hidden /> Update
            </button>
          ) : null}
          <button
            type="button"
            onClick={removeOffline}
            className="min-h-[40px] type-meta text-sand/65 underline underline-offset-2"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  if (status === 'downloading') {
    return (
      <p role="status" className="mt-3 min-h-[48px] rounded-xl border border-sand/15 px-4 py-3 text-center type-body text-sand/70">
        Preparing for offline reading…
      </p>
    );
  }

  if (!isOnline) {
    return (
      <p className="mt-3 type-meta text-sand/65">
        This book hasn’t been downloaded for offline use yet. Connect to the internet to download it.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={download}
        className="flex min-h-[48px] w-full items-center justify-center gap-1.5 rounded-xl border border-sand/15 py-3 type-body font-semibold text-sand-light"
      >
        <Download size={16} aria-hidden /> Download for offline
      </button>
      {status === 'error' ? (
        <p className="mt-1.5 type-meta text-sand/65">
          {errorMessage} {failedCount > 0 ? `(${failedCount} of ${offlineUrlsForBook(bookId).length} pages)` : ''}
        </p>
      ) : null}
    </div>
  );
}
