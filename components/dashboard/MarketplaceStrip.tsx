import Link from 'next/link';
import { BOOKS } from '@/content/books';
import { BookCard } from '@/components/books/BookCard';

export function MarketplaceStrip() {
  return (
    <div className="px-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-sand-light">Manuscript Library</h2>
        <Link href="/books" className="text-xs text-clay-light">
          See all
        </Link>
      </div>
      <div className="scrollbar-none flex gap-3 overflow-x-auto pb-1">
        {BOOKS.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
}
