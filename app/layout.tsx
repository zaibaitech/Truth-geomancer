import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { cinzel, inter } from '@/lib/fonts';
import { BottomNav } from '@/components/layout/BottomNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'Truth Geomancer',
  description: "Ilm al-Raml — cast the sand, read the figures, study the manuscripts.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-ink font-body text-sand-light">
        <div className="mx-auto flex min-h-screen max-w-md flex-col bg-ink">
          <div className="flex-1 pb-4">{children}</div>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
