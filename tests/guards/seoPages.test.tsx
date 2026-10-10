// SEO Phase 1 guard: the public LEARNING pages (/learn, /figures, /houses, …).
//
// Every page in content/public/seoPages.ts must:
//   * be a classified public route, in the sitemap, and not robots-disallowed;
//   * export unique metadata: title (<= 60 chars after the template),
//     description (<= 160), canonical + og:url equal to its own path;
//   * render signed-out with exactly one <h1>, valid JSON-LD (BreadcrumbList
//     ending at the page itself), links to /raml and the books, and no link
//     to a page that is not published;
//   * carry no religious rulings, health claims, guarantees or paid-content
//     vocabulary (remedies, sadaqah, recitations);
//   * not reach ANY protected module, not even server-side (stricter than the
//     generic public-route guard): figure basics come from content/public.
import React, { type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import type { Metadata } from 'next';
import { REPO_ROOT, reachFrom, rel } from './lib/importGraph';
import { ROUTE_CLASSIFICATION } from '../fixtures/routeClassification';
import { SEO_PAGES, isLivePath } from '@/content/public/seoPages';
import { SITE_NAME, SITE_URL, absoluteUrl } from '@/lib/seo';
import sitemap from '../../app/sitemap';
import robots from '../../app/robots';

vi.mock('next/navigation', () => ({
  usePathname: () => '/learn',
  useRouter: () => ({ refresh() {}, push() {}, replace() {}, back() {}, prefetch() {} }),
  useSearchParams: () => new URLSearchParams(),
  redirect: (to: string) => {
    throw new Error(`redirect(${to})`);
  },
  notFound: () => {
    throw new Error('notFound()');
  },
}));

type PageModule = {
  default: (p: unknown) => ReactNode | Promise<ReactNode>;
  metadata?: Metadata;
  generateMetadata?: (p: unknown) => Metadata | Promise<Metadata>;
};

/** Every published SEO page: its route file, loader and props. Add new pages here. */
const PAGE_MODULES: Record<string, { file: string; load: () => Promise<PageModule>; props?: unknown }> = {
  '/learn': { file: 'app/learn/page.tsx', load: () => import('../../app/learn/page') },
  '/learn/ilm-al-raml': { file: 'app/learn/ilm-al-raml/page.tsx', load: () => import('../../app/learn/ilm-al-raml/page') },
  '/learn/glossary': { file: 'app/learn/glossary/page.tsx', load: () => import('../../app/learn/glossary/page') },
};

const PATHS = SEO_PAGES.map((p) => p.path);

async function load(path: string) {
  const entry = PAGE_MODULES[path];
  const mod = await entry.load();
  const metadata = mod.metadata ?? (await mod.generateMetadata!(entry.props ?? {}));
  const tree = mod.default.constructor.name === 'AsyncFunction' ? await mod.default(entry.props ?? {}) : React.createElement(mod.default as React.FC, (entry.props ?? {}) as object);
  const html = renderToStaticMarkup(<>{tree}</>);
  return { metadata, html };
}

function fullTitle(m: Metadata): string {
  const t = m.title as string | { absolute: string } | undefined;
  if (!t) return SITE_NAME;
  return typeof t === 'string' ? `${t} | ${SITE_NAME}` : t.absolute;
}

const visibleText = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');

const hrefs = (html: string) => Array.from(html.matchAll(/<a [^>]*href="([^"]+)"/g)).map((m) => m[1]);
const jsonLd = (html: string) =>
  Array.from(html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)).flatMap((m) => {
    const v = JSON.parse(m[1]);
    return Array.isArray(v) ? v : [v];
  });

/** No rulings, health claims, guarantees or paid-content vocabulary on public learning pages. */
const BANNED = [
  /\bhalal\b/i,
  /\bharam\b/i,
  /\bpermissible\b/i,
  /\bforbidden\b/i,
  /\bcures?\b/i,
  /\bheal(s|ing)?\b/i,
  /witchcraft/i,
  /\bjinn\b/i,
  /\bguaranteed\b/i,
  /will happen/i,
  /100\s?%/,
  /\bremed(y|ies)\b/i,
  /\bsadaqah\b/i,
  /\brecite\b/i,
  /\bsickness\b|\billness\b/i,
];

/** Protected modules (same list as importGraph.test.ts) — SEO pages may not reach them even server-side. */
const PROTECTED = [
  /^lib\/server\//,
  /^lib\/raml\/engine\//,
  /^content\/stars\.ts$/,
  /^content\/kanzulFigureQuality\.ts$/,
  /^content\/classicalAttributes\.ts$/,
  /^content\/manuscripts\//,
];

describe('SEO learning pages: registry', () => {
  it('every published SEO page has a page module, an existing route file classified public', () => {
    expect(Object.keys(PAGE_MODULES).sort()).toEqual([...PATHS].sort());
    for (const path of PATHS) {
      const { file } = PAGE_MODULES[path];
      expect(existsSync(join(REPO_ROOT, file)), file).toBe(true);
      expect(ROUTE_CLASSIFICATION[file], file).toBe('public');
    }
  });

  it('the sitemap lists every SEO page once, on the canonical host', () => {
    const urls = sitemap().map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
    for (const path of PATHS) expect(urls).toContain(absoluteUrl(path));
    for (const u of urls) expect(u.startsWith(SITE_URL)).toBe(true);
  });

  it('robots.txt does not disallow any SEO page, and still disallows the private areas', () => {
    const rules = robots().rules as { disallow: string[] };
    for (const path of PATHS) for (const d of rules.disallow) expect(path.startsWith(d.replace(/\*.*$/, '')) && d !== '/', `${path} vs ${d}`).toBe(false);
    expect(rules.disallow).toEqual(expect.arrayContaining(['/api/', '/admin', '/purchase', '/books/*/read']));
  });
});

describe('SEO learning pages: no protected module, not even server-side', () => {
  it.each(PATHS)('%s', (path) => {
    const reach = reachFrom(join(REPO_ROOT, PAGE_MODULES[path].file));
    const hits = Array.from(reach.all.keys()).map(rel).filter((f) => PROTECTED.some((p) => p.test(f)));
    expect(hits).toEqual([]);
  });
});

describe('SEO learning pages: metadata', () => {
  it('titles and descriptions are unique across SEO pages and the existing public pages', async () => {
    const titles: string[] = [];
    const descriptions: string[] = [];
    for (const path of PATHS) {
      const { metadata } = await load(path);
      titles.push(fullTitle(metadata));
      descriptions.push(String(metadata.description));
    }
    const existing = await Promise.all([import('../../app/page'), import('../../app/raml/page'), import('../../app/star/page'), import('../../app/books/page')]);
    for (const m of existing) {
      titles.push(fullTitle(m.metadata as Metadata));
      descriptions.push(String((m.metadata as Metadata).description));
    }
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it.each(PATHS)('%s: title <= 60, description 50-160, canonical and og:url are the page path, indexable', async (path) => {
    const { metadata } = await load(path);
    expect(fullTitle(metadata).length).toBeLessThanOrEqual(60);
    const d = String(metadata.description);
    expect(d.length).toBeGreaterThanOrEqual(50);
    expect(d.length).toBeLessThanOrEqual(160);
    expect(metadata.alternates?.canonical).toBe(path);
    expect((metadata.openGraph as { url?: string }).url).toBe(path);
    expect(metadata.robots).toBeUndefined();
  });
});

describe('SEO learning pages: rendered HTML (signed out)', () => {
  it.each(PATHS)('%s: one <h1>, valid JSON-LD with a breadcrumb ending at the page', async (path) => {
    const { html } = await load(path);
    expect(html.match(/<h1[\s>]/g)?.length).toBe(1);
    const ld = jsonLd(html);
    expect(ld.length).toBeGreaterThan(0);
    for (const item of ld) {
      expect(item['@context']).toBe('https://schema.org');
      expect(typeof item['@type']).toBe('string');
    }
    const crumbs = ld.find((i) => i['@type'] === 'BreadcrumbList');
    expect(crumbs).toBeTruthy();
    const list = crumbs.itemListElement as { position: number; item: string }[];
    expect(list[0].item).toBe(absoluteUrl('/'));
    expect(list[list.length - 1].item).toBe(absoluteUrl(path));
    list.forEach((c, i) => expect(c.position).toBe(i + 1));
  });

  it.each(PATHS)('%s: internal links only to published pages; links to /raml, /books and both book pages', async (path) => {
    const { html } = await load(path);
    const internal = hrefs(html).filter((h) => h.startsWith('/'));
    const ALSO_OK = ['/settings', '/signin']; // Header chrome (settings icon, account button)
    for (const h of internal) {
      const bare = h.split(/[?#]/)[0];
      expect(isLivePath(bare) || ALSO_OK.some((p) => bare.startsWith(p)), `${path} links to unpublished ${h}`).toBe(true);
    }
    expect(internal).toContain('/raml');
    expect(internal).toContain('/books');
    expect(internal).toContain('/books/master-of-geomancy-vol-1');
    expect(internal).toContain('/books/kanzul-mikban');
  });

  it.each(PATHS)('%s: no rulings, health claims, guarantees or paid-content vocabulary', async (path) => {
    const { html, metadata } = await load(path);
    const text = `${visibleText(html)} ${fullTitle(metadata)} ${metadata.description}`;
    const found = BANNED.filter((re) => re.test(text)).map(String);
    expect(found).toEqual([]);
  });
});

describe('home and /more link to the learning hub', () => {
  it('/more lists /learn', async () => {
    const More = (await import('../../app/more/page')).default;
    expect(hrefs(renderToStaticMarkup(<More />))).toContain('/learn');
  });

  it('the home page renders the Learn row', async () => {
    const { LearnRow } = await import('@/components/dashboard/LearnRow');
    const html = renderToStaticMarkup(<LearnRow />);
    expect(hrefs(html)).toEqual(['/learn']);
    const home = await import('node:fs').then((fs) => fs.readFileSync(join(REPO_ROOT, 'app/page.tsx'), 'utf8'));
    expect(home).toMatch(/<LearnRow \/>/);
  });
});
