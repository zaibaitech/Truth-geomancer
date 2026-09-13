import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import { BOOKS } from '@/content/books';
import { BookCover } from '@/components/books/BookCover';
import { Badge } from '@/components/ui/Badge';

export function RecommendedBooks() {
  return (
    <div className="px-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex items-center gap-1.5">
          <BookOpen size={15} className="text-clay-light" />
          <h2 className="type-body font-semibold text-sand-light">Recommended Books</h2>
        </div>
        <Link href="/books" className="flex items-center gap-1 type-meta font-medium text-clay-light">
          See all <ArrowRight size={12} />
        </Link>
      </div>
      <div className="scrollbar-none flex gap-3 overflow-x-auto pb-1">
        {BOOKS.map((book) => (
          <Link key={book.id} href={`/books/${book.id}`} className="block w-[168px] shrink-0">
            <div className="overflow-hidden rounded-xl border border-sand/15 shadow-[0_8px_20px_-10px_rgba(0,0,0,0.6)]">
              <BookCover book={book} />
            </div>
            <p className="mt-2 line-clamp-2 type-body font-medium leading-snug text-sand-light">{book.title}</p>
            <p className="line-clamp-1 type-meta text-sand/65">{book.subtitle}</p>
            <div className="mt-1.5">
              <Badge tone={book.status === 'readable' ? 'sand' : 'neutral'}>{book.priceDisplay}</Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
