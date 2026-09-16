import Link from 'next/link';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { PRODUCT_CATALOGUE } from '@/lib/access/products';
import { getCurrentUserIfPresent } from '@/lib/server/session';
import { getDb } from '@/lib/server/db';
import { getProductAccessStatus, type ProductAccessStatus } from '@/lib/server/purchaseStatus';

const STATUS_LABEL: Record<ProductAccessStatus, string> = {
  active: 'You have access',
  pending: 'Payment review pending',
  rejected: 'Last request not approved',
  none: 'Not purchased',
};

function StatusBadge({ status }: { status: ProductAccessStatus }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 type-label text-clay-light">
        <CheckCircle2 size={13} aria-hidden /> {STATUS_LABEL[status]}
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 type-label text-sand/70">
        <Clock size={13} aria-hidden /> {STATUS_LABEL[status]}
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 type-label text-sand/70">
        <XCircle size={13} aria-hidden /> {STATUS_LABEL[status]}
      </span>
    );
  }
  return <span className="type-label text-sand/65">{STATUS_LABEL[status]}</span>;
}

// Prompt 28, Phase 5/14: uses PRODUCT_CATALOGUE directly — never a second,
// separately maintained product list. No price is shown anywhere: none
// was ever defined (Prompt 25), and none is invented here.
export default async function PurchasePage() {
  const user = await getCurrentUserIfPresent();
  const db = user ? getDb() : null;

  const activeProducts = PRODUCT_CATALOGUE.filter((p) => p.active);
  const statuses = await Promise.all(
    activeProducts.map((product) => (user && db ? getProductAccessStatus(db, user.id, product.id) : Promise.resolve('none' as const))),
  );

  return (
    <div>
      <Header title="Get access" subtitle="Request access to a book or bundle" />
      <div className="space-y-3 px-4 py-4">
        {activeProducts.map((product, i) => {
          const status = statuses[i];
          return (
            <Card key={product.id}>
              <p className="type-body font-semibold text-sand-light">{product.name}</p>
              <p className="mt-1 type-body text-sand/70">{product.description}</p>
              <div className="mt-2">
                <StatusBadge status={status} />
              </div>
              {status !== 'active' ? (
                <Link
                  href={`/purchase/${product.id}`}
                  className="mt-3 inline-block min-h-[44px] rounded-xl border border-sand/15 px-4 py-2.5 type-body text-sand-light"
                >
                  {status === 'pending' ? 'View request' : status === 'rejected' ? 'Submit a new request' : 'Request access'}
                </Link>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
