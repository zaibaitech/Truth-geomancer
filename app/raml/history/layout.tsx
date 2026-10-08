import type { ReactNode } from 'react';
import { privatePageMetadata } from '@/lib/seo';

// SEO only: a visitor's own saved castings, not indexed. Renders children unchanged.
export const metadata = privatePageMetadata('Past Castings');

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
