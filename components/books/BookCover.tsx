import Image from 'next/image';
import { BookMarked } from 'lucide-react';
import type { Book } from '@/content/books';

export function BookCover({ book, className = '' }: { book: Book; className?: string }) {
  if (book.coverImage) {
    return (
      <div className={`relative aspect-[3/4] overflow-hidden rounded-lg border border-sand/15 ${className}`}>
        <Image
          src={book.coverImage}
          alt={`${book.title} cover`}
          fill
          sizes="(max-width: 480px) 45vw, 200px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex aspect-[3/4] items-center justify-center rounded-lg border border-sand/15 ${className}`}
      style={{ background: `linear-gradient(155deg, ${book.coverFrom}, ${book.coverTo})` }}
    >
      <BookMarked size={28} className="text-sand/40" strokeWidth={1.5} />
    </div>
  );
}
