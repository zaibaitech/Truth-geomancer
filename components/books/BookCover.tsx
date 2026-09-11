import { BookMarked } from 'lucide-react';
import type { Book } from '@/content/books';

export function BookCover({ book, className = '' }: { book: Book; className?: string }) {
  return (
    <div
      className={`flex aspect-[3/4] items-center justify-center rounded-lg border border-sand/15 ${className}`}
      style={{ background: `linear-gradient(155deg, ${book.coverFrom}, ${book.coverTo})` }}
    >
      <BookMarked size={28} className="text-sand/40" strokeWidth={1.5} />
    </div>
  );
}
