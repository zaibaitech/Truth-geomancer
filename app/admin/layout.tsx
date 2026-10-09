import type { ReactNode } from 'react';
import { privatePageMetadata } from '@/lib/seo';

// SEO only: the admin area is never indexed. Renders children unchanged.
export const metadata = privatePageMetadata('Author Dashboard');

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
