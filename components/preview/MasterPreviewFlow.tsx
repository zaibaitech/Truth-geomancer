'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CountingMethodPractice } from '@/components/books/practice/CountingMethodPractice';

// Prompt 29 — the Master of Geomancy free preview. CountingMethodPractice
// is reused completely unmodified: it is already a self-contained, always-
// public walkthrough of the book's own two worked examples (no server
// call, no protected corpus — see previewPolicy.ts's own comment on why
// Master's procedures compute nothing from user input). "Consuming" this
// preview means the ONE server-authorized POST below, made only when the
// user explicitly asks to try it — never on page load.
export function MasterPreviewFlow() {
  const [unlocked, setUnlocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function tryPreview() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/preview/master-of-geomancy-vol-1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Something went wrong.' }));
        setError(body.error ?? 'Something went wrong.');
        setSubmitting(false);
        return;
      }
      setUnlocked(true);
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (unlocked) {
    return (
      <div>
        <div className="px-4 pt-5">
          <Badge tone="sand">Free Preview</Badge>
        </div>
        <CountingMethodPractice />
        <div className="px-4 pb-6">
          <Card className="text-center">
            <p className="type-body font-semibold text-sand-light">Free preview used</p>
            <p className="mt-1.5 type-body text-sand/70">
              Purchase The Master of Geomancy to unlock the full book, the Cancelling Method, and every chapter.
            </p>
            <Link
              href="/purchase/master-of-geomancy-vol-1"
              className="mt-3 inline-block min-h-[44px] rounded-xl bg-clay px-4 py-2.5 type-body font-semibold text-ink"
            >
              Purchase access to continue
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6 pt-5">
      <Badge tone="sand">Free Preview</Badge>
      <h1 className="mt-2 type-section font-semibold text-sand-light">The Counting Method</h1>
      <p className="mt-1 type-body text-sand/70">The Master of Geomancy · Chapter 1</p>
      <Card className="mt-4">
        <p className="type-body text-sand/70">
          Try the book’s own Counting Method walkthrough — the same worked examples the printed chapter shows.
          This is your one free preview for The Master of Geomancy.
        </p>
      </Card>
      {error ? <p className="mt-3 type-body text-red-400">{error}</p> : null}
      <button
        type="button"
        onClick={tryPreview}
        disabled={submitting}
        className="mt-4 min-h-[52px] w-full rounded-xl bg-clay py-3 type-body font-semibold text-ink disabled:opacity-50"
      >
        {submitting ? 'Loading…' : 'Use your free preview'}
      </button>
    </div>
  );
}
