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
  it('the fetch handler excludes /api/, /raml/practice/, and /books/*/read|practice from opportunistic RUNTIME_CACHE writes', () => {
    expect(SW).toMatch(/NO_OPPORTUNISTIC_CACHE_PREFIXES/);
    expect(SW).toMatch(/'\/api\/'/);
    expect(SW).toMatch(/'\/raml\/practice\/'/);
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

describe('offline manifest never stores a session token, secret, password, or payment detail', () => {
  it('the manifest type/read/write functions only ever touch bookId, contentVersion, authorizedAt, accessType', () => {
    const codeOnly = OFFLINE_MANIFEST.split('\n')
      .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
      .join('\n');
    expect(codeOnly).not.toMatch(/sessionToken|password|paymentReference|adminSecret|TG_ADMIN_SECRET/i);
  });
});
