import Link from 'next/link';
import type { Book } from '@/content/books';
import { BookCover } from './BookCover';
import { Badge } from '@/components/ui/Badge';

export function BookCard({ book }: { book: Book }) {
  return (
    <Link href={`/books/${book.id}`} className="block w-36 shrink-0">
      <BookCover book={book} />
      <p className="mt-2 line-clamp-2 text-sm font-medium text-sand-light">{book.title}</p>
      <p className="text-xs text-sand/50">{book.author}</p>
      <div className="mt-1">
        <Badge tone={book.status === 'readable' ? 'sand' : 'neutral'}>{book.priceDisplay}</Badge>
      </div>
    </Link>
  );
}
