import Link from 'next/link';
import type { Book } from '@/content/books';
import { BookCover } from './BookCover';
import { Badge } from '@/components/ui/Badge';

// Prompt 78 (launch usability audit): `book.priceDisplay` ("In your
// library") is static per-book content — true for nobody in particular,
// so it used to render unconditionally, telling every visitor they already
// owned a book they hadn't unlocked. The very next screen a locked reader
// reaches (BookAccessGate) already says the opposite ("This book isn't in
// your library yet"), so the two screens contradicted each other one tap
// apart. `entitled` is computed by the caller (app/books/page.tsx) with the
// same canAccessForUser() check the book detail page and casting
// authorization already use — no new access logic, just an honest badge.
export function BookCard({ book, entitled }: { book: Book; entitled: boolean }) {
  return (
    <Link href={`/books/${book.id}`} className="block w-full">
      <BookCover book={book} />
      <p className="mt-2 line-clamp-2 type-body font-medium text-sand-light">{book.title}</p>
      <p className="type-meta text-sand/65">{book.subtitle}</p>
      <div className="mt-1">
        <Badge tone={entitled ? 'sand' : 'neutral'}>{entitled ? book.priceDisplay : 'Not yet unlocked'}</Badge>
      </div>
    </Link>
  );
}
