// Stage 1a guard: IMPORT GRAPH.
//
// Protected modules must never reach the browser bundle. Server components
// may import them (module code stays on the server; what they render is
// checked by publicPageRender.test.ts). Today's known leaks are recorded in
// tests/fixtures/knownLeaks.ts and may only shrink.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT, appWideClientReach, isClientModule, listSourceFiles, reachFrom, rel } from './lib/importGraph';
import { compareSets, formatRatchet } from './lib/ratchet';
import {
  ACCEPTED_SERVER_SIDE_IMPORTS,
  KNOWN_CLIENT_REACHABLE_PROTECTED,
  KNOWN_PUBLIC_ROUTE_CLIENT_LEAKS,
} from '../fixtures/knownLeaks';
import { PUBLIC_ROUTE_FILES, ROUTE_CLASSIFICATION } from '../fixtures/routeClassification';

/** Modules holding paid / restricted content or logic. */
const PROTECTED_MODULE_PATTERNS: RegExp[] = [
  /^lib\/server\//, //                       all server code, incl. lib/server/content (full book text)
  /^lib\/raml\/engine\//, //                 engine: method quotes, rule logic, verdicts
  /^content\/stars\.ts$/, //                 house-6/house-2 meanings, remedies, sadaqah (L1)
  /^content\/kanzulFigureQuality\.ts$/, //   owner-supplied quality grouping (L3)
  /^content\/classicalAttributes\.ts$/, //   classical attributes table (L3)
  /^content\/manuscripts\/(starUses|hatim|hatimPattern|dreamInterpretations|giftVisitorFigures|abjad|valueReconciliation)\.ts$/,
];

/** Raw book text: must not even be imported server-side by a PUBLIC route. */
const BOOK_TEXT_PATTERNS: RegExp[] = [
  /^lib\/server\/content\//,
  /^content\/manuscripts\/(starUses|dreamInterpretations|giftVisitorFigures|abjad|valueReconciliation)\.ts$/,
];

const isProtected = (f: string) => PROTECTED_MODULE_PATTERNS.some((p) => p.test(f));

/** Directories reserved for Phase 1 public SEO pages; they must stay server-only. */
const SEO_PUBLIC_DIRS = ['app/learn', 'app/figures', 'app/houses', 'app/guides', 'app/glossary', 'app/faq', 'components/seo', 'content/public'];

describe('route classification', () => {
  const routeFiles = [
    ...listSourceFiles('app').filter((f) => /\/(page\.tsx|route\.ts)$/.test(f)).map(rel),
    'app/layout.tsx',
    'app/robots.ts',
    'app/sitemap.ts',
    'app/manifest.ts',
  ];

  it('every page.tsx / route.ts is classified in tests/fixtures/routeClassification.ts (new routes must be classified)', () => {
    const unclassified = routeFiles.filter((f) => !(f in ROUTE_CLASSIFICATION));
    expect(unclassified, 'Add these routes to tests/fixtures/routeClassification.ts').toEqual([]);
  });

  it('the classification lists no route that no longer exists', () => {
    const stale = Object.keys(ROUTE_CLASSIFICATION).filter((f) => !existsSync(join(REPO_ROOT, f)));
    expect(stale).toEqual([]);
  });
});

describe('app-wide client bundle: protected modules (ratchet)', () => {
  const reachable = appWideClientReach();
  const protectedReached = Array.from(reachable.keys()).map(rel).filter(isProtected);

  it('no protected module is client-reachable beyond the known-leak baseline, and fixed leaks are removed from it', () => {
    const r = compareSets(
      protectedReached,
      KNOWN_CLIENT_REACHABLE_PROTECTED.map((k) => k.module),
    );
    const chains = r.added.map((m) => `  ${m}\n    via ${reachable.get(join(REPO_ROOT, m))?.join(' -> ')}`).join('\n');
    expect(r, `${formatRatchet('client-reachable protected modules', r)}\n${chains}`).toEqual({ added: [], fixed: [] });
  });

  it('server-only book text and the engine question registry are never client-reachable (no baseline allowed)', () => {
    const forbidden = protectedReached.filter(
      (f) => /^lib\/server\//.test(f) || /^lib\/raml\/engine\/(questions\/|index\.ts|ruleEngine\.ts|operations\.ts|interpretation\.ts)/.test(f),
    );
    expect(forbidden).toEqual([]);
  });
});

describe('public routes', () => {
  it.each(PUBLIC_ROUTE_FILES)('%s: client bundle reaches no protected module beyond its known baseline', (file) => {
    const reach = reachFrom(join(REPO_ROOT, file));
    const reached = Array.from(reach.client.keys()).map(rel).filter(isProtected);
    const r = compareSets(reached, KNOWN_PUBLIC_ROUTE_CLIENT_LEAKS[file] ?? []);
    expect(r, formatRatchet(file, r)).toEqual({ added: [], fixed: [] });
  });

  it.each(PUBLIC_ROUTE_FILES)('%s: does not import raw book text, even server-side (except documented server-only paths)', (file) => {
    const reach = reachFrom(join(REPO_ROOT, file));
    const hits = Array.from(reach.all.keys()).map(rel).filter((f) => BOOK_TEXT_PATTERNS.some((p) => p.test(f)));
    const r = compareSets(hits, ACCEPTED_SERVER_SIDE_IMPORTS[file]?.modules ?? []);
    expect(r, formatRatchet(`${file} (server-side book text)`, r)).toEqual({ added: [], fixed: [] });
    // Whatever is accepted server-side must never be in the client bundle.
    const client = Array.from(reach.client.keys()).map(rel).filter((f) => BOOK_TEXT_PATTERNS.some((p) => p.test(f)));
    expect(client).toEqual([]);
  });

  it('reserved Phase 1 SEO directories contain no client components (they must be Server Components)', () => {
    const clientFiles = SEO_PUBLIC_DIRS.filter((d) => existsSync(join(REPO_ROOT, d)))
      .flatMap((d) => listSourceFiles(d))
      .filter(isClientModule)
      .map(rel);
    expect(clientFiles).toEqual([]);
  });
});

describe('graph walker sanity (so a broken walker cannot pass silently)', () => {
  it('finds the documented L1 chain: app/search/page.tsx (client) -> content/stars.ts', () => {
    const reach = reachFrom(join(REPO_ROOT, 'app/search/page.tsx'));
    expect(Array.from(reach.client.keys()).map(rel)).toContain('content/stars.ts');
  });

  it('skips `import type` (FigureGlyph only type-imports content/stars.ts)', () => {
    const reach = reachFrom(join(REPO_ROOT, 'components/raml/FigureGlyph.tsx'));
    expect(Array.from(reach.all.keys()).map(rel)).not.toContain('content/stars.ts');
  });

  it('treats a server page as server until a client boundary (the reader imports book text server-side only)', () => {
    const reach = reachFrom(join(REPO_ROOT, 'app/books/[id]/read/page.tsx'));
    const all = Array.from(reach.all.keys()).map(rel);
    const client = Array.from(reach.client.keys()).map(rel);
    expect(all).toContain('lib/server/content/kanzulMikban.ts');
    expect(client).not.toContain('lib/server/content/kanzulMikban.ts');
  });
});
