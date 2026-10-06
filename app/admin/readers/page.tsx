import { Users } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminSignInRequired } from '@/components/admin/AdminSignInRequired';
import { EmptyState } from '@/components/admin/EmptyState';
import { BOOKS } from '@/content/books';
import { AdminPlatformOnly } from '@/components/admin/AdminPlatformOnly';
import { getAdminActor, isPlatformAdminActor } from '@/lib/server/adminActor';
import { getDb } from '@/lib/server/db';
import { getReaderCountsByBook } from '@/lib/server/adminStats';

// Prompt 65 (Phase 8): "Readers" — a per-book count only, never a per-
// person list. The existing schema has no email/name for a reader (this
// app's identity model is anonymous — see lib/server/identity.ts), so
// there is nothing safe to show BELOW the book level: no session tokens,
// magic-link tokens, entitlement ids, or raw user UUIDs. A per-book COUNT
// is the one thing getReaderCountsByBook() can compute honestly from the
// existing entitlements table without inventing or exposing anything new.
export default async function AdminReadersPage() {
  // Server-side authorization (lib/server/adminActor.ts): platform admins only.
  const actor = await getAdminActor();
  if (!actor) return <AdminSignInRequired />;
  if (!isPlatformAdminActor(actor)) return <AdminPlatformOnly />;

  const db = getDb();
  const readerCounts = await getReaderCountsByBook(db);
  const total = Object.values(readerCounts).reduce((sum, n) => sum + n, 0);

  return (
    <AdminShell variant="platform">
      <div className="px-4 py-4">
        <p className="mb-3 type-label uppercase tracking-widest text-sand/65">Readers</p>
        {total === 0 ? (
          <EmptyState icon={Users} heading="No readers yet." body="Once you approve an access request, readers will show up here." />
        ) : (
          <div className="space-y-2">
            {BOOKS.map((book) => {
              const count = readerCounts[book.id] ?? 0;
              return (
                <div key={book.id} className="flex items-center justify-between rounded-2xl border border-sand/10 bg-ink-card p-3.5">
                  <p className="type-body text-sand-light">{book.title}</p>
                  <div className="flex items-center gap-1.5 text-sand/65">
                    <Users size={13} />
                    <p className="type-body font-medium">{count}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-4 type-label text-sand/65">
          A reader is anyone with active access to a book. This app doesn't collect reader names or emails, so only counts are shown
          here.
        </p>
      </div>
    </AdminShell>
  );
}
