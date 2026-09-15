'use client';

import { useEffect, useState } from 'react';
import { Check, Download } from 'lucide-react';
import { downloadBookOffline, isBookAvailableOffline, removeBookOffline } from '@/lib/offline/bookCache';
import { offlineUrlsForBook } from '@/lib/offline/bookOfflineUrls';

type Status = 'checking' | 'available' | 'unavailable' | 'downloading' | 'error';

/**
 * "Download for offline" / "Available offline" (Prompt 23). Never claims a
 * book is available offline unless its cache actually exists — checked on
 * mount, not assumed from the fact that the page itself rendered (which,
 * once this component's own JS chunk is cached, can happen offline too).
 * Reuses `offlineUrlsForBook`, so the exact set of URLs downloaded is the
 * one source of truth this and the eventual offline reader both agree on.
 */
export function OfflineDownloadControl({ bookId }: { bookId: string }) {
  const [status, setStatus] = useState<Status>('checking');
  const [isOnline, setIsOnline] = useState(true);
  const [failedCount, setFailedCount] = useState(0);

  useEffect(() => {
    setIsOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    let cancelled = false;
    isBookAvailableOffline(bookId).then((available) => {
      if (!cancelled) setStatus(available ? 'available' : 'unavailable');
    });

    return () => {
      cancelled = true;
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [bookId]);

  async function download() {
    setStatus('downloading');
    const result = await downloadBookOffline(bookId, offlineUrlsForBook(bookId));
    if (result.ok) {
      setStatus('available');
      setFailedCount(0);
    } else {
      setStatus('error');
      setFailedCount(result.failed.length);
    }
  }

  async function removeOffline() {
    await removeBookOffline(bookId);
    setStatus('unavailable');
  }

  if (status === 'checking') return null;

  if (status === 'available') {
    return (
      <div className="mt-3 flex min-h-[48px] items-center justify-between gap-2 rounded-xl border border-sand/15 px-4 py-3">
        <span role="status" className="flex items-center gap-1.5 type-body text-sand-light">
          <Check size={15} className="text-clay-light" aria-hidden /> Available offline
        </span>
        <button
          type="button"
          onClick={removeOffline}
          className="min-h-[40px] type-meta text-sand/65 underline underline-offset-2"
        >
          Remove
        </button>
      </div>
    );
  }

  if (status === 'downloading') {
    return (
      <p role="status" className="mt-3 min-h-[48px] rounded-xl border border-sand/15 px-4 py-3 text-center type-body text-sand/70">
        Downloading for offline…
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
          {failedCount} of {offlineUrlsForBook(bookId).length} pages couldn’t be saved — try again.
        </p>
      ) : null}
    </div>
  );
}
