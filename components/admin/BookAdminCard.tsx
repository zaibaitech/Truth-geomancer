import Link from 'next/link';
import { Users } from 'lucide-react';
import { BookCover } from '@/components/books/BookCover';
import type { Book } from '@/content/books';

// Prompt 65 (Phase 7): book identity/status comes entirely from the
// existing content/books.ts catalogue — `status` here is that same
// Book.status field (`readable`/`coming-soon`), never a second,
// admin-only status invented for this card. `readerCount` is passed in
// from lib/server/adminStats.ts's getReaderCountsByBook(), never
// recomputed or guessed here.
export function BookAdminCard({ book, readerCount }: { book: Book; readerCount: number }) {
  const published = book.status === 'readable';

  return (
    <div className="flex gap-3 rounded-2xl border border-sand/12 bg-ink-card p-3">
      <BookCover book={book} className="w-16 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="type-body font-medium text-sand-light">{book.title}</p>
        <p className="type-label text-sand/65">{book.subtitle}</p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${published ? 'bg-emerald-400' : 'bg-sand/40'}`} />
          <p className="type-label text-sand/65">{published ? 'Published' : 'Coming soon'}</p>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-sand/65">
          <Users size={12} />
          <p className="type-label">{readerCount === 1 ? '1 reader' : `${readerCount} readers`}</p>
        </div>
        <Link
          href={`/books/${book.id}`}
          className="mt-2.5 flex min-h-[44px] w-full items-center justify-center rounded-lg border border-sand/15 px-3 type-label font-medium text-sand-light"
        >
          View Book
        </Link>
      </div>
    </div>
  );
}
