import Link from 'next/link';
import { Clock, Lock, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { ProductAccessStatus } from '@/lib/server/purchaseStatus';

/**
 * The "you don't have access to this yet" screen for a protected book or
 * method (Prompt 27, Phase 10; extended in Prompt 28, Phase 13 to reflect
 * the real payment-request status instead of a static "not live yet"
 * message). Deliberately plain and consistent with the rest of the app's
 * card/button language, not a new visual system: this is a state a reader
 * hits, not a marketing page.
 *
 * No protected content is ever passed into or rendered by this component
 * — it is the alternative to rendering protected content, not a wrapper
 * around it. `productId` is optional so existing call sites that haven't
 * been updated keep working; every Prompt 27 call site now passes it.
 */
export function BookAccessGate({
  bookTitle,
  productId,
  status = 'none',
}: {
  bookTitle: string;
  productId?: string;
  status?: ProductAccessStatus | 'none';
}) {
  if (status === 'pending') {
    return (
      <div className="px-4 py-6">
        <Card className="text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-sand/15 text-clay-light">
            <Clock size={16} aria-hidden />
          </div>
          <p className="mt-3 type-body font-semibold text-sand-light">Payment review pending</p>
          <p className="mt-1.5 type-body text-sand/70">
            Your payment request for {bookTitle} is awaiting review. You’ll get access as soon as it’s approved.
          </p>
          <Link
            href="/purchase"
            className="mt-4 inline-block min-h-[44px] rounded-xl border border-sand/15 px-4 py-2.5 type-body text-sand-light"
          >
            View my requests
          </Link>
        </Card>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="px-4 py-6">
        <Card className="text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-sand/15 text-clay-light">
            <XCircle size={16} aria-hidden />
          </div>
          <p className="mt-3 type-body font-semibold text-sand-light">Payment request not approved</p>
          <p className="mt-1.5 type-body text-sand/70">
            Your last payment request for {bookTitle} wasn’t approved. You can submit a new one.
          </p>
          <Link
            href={productId ? `/purchase/${productId}` : '/purchase'}
            className="mt-4 inline-block min-h-[44px] rounded-xl bg-clay px-4 py-2.5 type-body font-semibold text-ink"
          >
            Submit a new request
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <Card className="text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-sand/15 text-clay-light">
          <Lock size={16} aria-hidden />
        </div>
        <p className="mt-3 type-body font-semibold text-sand-light">This book isn’t in your library yet</p>
        <p className="mt-1.5 type-body text-sand/70">{bookTitle} requires an active entitlement to read.</p>
        <Link
          href={productId ? `/purchase/${productId}` : '/purchase'}
          className="mt-4 inline-block min-h-[44px] rounded-xl bg-clay px-4 py-2.5 type-body font-semibold text-ink"
        >
          Request access
        </Link>
      </Card>
    </div>
  );
}
