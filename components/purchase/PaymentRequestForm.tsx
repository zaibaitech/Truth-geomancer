'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductPaymentInstructions } from '@/lib/access/paymentInstructions';

// Prompt 28, Phase 5/11: posts to the server route, which resolves the
// current user from the session cookie — this component never sends a
// userId of any kind. On success, router.refresh() re-renders the parent
// Server Component with the fresh (now "pending") status from the
// database, rather than this component guessing/faking that state itself.
export function PaymentRequestForm({
  productId,
  instructions,
}: {
  productId: string;
  instructions: ProductPaymentInstructions;
}) {
  const router = useRouter();
  const [paymentReference, setPaymentReference] = useState('');
  const [userNote, setUserNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/payment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, paymentReference, userNote: userNote.trim() || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Something went wrong.' }));
        setError(body.error ?? 'Something went wrong.');
        setSubmitting(false);
        return;
      }
      router.refresh();
    } catch {
      setError('Could not reach the server. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <div className="rounded-xl border border-sand/10 bg-ink px-3.5 py-3">
        <p className="type-label uppercase tracking-widest text-sand/65">{instructions.title}</p>
        <p className="mt-1.5 type-body text-sand/70">{instructions.instructions}</p>
        <p className="mt-2 type-evidence text-sand/65">{instructions.referenceGuidance}</p>
      </div>

      <div>
        <label htmlFor="paymentReference" className="type-label text-sand/65">
          Payment reference
        </label>
        <input
          id="paymentReference"
          value={paymentReference}
          onChange={(e) => setPaymentReference(e.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-sand/15 bg-ink px-3.5 py-2.5 type-body text-sand-light"
          placeholder="e.g. transaction ID or confirmation code"
        />
      </div>

      <div>
        <label htmlFor="userNote" className="type-label text-sand/65">
          Note (optional)
        </label>
        <textarea
          id="userNote"
          value={userNote}
          onChange={(e) => setUserNote(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-sand/15 bg-ink px-3.5 py-2.5 type-body text-sand-light"
          placeholder={instructions.whatToSubmit}
        />
      </div>

      {error ? <p className="type-body text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting || paymentReference.trim().length === 0}
        className="min-h-[44px] w-full rounded-xl bg-clay px-4 py-2.5 type-body font-semibold text-ink disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit payment request'}
      </button>
    </form>
  );
}
