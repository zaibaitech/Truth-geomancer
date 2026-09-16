'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Prompt 28, Phase 8/9: both actions POST to the server, which re-checks
// admin authorization itself (never trusts that this component only
// renders for an admin — see the route's own currentAdminReviewerId()
// check). router.refresh() re-renders the dashboard from the database's
// real, post-mutation state rather than this component guessing it.
export function PaymentRequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [showRejectNote, setShowRejectNote] = useState(false);

  async function act(action: 'approve' | 'reject') {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/payment-requests/${requestId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: action === 'reject' ? JSON.stringify({ adminNote: note.trim() || undefined }) : undefined,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Something went wrong.' }));
        setError(body.error ?? 'Something went wrong.');
        setBusy(null);
        return;
      }
      router.refresh();
    } catch {
      setError('Could not reach the server.');
      setBusy(null);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      {error ? <p className="type-body text-red-400">{error}</p> : null}
      {showRejectNote ? (
        <div className="space-y-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason (optional)"
            className="w-full rounded-lg border border-sand/15 bg-ink px-3 py-2 type-body text-sand-light"
          />
          <div className="flex gap-2">
            <button
              onClick={() => act('reject')}
              disabled={busy !== null}
              className="min-h-[40px] flex-1 rounded-lg border border-sand/15 px-3 py-2 type-body text-sand-light disabled:opacity-50"
            >
              {busy === 'reject' ? 'Rejecting…' : 'Confirm reject'}
            </button>
            <button
              onClick={() => setShowRejectNote(false)}
              disabled={busy !== null}
              className="min-h-[40px] rounded-lg px-3 py-2 type-body text-sand/65"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => act('approve')}
            disabled={busy !== null}
            className="min-h-[40px] flex-1 rounded-lg bg-clay px-3 py-2 type-body font-semibold text-ink disabled:opacity-50"
          >
            {busy === 'approve' ? 'Approving…' : 'Approve'}
          </button>
          <button
            onClick={() => setShowRejectNote(true)}
            disabled={busy !== null}
            className="min-h-[40px] flex-1 rounded-lg border border-sand/15 px-3 py-2 type-body text-sand-light disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
