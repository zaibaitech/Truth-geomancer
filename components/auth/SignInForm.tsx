'use client';

import { useState } from 'react';

// Prompt 46: the email is typed here and sent ONLY in the body of a POST
// to /api/auth/request-link, which never reveals whether the address
// already has an account (see that route's own comment). Nothing about
// the request is stored anywhere client-reachable — this component only
// ever holds the plain text being typed and, once sent, a boolean
// "check your email" state.
export function SignInForm() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? 'Something went wrong.');
        setSubmitting(false);
        return;
      }
      setSent(true);
      setSubmitting(false);
    } catch {
      setError('Could not reach the server. Please try again.');
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-4 rounded-xl border border-sand/15 bg-ink px-3.5 py-3">
        <p className="type-body font-semibold text-sand-light">Check your email</p>
        <p className="mt-1 type-body text-sand/70">
          If that email can be used for an account, we’ve sent a sign-in link to <strong>{email}</strong>. Open it on
          this or any device to continue.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <div>
        <label htmlFor="signin-email" className="type-label text-sand/65">
          Email
        </label>
        <input
          id="signin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="mt-1 w-full rounded-xl border border-sand/15 bg-ink px-3.5 py-2.5 type-body text-sand-light"
        />
      </div>
      {error ? <p className="type-body text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={submitting || email.length === 0}
        className="min-h-[44px] w-full rounded-xl bg-clay px-4 py-2.5 type-body font-semibold text-ink disabled:opacity-50"
      >
        {submitting ? 'Sending…' : 'Send sign-in link'}
      </button>
    </form>
  );
}
