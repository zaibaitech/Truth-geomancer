import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { cinzel, inter } from '@/lib/fonts';
import { READER_SIZE_BOOTSTRAP } from '@/lib/raml/readerSize';
import { BottomNav } from '@/components/layout/BottomNav';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import { DEFAULT_OG_IMAGE, HOME_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo';
import './globals.css';

// SEO defaults for every page. Pages set their own title (through the
// template), description and canonical URL; see lib/seo.ts. No canonical is
// set here on purpose, so a page without its own never inherits the homepage's.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: HOME_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
    title: SITE_NAME,
    description: HOME_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: HOME_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url],
  },
  verification: {
    google: 'NxNZ8kX8q6Q8gG7TQBrv_xWvQKsaMI8NQc7kjgiuYOg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// App-shell layout: mobile-first, and on a large screen the shell widens to
// max-w-3xl rather than stretching a phone-width column across a desktop —
// the question grid and the reading both use the extra width (Prompt 15,
// section 16). The outer wrapper is pinned to exactly one viewport-height
// tall and never scrolls itself; the inner div is the ONE intended vertical
// scroll container for page content; BottomNav is a plain flex sibling below
// it, so it's never part of the scrollable height and needs no sticky/fixed
// positioning to stay put. Page content (e.g. the book reader) must not
// re-introduce its own min-h-screen — that's what causes the huge blank
// scroll gap this shape is designed to prevent.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable}`}>
      <head>
        {/* Applies the reader's saved text size before the first paint, so a
            larger setting never flashes at the standard size. Falls back to
            standard on any error; see lib/raml/readerSize.ts. */}
        <script dangerouslySetInnerHTML={{ __html: READER_SIZE_BOOTSTRAP }} />
      </head>
      <body className="overflow-x-hidden bg-ink font-body text-sand-light">
        <div className="mx-auto flex h-[100dvh] max-w-md flex-col overflow-x-hidden bg-ink lg:max-w-3xl">
          <ServiceWorkerRegister />
          <OfflineIndicator />
          {/* data-app-scroll: the app scrolls this container, not the window,
              so anything that needs to reset scroll position must target it. */}
          <div data-app-scroll className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain pb-4">
            {children}
          </div>
          <BottomNav />
        </div>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
