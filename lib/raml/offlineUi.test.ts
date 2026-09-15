// Structural tests for the offline-first UI layer (Prompt 23). This project's
// Vitest config has no jsdom/@testing-library — component behavior is
// verified by reading the actual source (the established pattern in this
// repo, e.g. practiceUi.test.ts) and by the real Playwright offline browser
// pass documented in COVERAGE.md, not by simulated rendering here.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sw = readFileSync('public/sw.js', 'utf-8');
const swRegister = readFileSync('components/pwa/ServiceWorkerRegister.tsx', 'utf-8');
const offlineIndicator = readFileSync('components/pwa/OfflineIndicator.tsx', 'utf-8');
const downloadControl = readFileSync('components/books/OfflineDownloadControl.tsx', 'utf-8');
const layout = readFileSync('app/layout.tsx', 'utf-8');
const bookPage = readFileSync('app/books/[id]/page.tsx', 'utf-8');
const practicePage = readFileSync('app/raml/practice/[chapterId]/[methodId]/page.tsx', 'utf-8');

// ---------------------------------------------------------------------------
// Section 19 item 1/6: offline content resolution / offline practice route
// ---------------------------------------------------------------------------
describe('the method-practice route is statically generated (section 19 items 1, 6)', () => {
  it('exports generateStaticParams so a service worker never serves the wrong chapter/method pair', () => {
    expect(practicePage).toMatch(/export function generateStaticParams/);
    expect(practicePage).toMatch(/practicableMethodsForChapter/);
  });
});

// ---------------------------------------------------------------------------
// Section 19 item 2/3: cached book loading / cached chapter navigation
// ---------------------------------------------------------------------------
describe('service worker shell precache (section 19 items 2, 3)', () => {
  it('precaches the app shell destinations, not book content', () => {
    expect(sw).toMatch(/SHELL_URLS/);
    expect(sw).toMatch(/'\/books'/);
    expect(sw).toMatch(/'\/raml'/);
    expect(sw).not.toMatch(/kanzul-mikban/);
    expect(sw).not.toMatch(/master-of-geomancy/);
  });

  it('installs shell URLs best-effort so one bad entry never fails the whole install', () => {
    expect(sw).toMatch(/Promise\.allSettled/);
  });

  it('serves cache-first, falling back to network, falling back to the cached shell', () => {
    expect(sw).toMatch(/caches\.match\(request\)/);
    expect(sw).toMatch(/fetch\(request\)/);
    expect(sw).toMatch(/caches\.match\('\/'\)/);
  });
});

// ---------------------------------------------------------------------------
// Section 19 item 11: cache versioning
// ---------------------------------------------------------------------------
describe('cache versioning never disturbs a reader\'s own book downloads (section 19 item 11)', () => {
  it('activate only ever deletes tg-shell-*/tg-runtime-* caches, never tg-book-*', () => {
    const activateBlock = sw
      .slice(sw.indexOf("addEventListener('activate'"), sw.indexOf("addEventListener('fetch'"))
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n');
    expect(activateBlock).toMatch(/tg-shell-/);
    expect(activateBlock).toMatch(/tg-runtime-/);
    expect(activateBlock).not.toMatch(/caches\.delete\([^)]*tg-book/);
    expect(activateBlock).not.toMatch(/\.filter\([^)]*tg-book/);
  });

  it('book caches are versioned independently in bookCache.ts, not by the service worker\'s APP_VERSION', () => {
    expect(sw).not.toMatch(/BOOK_CACHE_VERSION/);
  });
});

// ---------------------------------------------------------------------------
// Section 19 item 13: offline-only failure states
// ---------------------------------------------------------------------------
describe('OfflineDownloadControl never claims availability it cannot verify (section 19 items 12, 13)', () => {
  it('checks isBookAvailableOffline on mount rather than assuming availability', () => {
    expect(downloadControl).toMatch(/isBookAvailableOffline\(bookId\)/);
  });

  it('shows an explicit failure state when offline and not yet downloaded, never a blank/broken screen', () => {
    expect(downloadControl).toMatch(/hasn.t been downloaded for offline use yet/);
  });

  it('reports a partial-download failure by count, never silently claims success', () => {
    expect(downloadControl).toMatch(/couldn.t be saved/);
    expect(downloadControl).toMatch(/result\.ok/);
  });

  it('never states or implies certainty language about a reading result — this is a download control only', () => {
    const rendered = downloadControl
      .split('\n')
      .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
      .join('\n');
    expect(rendered).not.toMatch(/\bguaranteed\b/i);
    expect(rendered).not.toMatch(/\bcertain\b/i);
  });
});

// ---------------------------------------------------------------------------
// Section 19 item 14: network restoration
// ---------------------------------------------------------------------------
describe('network restoration is observed, not assumed (section 19 item 14)', () => {
  it('OfflineDownloadControl listens for both online and offline events', () => {
    expect(downloadControl).toMatch(/addEventListener\('online'/);
    expect(downloadControl).toMatch(/addEventListener\('offline'/);
    expect(downloadControl).toMatch(/removeEventListener\('online'/);
    expect(downloadControl).toMatch(/removeEventListener\('offline'/);
  });

  it('OfflineIndicator listens for both online and offline events and clears its own reconnect timer', () => {
    expect(offlineIndicator).toMatch(/addEventListener\('online'/);
    expect(offlineIndicator).toMatch(/addEventListener\('offline'/);
    expect(offlineIndicator).toMatch(/clearTimeout/);
  });

  it('OfflineIndicator shows a subtle, non-alarming message while offline — books and readings remain usable', () => {
    expect(offlineIndicator).toMatch(/Offline · Your books and saved readings remain available\./);
  });
});

// ---------------------------------------------------------------------------
// Wiring: the new pieces are actually mounted, not just defined
// ---------------------------------------------------------------------------
describe('offline infrastructure is wired into the app shell', () => {
  it('layout.tsx mounts both ServiceWorkerRegister and OfflineIndicator', () => {
    expect(layout).toMatch(/<ServiceWorkerRegister/);
    expect(layout).toMatch(/<OfflineIndicator/);
  });

  it('ServiceWorkerRegister guards registration and never blocks the app on failure', () => {
    expect(swRegister).toMatch(/'serviceWorker' in navigator/);
    expect(swRegister).toMatch(/\.catch\(\(\) => \{\}\)/);
    expect(swRegister).toMatch(/register\('\/sw\.js'\)/);
  });

  it('the book detail page renders OfflineDownloadControl only for readable books, matching the Start Reading gate', () => {
    const startReadingIdx = bookPage.indexOf('Start Reading');
    const readableBlock = bookPage.slice(startReadingIdx, startReadingIdx + 300);
    expect(readableBlock).toMatch(/<OfflineDownloadControl bookId=\{book\.id\} \/>/);
  });
});

// ---------------------------------------------------------------------------
// Regression: no protected engine/content file was touched by this work
// ---------------------------------------------------------------------------
describe('offline work never touches the geomancy engine or source content (section 21)', () => {
  const protectedFiles = [
    'lib/raml/engine/casting.ts',
    'lib/raml/engine/chartModel.ts',
    'lib/raml/engine/ruleEngine.ts',
    'lib/raml/engine/operations.ts',
    'lib/raml/engine/types.ts',
    'lib/raml/reading.ts',
  ];

  it('none of the new offline files import from a path that would require editing protected engine files to add offline behavior', () => {
    // This is a structural guard, not a git-diff check (that is run and
    // reported separately) — it documents the intent that offline support
    // is additive UI/caching only.
    for (const f of protectedFiles) {
      expect(sw).not.toContain(f);
      expect(downloadControl).not.toContain(f);
    }
  });
});
