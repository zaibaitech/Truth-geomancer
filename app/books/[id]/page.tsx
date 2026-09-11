import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { BookCover } from '@/components/books/BookCover';
import { ChapterList } from '@/components/books/ChapterList';
import { BOOKS, getBookById } from '@/content/books';
import { getChapterList } from '@/lib/books/chapters';

export function generateStaticParams() {
  return BOOKS.map((b) => ({ id: b.id }));
}

export default function BookDetailPage({ params }: { params: { id: string } }) {
  const book = getBookById(params.id);
  if (!book) notFound();

  const chapters = getChapterList(book.id);

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
            <ChapterList bookId={book.id} chapters={chapters} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
