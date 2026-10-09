import type { Metadata } from 'next';
import type { Book } from '@/content/books';

// SEO: one place for the canonical host, the shared social-preview image and
// the per-page metadata shape, so every public page gets a unique title,
// description and canonical URL on https://truthgeomancer.com (non-www).
// Nothing here affects what a visitor sees on the page itself.

export const SITE_URL = 'https://truthgeomancer.com';
export const SITE_NAME = 'Truth Geomancer';

export const HOME_TITLE = 'Truth Geomancer: Ilm al-Raml Geomancy Books & Chart Casting';
export const HOME_DESCRIPTION =
  'Learn classical geomancy (Ilm al-Raml) from the manuscripts of Sheikh Abdul Basit Bayan, ' +
  'and cast and read a full 16-house geomantic chart online.';

/** Official social profiles, linked from the Organization JSON-LD (`sameAs`). */
export const SOCIAL_PROFILES = ['https://www.facebook.com/p/The-Truth-Geomancer-61551983767801/'];

/** Site-wide social preview (1200×630), built from the app's own emblem, palette and book covers. */
export const DEFAULT_OG_IMAGE = {
  url: '/og-image.jpg',
  width: 1200,
  height: 630,
  alt: 'Truth Geomancer — Read the Tradition. Practice the Method.',
};

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

/** Trims a description to a search-snippet length at a word boundary. */
export function snippet(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:—–-]+$/, '')}…`;
}

type OgImage = { url: string; width?: number; height?: number; alt?: string };

/**
 * Metadata for an indexable public page: unique title + description, a
 * canonical URL, and matching Open Graph / Twitter cards. `title` goes
 * through the root layout's "%s | Truth Geomancer" template unless
 * `absoluteTitle` is set.
 */
export function publicPageMetadata({
  title,
  absoluteTitle,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  twitterCard = 'summary_large_image',
}: {
  title?: string;
  absoluteTitle?: string;
  description: string;
  path: string;
  image?: OgImage;
  twitterCard?: 'summary' | 'summary_large_image';
}): Metadata {
  const socialTitle = absoluteTitle ?? (title ? `${title} | ${SITE_NAME}` : SITE_NAME);
  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_US',
      url: path,
      title: socialTitle,
      description,
      images: [image],
    },
    twitter: {
      card: twitterCard,
      title: socialTitle,
      description,
      images: [image.url],
    },
  };
}

/** Metadata for account, purchase and other private pages: never indexed. */
export function privatePageMetadata(title: string): Metadata {
  return { title, robots: { index: false, follow: false } };
}

export function bookPageTitle(book: Book): string {
  return book.subtitle ? `${book.title}: ${book.subtitle}` : book.title;
}

// ---- JSON-LD (schema.org) ----------------------------------------------------

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/apple-icon.png'),
    image: absoluteUrl(DEFAULT_OG_IMAGE.url),
    sameAs: SOCIAL_PROFILES,
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: HOME_DESCRIPTION,
    inLanguage: 'en',
    publisher: { '@id': ORGANIZATION_ID },
  };
}

export function bookJsonLd(book: Book) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    '@id': `${absoluteUrl(`/books/${book.id}`)}#book`,
    name: book.title,
    ...(book.subtitle ? { alternateName: bookPageTitle(book) } : {}),
    author: { '@type': 'Person', name: book.author },
    description: book.description,
    ...(book.coverImage ? { image: absoluteUrl(book.coverImage) } : {}),
    url: absoluteUrl(`/books/${book.id}`),
    inLanguage: 'en',
    bookFormat: 'https://schema.org/EBook',
    genre: 'Geomancy',
    about: 'Ilm al-Raml (Islamic geomancy)',
    publisher: { '@id': ORGANIZATION_ID, '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  };
}

export function castingToolJsonLd(description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Truth Geomancer — Cast a Chart',
    url: absoluteUrl('/raml'),
    description,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    inLanguage: 'en',
    publisher: { '@id': ORGANIZATION_ID, '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  };
}
