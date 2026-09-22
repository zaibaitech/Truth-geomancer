// Structural security checks on the Prompt 30 offline-download route and
// service-worker changes — same pattern as previewRoutes.test.ts (Prompt
// 29) and paymentRequestRoutes.test.ts (Prompt 28): the domain layer's
// correctness is proven in offlineContentService.test.ts; these prove the
// ROUTE WIRING and service-worker caching strategy never undermine it
// (Phase 23 — IDENTITY, SECURITY BOUNDARY).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const OFFLINE_ROUTE = readFileSync('app/api/books/[bookId]/offline/route.ts', 'utf-8');
const SW = readFileSync('public/sw.js', 'utf-8');
const BOOK_CACHE = readFileSync('lib/offline/bookCache.ts', 'utf-8');
const OFFLINE_MANIFEST = readFileSync('lib/offline/offlineManifest.ts', 'utf-8');

function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git', '.data'].includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(full));
    else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

describe('9: client cannot supply another userId', () => {
  it('the offline route never reads userId from a query param or body — only getCurrentUser()', () => {
    expect(OFFLINE_ROUTE).not.toMatch(/searchParams\.get\(['"]userId['"]\)|body\.userId/);
    expect(OFFLINE_ROUTE).toMatch(/getCurrentUser\(\)/);
  });
});

describe('10: client cannot forge entitlement', () => {
  it('the route never reads entitled/status/access flags from the client — only getBookContentForUser()’s own canAccessForUser() check decides', () => {
    expect(OFFLINE_ROUTE).not.toMatch(/searchParams\.get\(['"]entitled['"]\)|body\.entitled|body\.status/);
    expect(OFFLINE_ROUTE).toMatch(/getBookContentForUser/);
  });
});

describe('11: client cannot request another product’s content through parameters', () => {
  it('bookId comes only from the URL path segment (params.bookId), never a query string or body field', () => {
    expect(OFFLINE_ROUTE).toMatch(/params\.bookId/);
    expect(OFFLINE_ROUTE).not.toMatch(/searchParams\.get\(['"]bookId['"]\)/);
  });

  it('the route sets Cache-Control: private, no-store so a shared/CDN cache never serves one user’s book to another', () => {
    expect(OFFLINE_ROUTE).toMatch(/private, no-store/);
  });
});

describe('28-29: protected content is not statically bundled or public', () => {
  it('no client component imports contentService, the offline route, or the full content modules directly', () => {
    const offenders: string[] = [];
    for (const file of [...listFilesRecursive('app'), ...listFilesRecursive('components')]) {
      const source = readFileSync(file, 'utf-8');
      if (!source.trimStart().startsWith("'use client'")) continue;
      if (
        /lib\/server\/contentService/.test(source) ||
        /lib\/server\/content\/kanzulMikban/.test(source) ||
        /lib\/server\/content\/masterOfGeomancy/.test(source)
      ) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('offlineManifest.ts (client-safe, used by the download control) never imports any server-only content module', () => {
    expect(OFFLINE_MANIFEST).not.toMatch(/lib\/server\//);
  });

  it('bookCache.ts (client-safe) never imports the protected content modules or the engine — only fetches authorized JSON/HTML at runtime', () => {
    expect(BOOK_CACHE).not.toMatch(/lib\/server\/content|lib\/raml\/engine\/questions|from ['"]@\/lib\/raml\/engine['"]/);
  });
});

describe('30: service worker does not precache protected content', () => {
  it('SHELL_URLS never lists a book/practice/API path', () => {
    const shellBlock = SW.slice(SW.indexOf('SHELL_URLS'), SW.indexOf('self.addEventListener'));
    expect(shellBlock).not.toMatch(/\/books\/|\/raml\/practice\/|\/api\//);
  });
});

describe('31: generic visitors cannot populate protected caches', () => {
  it('the fetch handler excludes /api/, /raml (Cast picker + practice), and /books/*/read|practice from opportunistic RUNTIME_CACHE writes', () => {
    expect(SW).toMatch(/NO_OPPORTUNISTIC_CACHE_PREFIXES/);
    expect(SW).toMatch(/'\/api\/'/);
    expect(SW).toMatch(/'\/raml\/practice\/'/);
    expect(SW).toMatch(/'\/raml'/);
    expect(SW).toMatch(/isProtectedBookPath/);
    expect(SW).toMatch(/shouldOpportunisticallyCache/);
  });

  it('the opportunistic cache.put call is gated by shouldOpportunisticallyCache, not just response.ok', () => {
    const fetchBlock = SW.slice(SW.indexOf("addEventListener('fetch'"));
    expect(fetchBlock).toMatch(/response\.ok && shouldOpportunisticallyCache\(url\.pathname\)/);
  });

  it('the only way a protected book URL enters ANY cache is the explicit, entitlement-verified downloadBookForOfflineUse() path — never the service worker’s own fetch handler', () => {
    expect(BOOK_CACHE).toMatch(/downloadBookForOfflineUse/);
    expect(BOOK_CACHE).toMatch(/api\/books\/\$\{bookId\}\/offline/);
  });
});

// ---------------------------------------------------------------------------
// Prompt 34 — a real production leak: a `tg-runtime-v1` entry cached before
// this exclusion existed at all (or before it was ever version-bumped) kept
// being served to that visitor's browser forever, since `caches.match()`
// ran before any server round-trip and the cache name never changed, so
// the activate handler's own cleanup never retired it. Two independent
// fixes, both verified below: (1) the version bump itself, so every
// existing stale cache gets purged on next activate; (2) a read-side
// guard, so no future regression (or any entry this worker never wrote)
// can ever be served for a gated path again — every request for one of
// these paths always goes to the network.
// ---------------------------------------------------------------------------
describe('34: a stale/leftover cache entry can never be served for a gated path again', () => {
  it('APP_VERSION was bumped past v1, so any pre-existing tg-runtime-v1/tg-shell-v1 cache is retired by the existing activate-handler cleanup', () => {
    expect(SW).toMatch(/const APP_VERSION = '(?!v1')/);
  });

  it('the fetch handler never reaches caches.match(request) for a gated path — it returns via a plain network fetch before that call is reached', () => {
    const fetchBlock = SW.slice(SW.indexOf("addEventListener('fetch'"));
    const guardIdx = fetchBlock.indexOf('!shouldOpportunisticallyCache(url.pathname)');
    const matchIdx = fetchBlock.indexOf('caches.match(request)');
    expect(guardIdx).toBeGreaterThan(-1);
    expect(matchIdx).toBeGreaterThan(-1);
    expect(guardIdx).toBeLessThan(matchIdx);
    // The guard branch itself must `return` before falling into the
    // cache-first block below it.
    const guardBlock = fetchBlock.slice(guardIdx, matchIdx);
    expect(guardBlock).toMatch(/return;/);
  });

  it('the read-side guard uses the exact same predicate as the write-side exclusion — no separate, divergent list to drift out of sync', () => {
    const fetchBlock = SW.slice(SW.indexOf("addEventListener('fetch'"));
    const occurrences = fetchBlock.match(/shouldOpportunisticallyCache\(url\.pathname\)/g) ?? [];
    // Once for the read-side guard, once for the write-side gate below it.
    expect(occurrences.length).toBe(2);
  });
});

describe('59: Cast picker /raml is never served cache-first', () => {
  it('APP_VERSION was bumped past v5 so a pre-Prompt-59 cached anonymous /raml is retired', () => {
    expect(SW).toMatch(/const APP_VERSION = '(?!v1'|v2'|v3'|v4'|v5')/);
  });

  it('/raml is on the network-only prefix list, so caches.match is never consulted for the picker', () => {
    const prefixes = SW.slice(SW.indexOf('NO_OPPORTUNISTIC_CACHE_PREFIXES'), SW.indexOf('function isProtectedBookPath'));
    expect(prefixes).toMatch(/'\/raml'/);
  });
});

describe('offline manifest never stores a session token, secret, password, or payment detail', () => {
  it('the manifest type/read/write functions only ever touch bookId, contentVersion, authorizedAt, accessType', () => {
    const codeOnly = OFFLINE_MANIFEST.split('\n')
      .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
      .join('\n');
    expect(codeOnly).not.toMatch(/sessionToken|password|paymentReference|adminSecret|TG_ADMIN_SECRET/i);
  });
});
