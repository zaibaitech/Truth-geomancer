import Link from 'next/link';
import type { Book } from '@/content/books';
import { BookCover } from './BookCover';
import { Badge } from '@/components/ui/Badge';

export function BookCard({ book }: { book: Book }) {
  return (
    <Link href={`/books/${book.id}`} className="block w-full">
      <BookCover book={book} />
      <p className="mt-2 line-clamp-2 type-body font-medium text-sand-light">{book.title}</p>
      <p className="type-meta text-sand/65">{book.subtitle}</p>
      <div className="mt-1">
        <Badge tone={book.status === 'readable' ? 'sand' : 'neutral'}>{book.priceDisplay}</Badge>
      </div>
    </Link>
  );
}
