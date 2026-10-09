import { BOOKS } from '@/content/books';

// SEO Phase 1: the public learning pages published in this build.
//
// One list drives the sitemap, the "is this link live?" check used by the
// learning pages (so a page never links to a page that is not published
// yet) and the guard tests in tests/guards/seoPages.test.tsx.
//
// Every page listed here is a Server Component under app/learn, app/figures
// or app/houses that renders ONLY content that is already free in the app
// (see tests/fixtures/publicContentAllowlist.ts). Nothing here is paid.
export interface SeoPage {
  path: string;
  changeFrequency: 'weekly' | 'monthly';
  priority: number;
}

export const SEO_PAGES: SeoPage[] = [
  { path: '/learn', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/learn/ilm-al-raml', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/learn/glossary', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/figures', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/houses', changeFrequency: 'monthly', priority: 0.6 },
];

/** Existing public app pages the learning pages may link to. */
export const APP_PUBLIC_PATHS: string[] = ['/', '/raml', '/books', ...BOOKS.map((b) => `/books/${b.id}`)];

export const MASTER_BOOK_PATH = '/books/master-of-geomancy-vol-1';
export const KANZUL_BOOK_PATH = '/books/kanzul-mikban';

/** True when `href` is a published page, so a link to it will not 404. */
export function isLivePath(href: string): boolean {
  return APP_PUBLIC_PATHS.includes(href) || SEO_PAGES.some((p) => p.path === href);
}
