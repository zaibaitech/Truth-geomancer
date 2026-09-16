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

// Prompt 30: content-version metadata lives alongside the cache, not the
// protected text itself — see offlineManifest.ts for why it is
// deliberately unsigned local metadata, never an authorization credential.
import { readOfflineManifest, removeOfflineManifest, writeOfflineManifest } from './offlineManifest';
export { readOfflineManifest, type OfflineManifestEntry } from './offlineManifest';

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
 * app shell, or the runtime cache. Also clears this book's local offline
 * manifest entry (Prompt 30) — removing a book's offline copy should leave
 * no stale "available offline" metadata behind either. Never touches
 * entitlement, payment history, or any other book's data (Phase 22). */
export async function removeBookOffline(bookId: string): Promise<void> {
  removeOfflineManifest(bookId);
  if (!cachesAvailable()) return;
  try {
    await caches.delete(bookCacheName(bookId));
  } catch {
    // Nothing more to do; the cache either wasn't there or couldn't be
    // opened — either way there is nothing left to report as "removed".
  }
}

// ---------------------------------------------------------------------------
// Prompt 30 — entitlement-verified download, content versioning
// ---------------------------------------------------------------------------

export type OfflineDownloadFailureReason = 'unauthorized' | 'not-found' | 'network-error' | 'partial-failure';

export interface OfflineDownloadOutcome {
  ok: boolean;
  reason?: OfflineDownloadFailureReason;
  /** URLs that failed to cache — only populated for 'partial-failure'. */
  failed: string[];
}

/**
 * The real "Download for offline" entry point (Prompt 30, Phase 5/9).
 * Verifies entitlement SERVER-SIDE first, via the protected
 * /api/books/:bookId/offline endpoint — never trusting the caller's own
 * belief that the user is entitled (that belief only decided whether to
 * SHOW the download button; this call is the actual authorization check).
 * Only on a real 200 does it proceed to cache the book's pages (reusing
 * the existing, unmodified downloadBookOffline()) and record the
 * resulting content version in the local manifest. A 403/404/network
 * failure here never touches Cache Storage at all — no gate-page content,
 * no partial book, is ever written for a request that wasn't authorized.
 */
export async function downloadBookForOfflineUse(bookId: string, urls: string[]): Promise<OfflineDownloadOutcome> {
  let verify: Response;
  try {
    verify = await fetch(`/api/books/${bookId}/offline`, { cache: 'no-store' });
  } catch {
    return { ok: false, reason: 'network-error', failed: urls };
  }

  if (verify.status === 403) return { ok: false, reason: 'unauthorized', failed: urls };
  if (verify.status === 404) return { ok: false, reason: 'not-found', failed: urls };
  if (!verify.ok) return { ok: false, reason: 'network-error', failed: urls };

  let contentVersion: string;
  try {
    const data = (await verify.json()) as { contentVersion?: unknown };
    if (typeof data.contentVersion !== 'string') return { ok: false, reason: 'network-error', failed: urls };
    contentVersion = data.contentVersion;
  } catch {
    return { ok: false, reason: 'network-error', failed: urls };
  }

  const result = await downloadBookOffline(bookId, urls);
  if (!result.ok) return { ok: false, reason: 'partial-failure', failed: result.failed };

  writeOfflineManifest({ bookId, contentVersion, authorizedAt: new Date().toISOString(), accessType: 'entitled' });
  return { ok: true, failed: [] };
}

export type BookVersionStatus = 'up-to-date' | 'update-available' | 'unknown';

/**
 * Compares the locally cached content version against the server's
 * current one (Prompt 30, Phase 7/14). Requires network — if it cannot be
 * reached, or the user's entitlement no longer checks out (403), this
 * resolves 'unknown' rather than erroring or claiming staleness: the
 * previously downloaded copy remains usable offline regardless (Phase 14
 * — "do not delete a user's valid offline copy merely because they are
 * temporarily offline" / Phase 15 — no speculative revocation).
 */
export async function checkBookOfflineVersion(bookId: string): Promise<BookVersionStatus> {
  const manifest = readOfflineManifest(bookId);
  if (!manifest) return 'unknown';
  try {
    const res = await fetch(`/api/books/${bookId}/offline`, { cache: 'no-store' });
    if (!res.ok) return 'unknown';
    const data = (await res.json()) as { contentVersion?: unknown };
    if (typeof data.contentVersion !== 'string') return 'unknown';
    return data.contentVersion === manifest.contentVersion ? 'up-to-date' : 'update-available';
  } catch {
    return 'unknown';
  }
}
