import { Header } from '@/components/layout/Header';
import { BookCard } from '@/components/books/BookCard';
import { BOOKS } from '@/content/books';
import { getCurrentUserIfPresent } from '@/lib/server/session';
import { getDb } from '@/lib/server/db';
import { canAccessForUser } from '@/lib/server/accessService';

// Prompt 78: entitlement checked per book with the same canAccessForUser()
// the book detail page and casting authorization already use, so the
// listing's badge stops claiming every visitor already owns both books
// (see BookCard.tsx's own comment for the contradiction this fixes).
export default async function BooksPage() {
  const user = await getCurrentUserIfPresent();
  const db = user ? getDb() : null;
  const entitlements = await Promise.all(
    BOOKS.map((book) => (user && db ? canAccessForUser(db, user.id, { kind: 'book', bookId: book.id }) : Promise.resolve(false))),
  );

  return (
    <div>
      <Header title="Library" subtitle="Manuscripts to own and read" />
      <div className="grid grid-cols-2 gap-4 px-4 py-4">
        {BOOKS.map((book, i) => (
          <BookCard key={book.id} book={book} entitled={entitlements[i]} />
        ))}
      </div>
    </div>
  );
}
