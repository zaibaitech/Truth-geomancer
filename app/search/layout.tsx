import type { ReactNode } from 'react';
import { privatePageMetadata } from '@/lib/seo';

// SEO only: search results are per-visitor, so the page is not indexed. Renders children unchanged.
export const metadata = privatePageMetadata('Search');

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
