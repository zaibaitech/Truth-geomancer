import { Card } from '@/components/ui/Card';
import { PaymentRequestActions } from '@/components/admin/PaymentRequestActions';
import type { PaymentRequest } from '@/lib/access/types';

// Prompt 65 (Phase 5): one pending Access Request, shown the way a
// non-technical author needs to see it — book title, payment reference,
// submission date, the customer's own note if they left one. Deliberately
// omits the request's own database identifier and the anonymous customer
// identity the request belongs to — Phase 3's terminology table says
// "never display" / "do not prominently display" for exactly these
// fields. Both still exist in the underlying record (the admin listing
// service still returns them in full) and stay available to any future
// internal tool; they are simply not surfaced in this card. The one
// exception is passing the request's own identifier through, unrendered,
// to PaymentRequestActions below, which needs it to call the right
// approve/decline endpoint.
export function RequestCard({ request, bookTitle }: { request: PaymentRequest; bookTitle: string }) {
  return (
    <Card>
      <p className="type-body font-semibold text-sand-light">{bookTitle}</p>
      <div className="mt-2.5 space-y-1.5">
        <div>
          <p className="type-label uppercase tracking-widest text-sand/65">Payment reference</p>
          <p className="type-body text-sand-light">{request.paymentReference}</p>
        </div>
        {request.userNote ? (
          <div>
            <p className="type-label uppercase tracking-widest text-sand/65">Note from the customer</p>
            <p className="type-body text-sand/70">{request.userNote}</p>
          </div>
        ) : null}
        <div>
          <p className="type-label uppercase tracking-widest text-sand/65">Submitted</p>
          <p className="type-label text-sand/65">
            {new Date(request.submittedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
      <PaymentRequestActions requestId={request.id} />
    </Card>
  );
}
