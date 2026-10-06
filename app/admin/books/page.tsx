import { AdminShell } from '@/components/admin/AdminShell';
import { AdminSignInRequired } from '@/components/admin/AdminSignInRequired';
import { BookAdminCard } from '@/components/admin/BookAdminCard';
import { BOOKS } from '@/content/books';
import { getAdminActor, isPlatformAdminActor } from '@/lib/server/adminActor';
import { getDb } from '@/lib/server/db';
import { getReaderCountsByBook } from '@/lib/server/adminStats';

// Prompt 65 (Phase 7): "My Books" — every book comes from the existing
// content/books.ts catalogue (BOOKS), never hardcoded here. Reader counts
// come from getReaderCountsByBook(), which correctly attributes a bundle
// owner as a reader of BOTH books rather than neither (see
// lib/server/adminStats.ts).
export default async function AdminBooksPage() {
  // Server-side authorization (lib/server/adminActor.ts): platform admins see
  // every book; an author sees ONLY the books assigned to them.
  const actor = await getAdminActor();
  if (!actor) return <AdminSignInRequired />;
  const books = BOOKS.filter((book) => actor.bookIds.includes(book.id));

  const db = getDb();
  // Customer readers only (active entitlements) — staff access never counts.
  const readerCounts = await getReaderCountsByBook(db);

  return (
    <AdminShell variant={isPlatformAdminActor(actor) ? 'platform' : 'author'}>
      <div className="px-4 py-4">
        <p className="mb-3 type-label uppercase tracking-widest text-sand/65">
          {isPlatformAdminActor(actor) ? 'All Books' : 'My Books'} ({books.length})
        </p>
        {books.length === 0 ? (
          <p className="type-body text-sand/70">No books are assigned to you yet. A platform administrator can assign them.</p>
        ) : null}
        <div className="space-y-3">
          {books.map((book) => (
            <BookAdminCard key={book.id} book={book} readerCount={readerCounts[book.id] ?? 0} />
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
