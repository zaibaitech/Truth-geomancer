// Stage 1a guard: SIGNED-OUT server HTML of public pages contains no protected
// content (zero tolerance, no baseline).
//
// Pages are rendered as a visitor without a session would receive them, using
// the real page components, real child components and an in-memory database
// (no DATABASE_URL needed). Async Server Components anywhere in the tree are
// resolved before rendering, so nothing is mocked out.
//
// This checks the HTML only. Client JS chunks are covered by the build-output
// scan (npm run test:leaks), which is where today's known leaks L1 and L2 live.
//
// Not rendered here (with reasons):
//   * /books/[id]/read, practice pages, purchase, settings, history: gated or
//     private, so not public (redirect / entitlement checks are covered by
//     lib/server/contentDeliverySecurity.test.ts and the paid-API guard).
//   * Post-interaction client states (after casting on /raml or using a
//     preview) never appear in server HTML; their data comes from the paid
//     APIs, which are covered by paidApiUnauthenticated.test.ts.
import React, { isValidElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { openDatabase, type Db } from '@/lib/server/db';
import { buildFingerprints, findHits, normalizeHtml, type Fingerprint } from './lib/leakMatcher';
import { protectedStrings } from '../fixtures/protectedContent';
import { publicCorpus } from '../fixtures/publicContentAllowlist';
import { KM_CHAPTER_META } from '@/content/manuscripts/kanzulMikbanMeta';

let db: Db;
vi.mock('@/lib/server/db', async (orig) => ({ ...(await orig<typeof import('@/lib/server/db')>()), getDb: () => db }));
vi.mock('@/lib/server/session', () => ({
  getCurrentUserIfPresent: async () => null,
  getCurrentUser: async () => {
    throw new Error('a public page must not mint an identity during a signed-out render');
  },
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ refresh() {}, push() {}, replace() {}, back() {}, prefetch() {} }),
  useSearchParams: () => new URLSearchParams(),
  redirect: (to: string) => {
    throw new Error(`redirect(${to})`);
  },
  notFound: () => {
    throw new Error('notFound()');
  },
}));

/** Resolves async Server Components in a React element tree, recursively. */
async function resolveTree(node: ReactNode): Promise<ReactNode> {
  if (Array.isArray(node)) return Promise.all(node.map(resolveTree));
  if (!isValidElement(node)) return node;
  const { type, props } = node as React.ReactElement<Record<string, unknown>>;
  if (typeof type === 'function' && type.constructor.name === 'AsyncFunction') {
    return resolveTree(await (type as (p: unknown) => Promise<ReactNode>)(props));
  }
  if (props && 'children' in props) {
    return React.cloneElement(node as React.ReactElement, undefined, ...([] as ReactNode[]).concat(await resolveTree(props.children as ReactNode)));
  }
  return node;
}

type PageModule = { default: unknown };

async function renderPage(load: () => Promise<PageModule>, props: unknown = {}) {
  const Page = (await load()).default as (p: unknown) => ReactNode | Promise<ReactNode>;
  // Async Server Component pages are awaited; sync and 'use client' pages render as elements (hooks need a renderer).
  const tree = Page.constructor.name === 'AsyncFunction' ? await Page(props) : React.createElement(Page as React.FC, props as object);
  return renderToStaticMarkup(<>{await resolveTree(tree)}</>);
}

let FINGERPRINTS: Fingerprint[];
beforeAll(() => {
  db = openDatabase(':memory:');
  FINGERPRINTS = buildFingerprints(protectedStrings(), publicCorpus());
});

const PAGES: [string, () => Promise<PageModule>, unknown?][] = [
  ['/', () => import('../../app/page')],
  ['/books', () => import('../../app/books/page')],
  ['/books/kanzul-mikban', () => import('../../app/books/[id]/page'), { params: { id: 'kanzul-mikban' } }],
  ['/books/master-of-geomancy-vol-1', () => import('../../app/books/[id]/page'), { params: { id: 'master-of-geomancy-vol-1' } }],
  ['/raml', () => import('../../app/raml/page')],
  ['/star', () => import('../../app/star/page')],
  ['/search', () => import('../../app/search/page')],
  ['/more', () => import('../../app/more/page')],
  ['/notifications', () => import('../../app/notifications/page')],
  ['/preview/kanzul-mikban', () => import('../../app/preview/kanzul-mikban/page')],
  ['/preview/master-of-geomancy-vol-1', () => import('../../app/preview/master-of-geomancy-vol-1/page')],
  ['/learn', () => import('../../app/learn/page')],
  ['/learn/ilm-al-raml', () => import('../../app/learn/ilm-al-raml/page')],
  ['/learn/glossary', () => import('../../app/learn/glossary/page')],
  ['/figures', () => import('../../app/figures/page')],
  ['/houses', () => import('../../app/houses/page')],
];

describe('signed-out server HTML of public pages', () => {
  it.each(PAGES)('%s renders and contains no protected-content fingerprint', async (_path, load, props) => {
    const html = await renderPage(load, props);
    expect(html.length).toBeGreaterThan(200);
    const hits = findHits(normalizeHtml(html), FINGERPRINTS);
    expect(hits.map((h) => `[${h.group}] ${h.id} (${h.source})`)).toEqual([]);
  });

  it('the render is real, not empty: allowlisted free content (chapter titles) appears in the HTML', async () => {
    const html = normalizeHtml(await renderPage(() => import('../../app/books/[id]/page'), { params: { id: 'kanzul-mikban' } }));
    expect(html).toContain(KM_CHAPTER_META[2].title);
    expect(normalizeHtml(await renderPage(() => import('../../app/books/page')))).toContain('The Master of Geomancy');
  });

  it('the scan is live: a protected string injected into rendered HTML is detected', async () => {
    const sample = protectedStrings().find((p) => p.group === 'kanzul-text' && p.text.length > 120)!;
    const html = `<main><p>${sample.text.replace(/&/g, '&amp;')}</p></main>`;
    expect(findHits(normalizeHtml(html), FINGERPRINTS).length).toBeGreaterThan(0);
  });
});
