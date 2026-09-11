import { Header } from '@/components/layout/Header';
import { BookCard } from '@/components/books/BookCard';
import { BOOKS } from '@/content/books';

export default function BooksPage() {
  return (
    <div>
      <Header title="Library" subtitle="Manuscripts to own and read" />
      <div className="grid grid-cols-2 gap-4 px-4 py-4">
        {BOOKS.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
}
