'use client';

import { useRef, useState } from 'react';
import { validateCustomerDetails, type CustomerDetails, type CustomerErrors, type CustomerField } from '@/lib/purchase/customer';

// Collects the buyer's details and starts a Paystack hosted checkout. The
// payment METHOD (card, mobile money, bank transfer, ...) is chosen on
// Paystack's own page, not here. This sends details only — the amount is
// decided by the server (app/api/paystack/checkout), which also decides who
// the buyer is from their session. Access is never granted here: the browser
// navigates away to Paystack and is sent back to the product page once the
// server has verified the payment.
const FIELDS: { name: CustomerField; label: string; type: string; autoComplete: string; placeholder: string }[] = [
  { name: 'firstName', label: 'First name', type: 'text', autoComplete: 'given-name', placeholder: 'First name' },
  { name: 'lastName', label: 'Last name', type: 'text', autoComplete: 'family-name', placeholder: 'Last name' },
  { name: 'email', label: 'Email address', type: 'email', autoComplete: 'email', placeholder: 'you@example.com' },
  { name: 'phone', label: 'Phone number', type: 'tel', autoComplete: 'tel', placeholder: '+233 24 123 4567' },
];

export function PaystackCheckoutForm({
  productId,
  productName,
  priceLabel,
  initial,
}: {
  productId: string;
  productName: string;
  priceLabel: string;
  initial: CustomerDetails;
}) {
  const [values, setValues] = useState<CustomerDetails>(initial);
  const [fieldErrors, setFieldErrors] = useState<CustomerErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A ref, not just state: two clicks in the same tick both see the stale
  // `submitting` value from the render, but never a stale ref.
  const inFlight = useRef(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (inFlight.current) return;

    const checked = validateCustomerDetails(values);
    if (!checked.ok) {
      setFieldErrors(checked.errors);
      setError(null);
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    setFieldErrors({});
    setError(null);
    try {
      const res = await fetch('/api/paystack/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, ...checked.value }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.fieldErrors) setFieldErrors(body.fieldErrors);
        setError(body.error ?? 'Could not start secure payment. Please try again.');
        return;
      }
      if (body.alreadyOwned) {
        window.location.reload();
        return;
      }
      // Leave the button disabled: the page is about to be replaced by Paystack's.
      window.location.href = body.authorizationUrl;
      return;
    } catch {
      setError('Could not reach the server. Please check your connection and try again.');
    }
    inFlight.current = false;
    setSubmitting(false);
  }

  return (
    <form data-clarity-mask="true" onSubmit={handleSubmit} noValidate className="space-y-3">
      <div className="rounded-xl border border-sand/10 bg-ink px-3.5 py-3">
        <p className="type-label uppercase tracking-widest text-sand/65">Your details</p>
        <div className="mt-2 space-y-3">
          {FIELDS.map((f) => (
            <div key={f.name}>
              <label htmlFor={`pay-${f.name}`} className="type-label text-sand/65">
                {f.label}
              </label>
              <input
                id={`pay-${f.name}`}
                name={f.name}
                type={f.type}
                autoComplete={f.autoComplete}
                inputMode={f.type === 'tel' ? 'tel' : f.type === 'email' ? 'email' : undefined}
                required
                value={values[f.name]}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                placeholder={f.placeholder}
                aria-invalid={fieldErrors[f.name] ? true : undefined}
                aria-describedby={fieldErrors[f.name] ? `pay-${f.name}-error` : undefined}
                className="mt-1 w-full rounded-xl border border-sand/15 bg-ink px-3.5 py-2.5 type-body text-sand-light"
              />
              {fieldErrors[f.name] ? (
                <p id={`pay-${f.name}-error`} className="mt-1 type-label text-red-400">
                  {fieldErrors[f.name]}
                </p>
              ) : null}
            </div>
          ))}
        </div>
        <p className="mt-3 type-evidence text-sand/65">These details will be used for your payment record and receipt.</p>
      </div>

      <div className="rounded-xl border border-sand/10 bg-ink px-3.5 py-3">
        <p className="type-label uppercase tracking-widest text-sand/65">Access</p>
        <div className="mt-1.5 flex items-baseline justify-between">
          <p className="type-body text-sand-light">{productName}</p>
          <p className="type-body font-semibold text-sand-light">{priceLabel}</p>
        </div>
      </div>

      {error ? (
        <p role="alert" className="type-body text-red-400">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="min-h-[44px] w-full rounded-xl bg-clay px-4 py-2.5 type-body font-semibold text-ink disabled:opacity-50"
      >
        {submitting ? 'Starting secure payment…' : `Continue to secure payment — ${priceLabel}`}
      </button>
      <p className="text-center type-label text-sand/65">Secure payment powered by Paystack</p>
    </form>
  );
}
