import type { LucideIcon } from 'lucide-react';

// Prompt 65: `value` is `number | '—'` on purpose — the em dash is the
// explicit "not safely calculable yet" placeholder Phase 4 requires
// ("If a statistic cannot safely be derived from existing production data,
// either omit it, or display a neutral placeholder such as —"). No caller
// in this dashboard currently passes '—' (every stat here IS safely
// derivable from the existing entitlements/payment_requests tables — see
// lib/server/adminStats.ts), but the type keeps that option honest and
// available rather than forcing a future caller to invent a fake number.
export function StatTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number | '—' }) {
  return (
    <div className="rounded-2xl border border-sand/12 bg-ink-card p-3.5">
      <Icon size={16} className="text-clay-light" />
      <p className="mt-2 font-logo text-2xl text-sand-light">{value}</p>
      <p className="mt-0.5 type-label text-sand/65">{label}</p>
    </div>
  );
}
