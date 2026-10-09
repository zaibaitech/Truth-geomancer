import type { ReactNode } from 'react';
import { privatePageMetadata } from '@/lib/seo';

// SEO only: gated method-practice pages are not indexed. Renders children unchanged.
export const metadata = privatePageMetadata('Practice');

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
