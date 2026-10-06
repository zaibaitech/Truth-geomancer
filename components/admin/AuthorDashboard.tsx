import { BookOpen } from 'lucide-react';
import { AdminShell } from './AdminShell';
import { BookAdminCard } from './BookAdminCard';
import { EmptyState } from './EmptyState';
import { BOOKS } from '@/content/books';
import { getDb } from '@/lib/server/db';
import { getReaderCountsByBook } from '@/lib/server/adminStats';

/**
 * The author's view of the staff area: ONLY the books assigned to them, with
 * their customer reader counts (active entitlements — staff never counted).
 * No payment requests, no customer emails, no Paystack data, no staff
 * management. `bookIds` comes from the server-resolved AuthorActor.
 */
export async function AuthorDashboard({ bookIds }: { bookIds: string[] }) {
  const books = BOOKS.filter((book) => bookIds.includes(book.id));
  const readerCounts = books.length > 0 ? await getReaderCountsByBook(getDb()) : {};

  return (
    <AdminShell variant="author">
      <div className="space-y-4 px-4 py-4">
        <p className="type-body text-sand/70">
          Your books. You can open and read them in the app at any time — no purchase needed.
        </p>
        {books.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            heading="No books assigned yet."
            body="A platform administrator can assign your books to your account."
          />
        ) : (
          <div className="space-y-3">
            {books.map((book) => (
              <BookAdminCard key={book.id} book={book} readerCount={readerCounts[book.id] ?? 0} />
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
