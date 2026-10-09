import type { ReactNode } from 'react';
import { privatePageMetadata } from '@/lib/seo';

// SEO only: checkout pages are not indexed. Renders children unchanged.
export const metadata = privatePageMetadata('Purchase');

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
