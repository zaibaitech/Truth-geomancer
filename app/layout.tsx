import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { cinzel, inter } from '@/lib/fonts';
import { BottomNav } from '@/components/layout/BottomNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'Truth Geomancer',
  description: "Ilm al-Raml — cast the sand, read the figures, study the manuscripts.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// App-shell layout: the outer wrapper is pinned to exactly one viewport-height
// tall and never scrolls itself; the inner div is the ONE intended vertical
// scroll container for page content; BottomNav is a plain flex sibling below
// it, so it's never part of the scrollable height and needs no sticky/fixed
// positioning to stay put. Page content (e.g. the book reader) must not
// re-introduce its own min-h-screen — that's what causes the huge blank
// scroll gap this shape is designed to prevent.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable}`}>
      <body className="overflow-x-hidden bg-ink font-body text-sand-light">
        <div className="mx-auto flex h-[100dvh] max-w-md flex-col overflow-x-hidden bg-ink">
          {/* data-app-scroll: the app scrolls this container, not the window,
              so anything that needs to reset scroll position must target it. */}
          <div data-app-scroll className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain pb-4">
            {children}
          </div>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
