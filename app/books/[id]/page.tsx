import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BookCover } from '@/components/books/BookCover';
import { BOOKS, getBookById } from '@/content/books';
import { CHAPTERS } from '@/content/manuscripts/master-of-geomancy-vol1';

export function generateStaticParams() {
  return BOOKS.map((b) => ({ id: b.id }));
}

export default function BookDetailPage({ params }: { params: { id: string } }) {
  const book = getBookById(params.id);
  if (!book) notFound();

  const chapters = book.id === 'master-of-geomancy-vol-1' ? CHAPTERS : [];

  return (
    <div>
      <Header />
      <div className="px-4 py-4">
        <div className="flex gap-4">
          <BookCover book={book} className="w-28 shrink-0" />
          <div>
            <h1 className="font-logo text-xl text-sand-light">{book.title}</h1>
            <p className="text-sm text-sand/50">{book.subtitle}</p>
            <p className="mt-0.5 text-xs text-sand/35">{book.author}</p>
            <div className="mt-2">
              <Badge tone={book.status === 'readable' ? 'sand' : 'neutral'}>{book.priceDisplay}</Badge>
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-sand/70">{book.description}</p>

        {book.status === 'readable' ? (
          <Link
            href={`/books/${book.id}/read/${chapters[0]?.id}`}
            className="mt-5 block rounded-xl bg-clay px-4 py-3 text-center text-sm font-semibold text-ink"
          >
            Start Reading
          </Link>
        ) : (
          <div className="mt-5 rounded-xl border border-sand/15 px-4 py-3 text-center text-sm text-sand/50">
            This volume is not yet available.
          </div>
        )}

        {chapters.length > 0 ? (
          <div className="mt-6">
            <p className="mb-2 text-[11px] uppercase tracking-widest text-sand/45">Contents</p>
            <Card padding="p-0">
              {chapters.map((ch, i) => (
                <Link
                  key={ch.id}
                  href={`/books/${book.id}/read/${ch.id}`}
                  className={`flex items-center justify-between px-4 py-3 text-sm ${
                    i !== chapters.length - 1 ? 'border-b border-sand/10' : ''
                  }`}
                >
                  <span className="text-sand-light/90">
                    <span className="mr-2 text-sand/40">{ch.number}.</span>
                    {ch.title}
                  </span>
                  <ChevronRight size={16} className="text-sand/30" />
                </Link>
              ))}
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
