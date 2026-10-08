import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

// Public pages are crawlable; account, purchase, admin, API and gated
// reader/practice routes are not (those pages also carry noindex).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin',
        '/signin',
        '/auth/',
        '/purchase',
        '/notifications',
        '/search',
        '/settings',
        '/raml/history',
        '/raml/practice/',
        '/preview/',
        '/books/*/read',
        '/books/*/practice/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
