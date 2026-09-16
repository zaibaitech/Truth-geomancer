// Tests for the explicit reader-initiated book cache (Prompt 23, section 19
// items 2, 11, 12, 13). Node's test environment has no `window`/`caches`,
// which is itself the case worth covering here: every function must behave
// safely (never throw, never falsely report success) when Cache Storage is
// unavailable — the same condition an SSR pass or an unsupported browser
// would hit.
import { describe, expect, it } from 'vitest';
import {
  bookCacheName,
  checkBookOfflineVersion,
  downloadBookForOfflineUse,
  downloadBookOffline,
  isBookAvailableOffline,
  readOfflineManifest,
  removeBookOffline,
} from './bookCache';

describe('bookCacheName — cache versioning (section 19 item 11)', () => {
  it('names each book its own cache, scoped by a version independent of the app shell', () => {
    expect(bookCacheName('kanzul-mikban')).toBe('tg-book-kanzul-mikban-v1');
    expect(bookCacheName('master-of-geomancy-vol-1')).toBe('tg-book-master-of-geomancy-vol-1-v1');
  });

  it('gives two different books two different cache names', () => {
    expect(bookCacheName('kanzul-mikban')).not.toBe(bookCacheName('master-of-geomancy-vol-1'));
  });
});

describe('isBookAvailableOffline — never claims availability it cannot verify (section 19 item 12)', () => {
  it('resolves false when Cache Storage is unavailable (e.g. no window), rather than throwing or assuming', async () => {
    await expect(isBookAvailableOffline('kanzul-mikban')).resolves.toBe(false);
  });
});

describe('downloadBookOffline — all-or-nothing result reporting', () => {
  it('reports ok:false with every URL as failed when Cache Storage is unavailable, never a false success', async () => {
    const result = await downloadBookOffline('kanzul-mikban', ['/books/kanzul-mikban', '/books/kanzul-mikban/read']);
    expect(result.ok).toBe(false);
    expect(result.failed).toEqual(['/books/kanzul-mikban', '/books/kanzul-mikban/read']);
  });

  it('reports ok:false for an empty URL list — nothing was actually cached', async () => {
    const result = await downloadBookOffline('kanzul-mikban', []);
    expect(result.ok).toBe(false);
    expect(result.failed).toEqual([]);
  });
});

describe('removeBookOffline — never throws when there is nothing to remove', () => {
  it('resolves cleanly when Cache Storage is unavailable', async () => {
    await expect(removeBookOffline('kanzul-mikban')).resolves.toBeUndefined();
  });

  it('also clears the local offline manifest entry, never leaving stale "available offline" metadata behind', async () => {
    await removeBookOffline('kanzul-mikban');
    expect(readOfflineManifest('kanzul-mikban')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Prompt 30 — entitlement-verified download / content versioning. Same
// "no window/caches/fetch-to-relative-URL available" environment as above
// — every function must fail safely (never claim success, never throw)
// rather than assuming a server round-trip that cannot happen here.
// ---------------------------------------------------------------------------
describe('downloadBookForOfflineUse — never caches anything without a real server verification first', () => {
  it('reports a network-error outcome (never ok:true) when the verification fetch itself cannot succeed', async () => {
    const result = await downloadBookForOfflineUse('kanzul-mikban', ['/books/kanzul-mikban/read']);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('network-error');
  });

  it('never writes an offline manifest entry when verification fails', async () => {
    await downloadBookForOfflineUse('kanzul-mikban', ['/books/kanzul-mikban/read']);
    expect(readOfflineManifest('kanzul-mikban')).toBeNull();
  });
});

describe('checkBookOfflineVersion — fails closed to "unknown", never falsely claims staleness or freshness', () => {
  it('resolves "unknown" when there is no local manifest to compare against', async () => {
    await expect(checkBookOfflineVersion('kanzul-mikban')).resolves.toBe('unknown');
  });
});
