import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getBookById } from '@/content/books';

// SEO only: the reader is entitlement-gated, so it is not indexed (the
// public book page /books/[id] is the canonical, indexable one). Renders
// children unchanged.
export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const book = getBookById(params.id);
  return { title: book ? `Read ${book.title}` : 'Read', robots: { index: false, follow: false } };
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
