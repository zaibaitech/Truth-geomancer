'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Prompt 28, Phase 7: the admin secret is typed here and sent ONLY in the
// body of a POST to /api/admin/login, which compares it server-side
// against the server-only TG_ADMIN_SECRET env var. Nothing about admin
// status is stored in localStorage, a query param, or any client-readable
// place — the ONLY thing this component ever holds onto is the plain text
// the person is typing, which is discarded the moment the request
// resolves either way.
export function AdminLoginForm() {
  const router = useRouter();
  const [secret, setSecret] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      });
      if (!res.ok) {
        setError('Invalid administrator secret.');
        setSubmitting(false);
        return;
      }
      setSecret('');
      router.refresh();
    } catch {
      setError('Could not reach the server. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <div>
        <label htmlFor="admin-secret" className="type-label text-sand/65">
          Administrator secret
        </label>
        <input
          id="admin-secret"
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          required
          autoComplete="off"
          className="mt-1 w-full rounded-xl border border-sand/15 bg-ink px-3.5 py-2.5 type-body text-sand-light"
        />
      </div>
      {error ? <p className="type-body text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={submitting || secret.length === 0}
        className="min-h-[44px] w-full rounded-xl bg-clay px-4 py-2.5 type-body font-semibold text-ink disabled:opacity-50"
      >
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
