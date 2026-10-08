import type { ReactNode } from 'react';
import { privatePageMetadata } from '@/lib/seo';

// SEO only: per-account preview flows are not indexed. Renders children unchanged.
export const metadata = privatePageMetadata('Free Preview');

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
