'use client';

import { useState } from 'react';

// Starts an automated Paystack checkout, as a faster alternative to
// PaymentRequestForm's manual reference-and-review flow — both are offered
// side by side on the same page; neither replaces the other. Unlike that
// form, a successful checkout never calls router.refresh() itself: the
// browser navigates away to Paystack's own hosted page, and access is
// granted server-side (app/api/paystack/{webhook,callback}) by the time the
// buyer is sent back here.
export function PaystackCheckoutButton({ productId, priceLabel }: { productId: string; priceLabel: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/paystack/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, email }),
      });
      const body = await res.json().catch(() => ({ error: 'Something went wrong.' }));
      if (!res.ok) {
        setError(body.error ?? 'Something went wrong.');
        setSubmitting(false);
        return;
      }
      if (body.alreadyOwned) {
        window.location.href = '/books';
        return;
      }
      // Leaving the app for Paystack's own hosted page — a full navigation,
      // not a popup, so the card form is clearly on Paystack's own domain.
      window.location.href = body.authorizationUrl;
    } catch {
      setError('Could not reach the server. Please try again.');
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[44px] w-full rounded-xl bg-clay px-4 py-2.5 type-body font-semibold text-ink"
      >
        Pay by card — {priceLabel}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-xl border border-sand/10 bg-ink px-3.5 py-3">
      <div>
        <label htmlFor="paystack-email" className="type-label text-sand/65">
          Email address
        </label>
        <input
          id="paystack-email"
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-xl border border-sand/15 bg-ink px-3.5 py-2.5 type-body text-sand-light"
          placeholder="you@example.com"
        />
        <p className="mt-1.5 type-evidence text-sand/65">Paystack sends your receipt here.</p>
      </div>

      {error ? <p className="type-body text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting || !email}
        className="min-h-[44px] w-full rounded-xl bg-clay px-4 py-2.5 type-body font-semibold text-ink disabled:opacity-50"
      >
        {submitting ? 'Opening Paystack…' : `Continue — ${priceLabel}`}
      </button>
    </form>
  );
}
