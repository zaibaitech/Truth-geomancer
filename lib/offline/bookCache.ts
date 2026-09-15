// Explicit, reader-initiated book caching (Prompt 23 — offline-first
// audit). This writes directly into the browser's Cache Storage — the same
// storage the service worker (public/sw.js) reads from via caches.match()
// — so a reader's own download choice is never silently expanded or
// shrunk by the worker's own background runtime caching. There is no
// server round-trip involved beyond the ordinary same-origin page/asset
// requests already needed to render these pages once.
//
// One cache per book, named and versioned independently of the shell/
// runtime caches in sw.js: bumping BOOK_CACHE_VERSION here retires every
// reader's existing download (they simply see "not downloaded" again and
// can re-download the current content) without touching the app shell's
// own versioning, and vice versa.
const BOOK_CACHE_VERSION = 'v1';

export function bookCacheName(bookId: string): string {
  return `tg-book-${bookId}-${BOOK_CACHE_VERSION}`;
}

function cachesAvailable(): boolean {
  return typeof window !== 'undefined' && 'caches' in window;
}

/** Whether this exact book's current-version cache exists. Never claims a
 * book is available offline based on the app shell or runtime cache alone
 * — only an explicit, completed download counts. */
export async function isBookAvailableOffline(bookId: string): Promise<boolean> {
  if (!cachesAvailable()) return false;
  try {
    const names = await caches.keys();
    return names.includes(bookCacheName(bookId));
  } catch {
    return false;
  }
}

export interface DownloadBookResult {
  ok: boolean;
  /** URLs that failed to fetch or cache — non-empty only when `ok` is false. */
  failed: string[];
}

/** Fetches and caches every URL a book needs to be read and practiced with
 * no network access afterward. Always fetches fresh (never reuses a stale
 * cache entry mid-download), and — deliberately — does not partially
 * "succeed": if any URL fails, the whole download is reported as failed
 * (`ok: false`) so the UI never claims a book is available offline when
 * part of it is missing. Whatever DID cache successfully is left in place
 * rather than rolled back, so a retry only needs to re-fetch the URLs that
 * actually failed. */
export async function downloadBookOffline(bookId: string, urls: string[]): Promise<DownloadBookResult> {
  if (!cachesAvailable()) return { ok: false, failed: urls };
  if (urls.length === 0) return { ok: false, failed: [] };

  try {
    const cache = await caches.open(bookCacheName(bookId));
    const failed: string[] = [];
    await Promise.all(
      urls.map(async (url) => {
        try {
          const response = await fetch(url, { cache: 'no-store' });
          if (response.ok) {
            await cache.put(url, response.clone());
          } else {
            failed.push(url);
          }
        } catch {
          failed.push(url);
        }
      }),
    );
    return { ok: failed.length === 0, failed };
  } catch {
    return { ok: false, failed: urls };
  }
}

/** Deletes exactly this book's cache — never touches another book's, the
 * app shell, or the runtime cache. */
export async function removeBookOffline(bookId: string): Promise<void> {
  if (!cachesAvailable()) return;
  try {
    await caches.delete(bookCacheName(bookId));
  } catch {
    // Nothing more to do; the cache either wasn't there or couldn't be
    // opened — either way there is nothing left to report as "removed".
  }
}
