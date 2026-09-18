import { AdminShell } from '@/components/admin/AdminShell';
import { AdminSignInRequired } from '@/components/admin/AdminSignInRequired';
import { BookAdminCard } from '@/components/admin/BookAdminCard';
import { BOOKS } from '@/content/books';
import { isCurrentUserAdmin } from '@/lib/server/adminSession';
import { getDb } from '@/lib/server/db';
import { getReaderCountsByBook } from '@/lib/server/adminStats';

// Prompt 65 (Phase 7): "My Books" — every book comes from the existing
// content/books.ts catalogue (BOOKS), never hardcoded here. Reader counts
// come from getReaderCountsByBook(), which correctly attributes a bundle
// owner as a reader of BOTH books rather than neither (see
// lib/server/adminStats.ts).
export default async function AdminBooksPage() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return <AdminSignInRequired />;

  const db = getDb();
  const readerCounts = await getReaderCountsByBook(db);

  return (
    <AdminShell>
      <div className="px-4 py-4">
        <p className="mb-3 type-label uppercase tracking-widest text-sand/65">My Books ({BOOKS.length})</p>
        <div className="space-y-3">
          {BOOKS.map((book) => (
            <BookAdminCard key={book.id} book={book} readerCount={readerCounts[book.id] ?? 0} />
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
