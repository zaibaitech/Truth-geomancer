import { CheckCircle2, Inbox } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminSignInRequired } from '@/components/admin/AdminSignInRequired';
import { RequestCard } from '@/components/admin/RequestCard';
import { ActivityItem } from '@/components/admin/ActivityItem';
import { EmptyState } from '@/components/admin/EmptyState';
import { PRODUCT_CATALOGUE } from '@/lib/access/products';
import { isCurrentUserAdmin } from '@/lib/server/adminSession';
import { getDb } from '@/lib/server/db';
import { listPaymentRequestsForAdmin } from '@/lib/server/paymentRequests';

function bookTitleForProduct(productId: string): string {
  return PRODUCT_CATALOGUE.find((p) => p.id === productId)?.name ?? productId;
}

// Prompt 65: the full Access Requests workspace — same data and the same
// RequestCard/ActivityItem the Dashboard home previews, just complete
// rather than capped to 3. Prompt 28's own 25-item cap on "recently
// reviewed" is preserved unchanged (see listPaymentRequestsForAdmin's own
// ordering — newest first).
export default async function AdminRequestsPage() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return <AdminSignInRequired />;

  const db = getDb();
  const pending = await listPaymentRequestsForAdmin(db, 'pending');
  const reviewed = (await listPaymentRequestsForAdmin(db)).filter((r) => r.status !== 'pending').slice(0, 25);

  return (
    <AdminShell>
      <div className="space-y-6 px-4 py-4">
        <div>
          <p className="mb-2 type-label uppercase tracking-widest text-sand/65">Needs Your Attention ({pending.length})</p>
          {pending.length === 0 ? (
            <EmptyState icon={CheckCircle2} heading="You're all caught up." body="No access requests are waiting for review." />
          ) : (
            <div className="space-y-3">
              {pending.map((req) => (
                <RequestCard key={req.id} request={req} bookTitle={bookTitleForProduct(req.productId)} />
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 type-label uppercase tracking-widest text-sand/65">Recent Activity</p>
          {reviewed.length === 0 ? (
            <EmptyState icon={Inbox} heading="No recent activity yet." body="Approved and declined requests will show up here." />
          ) : (
            <div className="space-y-2">
              {reviewed.map((req) => (
                <ActivityItem key={req.id} request={req} bookTitle={bookTitleForProduct(req.productId)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
