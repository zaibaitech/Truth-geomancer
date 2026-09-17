import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { PaymentRequestForm } from '@/components/purchase/PaymentRequestForm';
import { WhatsAppButton } from '@/components/whatsapp/WhatsAppButton';
import { PRODUCT_CATALOGUE } from '@/lib/access/products';
import { getPaymentInstructions } from '@/lib/access/paymentInstructions';
import { getCurrentUserIfPresent } from '@/lib/server/session';
import { getDb } from '@/lib/server/db';
import { getProductAccessStatus } from '@/lib/server/purchaseStatus';
import { getPaymentRequestsForUser } from '@/lib/server/paymentRequests';
import { buildAccessHelpMessage, buildPaymentHelpMessage, buildProductContactMessage } from '@/lib/whatsapp';

// Prompt 28, Phase 5: a plain Server Component page render cannot write a
// cookie (see session.ts's own comment on getCurrentUser() vs.
// getCurrentUserIfPresent()), so this page reads with the read-only
// getCurrentUserIfPresent() only, exactly like every other Prompt 27
// gated page. A first-time visitor with no session yet simply has no
// existing request to show (status defaults to 'none') — the form is
// still rendered, and submitting it is what actually creates their
// session, inside the Route Handler (POST /api/payment-requests), which
// legitimately calls the cookie-writing getCurrentUser().
export default async function ProductPurchasePage({ params }: { params: { productId: string } }) {
  const product = PRODUCT_CATALOGUE.find((p) => p.id === params.productId && p.active);
  if (!product) notFound();

  const instructions = getPaymentInstructions(product.id);
  if (!instructions) notFound();

  const user = await getCurrentUserIfPresent();
  const db = user ? getDb() : null;
  const status = user && db ? await getProductAccessStatus(db, user.id, product.id) : 'none';
  const myRequests =
    user && db ? (await getPaymentRequestsForUser(db, user.id)).filter((r) => r.productId === product.id) : [];
  const mostRecent = myRequests[0];

  return (
    <div>
      <Header title={product.name} subtitle="Request access" />
      <div className="px-4 py-4">
        <Card>
          <p className="type-body text-sand/70">{product.description}</p>
        </Card>

        {status === 'active' ? (
          <Card className="mt-3 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-sand/15 text-clay-light">
              <CheckCircle2 size={16} aria-hidden />
            </div>
            <p className="mt-3 type-body font-semibold text-sand-light">You already have access</p>
            <Link href="/books" className="mt-4 inline-block min-h-[44px] rounded-xl border border-sand/15 px-4 py-2.5 type-body text-sand-light">
              Go to your library
            </Link>
            <div className="mt-2">
              <WhatsAppButton message={buildAccessHelpMessage()} label="Trouble accessing it?" variant="subtle" />
            </div>
          </Card>
        ) : status === 'pending' && mostRecent ? (
          <Card className="mt-3 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-sand/15 text-clay-light">
              <Clock size={16} aria-hidden />
            </div>
            <p className="mt-3 type-body font-semibold text-sand-light">Payment review pending</p>
            <p className="mt-1.5 type-body text-sand/70">
              Reference: <span className="text-sand-light">{mostRecent.paymentReference}</span>
            </p>
            <p className="mt-1 type-label text-sand/65">Submitted {new Date(mostRecent.submittedAt).toLocaleDateString()}</p>
          </Card>
        ) : (
          <>
            {status === 'rejected' && mostRecent ? (
              <Card className="mt-3">
                <div className="flex items-center gap-2">
                  <XCircle size={16} className="text-sand/65" aria-hidden />
                  <p className="type-body font-semibold text-sand-light">Your last request wasn’t approved</p>
                </div>
                {mostRecent.adminNote ? <p className="mt-1.5 type-body text-sand/70">Note: {mostRecent.adminNote}</p> : null}
                <p className="mt-1.5 type-body text-sand/70">You can submit a new request below.</p>
              </Card>
            ) : null}
            <PaymentRequestForm productId={product.id} instructions={instructions} />
          </>
        )}

        <Card className="mt-3">
          <p className="type-label uppercase tracking-widest text-sand/65">Need help?</p>
          <p className="mt-1.5 type-body text-sand/70">
            Message the author directly on WhatsApp — to ask a question before requesting access, or for help with a
            payment you've already made.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <WhatsAppButton message={buildProductContactMessage(product)} label="Ask a question" />
            <WhatsAppButton message={buildPaymentHelpMessage(product)} label="Payment help" variant="subtle" />
          </div>
        </Card>
      </div>
    </div>
  );
}
