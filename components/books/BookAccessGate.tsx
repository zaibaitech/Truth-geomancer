import Link from 'next/link';
import { Clock, Lock, Sparkles, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { ProductAccessStatus } from '@/lib/server/purchaseStatus';
import type { PreviewStatus } from '@/lib/server/previewService';

/**
 * The "you don't have access to this yet" screen for a protected book or
 * method (Prompt 27, Phase 10; extended in Prompt 28, Phase 13 to reflect
 * the real payment-request status; extended in Prompt 29, Phase 11 to
 * surface free-preview availability). Deliberately plain and consistent
 * with the rest of the app's card/button language, not a new visual
 * system: this is a state a reader hits, not a marketing page.
 *
 * No protected content is ever passed into or rendered by this component
 * — it is the alternative to rendering protected content, not a wrapper
 * around it. `productId` is optional so existing call sites that haven't
 * been updated keep working; every Prompt 27 call site now passes it.
 *
 * `previewStatus` is only ever 'available' or 'consumed' here (never
 * 'entitled' — this component only renders for a non-entitled viewer by
 * construction, since every call site already gates on `authorized`
 * before reaching it) or 'unconfigured' (no preview line shown at all).
 */
function PreviewLine({ productId, previewStatus }: { productId?: string; previewStatus?: PreviewStatus }) {
  if (!productId || !previewStatus || previewStatus === 'unconfigured' || previewStatus === 'entitled') return null;
  if (previewStatus === 'consumed') {
    return (
      <p className="mt-3 flex items-center justify-center gap-1.5 type-body text-sand/65">
        <Sparkles size={13} aria-hidden /> Free preview used
      </p>
    );
  }
  return (
    <Link
      href={`/preview/${productId}`}
      className="mt-3 flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-clay/30 px-4 py-2.5 type-body font-medium text-clay-light"
    >
      <Sparkles size={13} aria-hidden /> Try a free preview
    </Link>
  );
}

export function BookAccessGate({
  bookTitle,
  productId,
  status = 'none',
  previewStatus,
}: {
  bookTitle: string;
  productId?: string;
  status?: ProductAccessStatus | 'none';
  previewStatus?: PreviewStatus;
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
          <PreviewLine productId={productId} previewStatus={previewStatus} />
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
          <PreviewLine productId={productId} previewStatus={previewStatus} />
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
        <PreviewLine productId={productId} previewStatus={previewStatus} />
      </Card>
    </div>
  );
}
