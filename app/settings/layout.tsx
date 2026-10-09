import type { ReactNode } from 'react';
import { privatePageMetadata } from '@/lib/seo';

// SEO only: a personal settings page, not indexed. Renders children unchanged.
export const metadata = privatePageMetadata('Settings');

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
