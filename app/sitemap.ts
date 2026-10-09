import type { MetadataRoute } from 'next';
import { BOOKS } from '@/content/books';
import { SITE_URL, absoluteUrl } from '@/lib/seo';

// Indexable public pages only, on the canonical non-www host. Book pages
// come straight from content/books.ts, so a new book is listed automatically.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/books'), changeFrequency: 'weekly', priority: 0.9 },
    ...BOOKS.map((book) => ({
      url: absoluteUrl(`/books/${book.id}`),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    { url: absoluteUrl('/raml'), changeFrequency: 'monthly', priority: 0.8 },
    { url: absoluteUrl('/star'), changeFrequency: 'monthly', priority: 0.5 },
  ];
}
