import Link from 'next/link';
import { ArrowRight, BookOpen, Inbox, Users, CheckCircle2 } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminSignInRequired } from '@/components/admin/AdminSignInRequired';
import { StatTile } from '@/components/admin/StatTile';
import { RequestCard } from '@/components/admin/RequestCard';
import { ActivityItem } from '@/components/admin/ActivityItem';
import { EmptyState } from '@/components/admin/EmptyState';
import { BOOKS } from '@/content/books';
import { PRODUCT_CATALOGUE } from '@/lib/access/products';
import { isCurrentUserAdmin } from '@/lib/server/adminSession';
import { getDb } from '@/lib/server/db';
import { listPaymentRequestsForAdmin } from '@/lib/server/paymentRequests';
import { getTotalActiveAccessGrants, getTotalUniqueReaders } from '@/lib/server/adminStats';

function bookTitleForProduct(productId: string): string {
  return PRODUCT_CATALOGUE.find((p) => p.id === productId)?.name ?? productId;
}

// Prompt 65: the Author Dashboard home — replaces the old technical
// "Admin / Payment requests" console (Prompt 28) with the same underlying
// data, presented so a non-technical author understands it in a few
// seconds (see the prompt's own success criteria). Every number here comes
// from the existing, unmodified payment-request/entitlement tables — see
// lib/server/adminStats.ts's own comment on why each stat is safely
// derivable, never invented. Auth check is identical to the original page
// (Prompt 28, Phase 8) — server-authoritative, never a client flag.
export default async function AdminDashboardPage() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return <AdminSignInRequired />;

  const db = getDb();
  const pending = await listPaymentRequestsForAdmin(db, 'pending');
  const reviewed = (await listPaymentRequestsForAdmin(db)).filter((r) => r.status !== 'pending');
  const totalReaders = await getTotalUniqueReaders(db);
  const totalAccessGrants = await getTotalActiveAccessGrants(db);

  const pendingPreview = pending.slice(0, 3);
  const reviewedPreview = reviewed.slice(0, 3);

  return (
    <AdminShell>
      <div className="space-y-6 px-4 py-4">
        <div>
          <p className="type-body text-sand/70">Manage your books, access requests, and readers.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <StatTile icon={BookOpen} label="Books" value={BOOKS.length} />
            <StatTile icon={Inbox} label="Pending" value={pending.length} />
            <StatTile icon={Users} label="Readers" value={totalReaders} />
            <StatTile icon={CheckCircle2} label="Access Granted" value={totalAccessGrants} />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="type-label uppercase tracking-widest text-sand/65">Needs Your Attention</p>
            {pending.length > pendingPreview.length ? (
              <Link href="/admin/requests" className="flex shrink-0 items-center gap-1 type-meta font-medium text-clay-light">
                See all <ArrowRight size={12} />
              </Link>
            ) : null}
          </div>
          {pending.length === 0 ? (
            <EmptyState icon={CheckCircle2} heading="You're all caught up." body="No access requests are waiting for review." />
          ) : (
            <div className="space-y-3">
              {pendingPreview.map((req) => (
                <RequestCard key={req.id} request={req} bookTitle={bookTitleForProduct(req.productId)} />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="type-label uppercase tracking-widest text-sand/65">Recent Activity</p>
            {reviewed.length > reviewedPreview.length ? (
              <Link href="/admin/requests" className="flex shrink-0 items-center gap-1 type-meta font-medium text-clay-light">
                See all <ArrowRight size={12} />
              </Link>
            ) : null}
          </div>
          {reviewed.length === 0 ? (
            <EmptyState icon={Inbox} heading="No recent activity yet." body="Approved and declined requests will show up here." />
          ) : (
            <div className="space-y-2">
              {reviewedPreview.map((req) => (
                <ActivityItem key={req.id} request={req} bookTitle={bookTitleForProduct(req.productId)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
