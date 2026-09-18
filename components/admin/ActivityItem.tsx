import { CheckCircle2, XCircle } from 'lucide-react';
import type { PaymentRequest } from '@/lib/access/types';

// Prompt 65 (Phase 6): one reviewed request, shown as a plain activity
// line — "✓ Access granted" / "✕ Declined", the book, the date. Never
// shows who reviewed it (today that field always holds the same literal
// placeholder string — see adminSession.ts's currentAdminReviewerId — which
// would be a confusing, meaningless label to a non-technical author) or the
// underlying customer identity/database identifier the request belongs to.
export function ActivityItem({ request, bookTitle }: { request: PaymentRequest; bookTitle: string }) {
  const granted = request.status === 'approved';
  const Icon = granted ? CheckCircle2 : XCircle;
  const date = request.reviewedAt
    ? new Date(request.reviewedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-sand/10 bg-ink-card p-3.5">
      <Icon size={17} className={`mt-0.5 shrink-0 ${granted ? 'text-emerald-400' : 'text-sand/65'}`} />
      <div className="min-w-0 flex-1">
        <p className="type-body font-medium text-sand-light">{granted ? 'Access granted' : 'Declined'}</p>
        <p className="type-body text-sand/70">{bookTitle}</p>
        {date ? <p className="mt-0.5 type-label text-sand/65">{date}</p> : null}
      </div>
    </div>
  );
}
