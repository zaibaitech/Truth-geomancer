import Link from 'next/link';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { SignInPrompt } from '@/components/auth/SignInPrompt';
import { Card } from '@/components/ui/Card';
import { COMPLETE_LIBRARY_PRODUCT, KANZUL_PRODUCT, MASTER_PRODUCT, PURCHASABLE_PRODUCTS } from '@/lib/access/products';
import { bundleSaving, formatPrice, paystackPriceFor } from '@/lib/server/paystackCatalogue';
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

// Lists PURCHASABLE_PRODUCTS (derived from PRODUCT_CATALOGUE — never a second
// product list). Prices come from the server-side Paystack catalogue only.
export default async function PurchasePage() {
  const user = await getCurrentUserIfPresent();
  const db = user ? getDb() : null;

  const activeProducts = PURCHASABLE_PRODUCTS;
  const statuses = await Promise.all(
    activeProducts.map((product) => (user && db ? getProductAccessStatus(db, user.id, product.id) : Promise.resolve('none' as const))),
  );

  // Server-known sign-in state, so the Sign in entry points are in the first
  // HTML rather than appearing only after a client-side status check.
  const auth = { authenticated: Boolean(user?.email), email: user?.email ?? null };

  return (
    <div>
      <Header title="Get access" subtitle="Request access to a book or bundle" initialAuth={auth} />
      <div className="px-4">
        <SignInPrompt message="Already paid, or bought on another device?" initialStatus={auth} />
      </div>
      <div className="space-y-3 px-4 py-4">
        {activeProducts.map((product, i) => {
          const status = statuses[i];
          const price = paystackPriceFor(product.id);
          const isBundle = product.id === COMPLETE_LIBRARY_PRODUCT.id;
          const saving = isBundle ? bundleSaving(product.id, [MASTER_PRODUCT.id, KANZUL_PRODUCT.id]) : null;
          const individual = saving && price ? { minor: price.minor + saving.minor, currency: price.currency } : null;
          return (
            <Card key={product.id} className={isBundle ? 'border border-clay/40' : undefined}>
              {isBundle ? <p className="type-label uppercase tracking-widest text-clay-light">Best value</p> : null}
              <p className="type-body font-semibold text-sand-light">{product.name}</p>
              <p className="mt-1 type-body text-sand/70">{isBundle ? 'Master of Geomancy Vol. 1 + Kanzul Mikban' : product.description}</p>
              {price ? <p className="mt-2 type-body font-semibold text-sand-light">{formatPrice(price)}</p> : null}
              {isBundle && individual && saving && saving.minor > 0 ? (
                <dl className="mt-2 space-y-0.5 type-label text-sand/70">
                  <div className="flex justify-between gap-3">
                    <dt>Individual value</dt>
                    <dd>{formatPrice(individual)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Bundle price</dt>
                    <dd>{formatPrice(price!)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 text-clay-light">
                    <dt>You save</dt>
                    <dd>{formatPrice(saving)}</dd>
                  </div>
                </dl>
              ) : null}
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
