import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { PaymentRequestActions } from '@/components/admin/PaymentRequestActions';
import { PRODUCT_CATALOGUE } from '@/lib/access/products';
import { isCurrentUserAdmin } from '@/lib/server/adminSession';
import { getDb } from '@/lib/server/db';
import { listPaymentRequestsForAdmin } from '@/lib/server/paymentRequests';

function productName(productId: string): string {
  return PRODUCT_CATALOGUE.find((p) => p.id === productId)?.name ?? productId;
}

// Prompt 28, Phase 8: server-authoritative admin check — this page never
// renders any payment-request data unless isCurrentUserAdmin() (which
// reads only a cookie whose value hashes to a real, fresh row in
// admin_sessions) returns true. There is no client-side flag, query
// parameter, or hidden button that can substitute for this check.
export default function AdminDashboardPage() {
  const isAdmin = isCurrentUserAdmin();

  if (!isAdmin) {
    return (
      <div>
        <Header title="Admin" />
        <div className="px-4 py-6">
          <Card>
            <p className="type-body font-semibold text-sand-light">Administrator sign-in required</p>
            <p className="mt-1.5 type-body text-sand/70">This page is only visible to the configured administrator.</p>
            <AdminLoginForm />
          </Card>
        </div>
      </div>
    );
  }

  const db = getDb();
  const pending = listPaymentRequestsForAdmin(db, 'pending');
  const reviewed = listPaymentRequestsForAdmin(db).filter((r) => r.status !== 'pending').slice(0, 25);

  return (
    <div>
      <Header title="Admin" subtitle="Payment requests" />
      <div className="space-y-6 px-4 py-4">
        <div>
          <p className="mb-2 type-label uppercase tracking-widest text-sand/65">Pending ({pending.length})</p>
          {pending.length === 0 ? (
            <Card>
              <p className="type-body text-sand/65">No pending requests.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pending.map((req) => (
                <Card key={req.id}>
                  <p className="type-body font-semibold text-sand-light">{productName(req.productId)}</p>
                  {/* Anonymous-identity model: the only user reference that
                      exists is the opaque server-assigned userId — no
                      email/name is ever collected, so this is honestly all
                      an admin has to cross-check a request against. */}
                  <p className="mt-1 type-label text-sand/65">User: {req.userId}</p>
                  <p className="mt-1 type-label text-sand/65">Request: {req.id}</p>
                  <p className="mt-1.5 type-body text-sand-light">Reference: {req.paymentReference}</p>
                  {req.userNote ? <p className="mt-1 type-body text-sand/70">Note: {req.userNote}</p> : null}
                  <p className="mt-1 type-label text-sand/65">Submitted {new Date(req.submittedAt).toLocaleString()}</p>
                  <PaymentRequestActions requestId={req.id} />
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 type-label uppercase tracking-widest text-sand/65">Recently reviewed</p>
          {reviewed.length === 0 ? (
            <Card>
              <p className="type-body text-sand/65">Nothing reviewed yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {reviewed.map((req) => (
                <Card key={req.id}>
                  <div className="flex items-center justify-between">
                    <p className="type-body font-semibold text-sand-light">{productName(req.productId)}</p>
                    <span className="type-label text-sand/65">{req.status}</span>
                  </div>
                  <p className="mt-1 type-label text-sand/65">User: {req.userId}</p>
                  <p className="mt-1 type-body text-sand-light">Reference: {req.paymentReference}</p>
                  {req.adminNote ? <p className="mt-1 type-body text-sand/70">Admin note: {req.adminNote}</p> : null}
                  {req.reviewedAt ? (
                    <p className="mt-1 type-label text-sand/65">
                      Reviewed {new Date(req.reviewedAt).toLocaleString()} by {req.reviewedBy}
                    </p>
                  ) : null}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
