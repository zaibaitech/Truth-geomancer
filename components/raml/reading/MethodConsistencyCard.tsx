import { Card } from '@/components/ui/Card';
import type { ReadingMethodRow } from '@/lib/raml/engine/reading';

/** Section 5: one row per method that actually produced a counted verdict,
 * marked with a check or cross against the overall outcome, plus whatever
 * plain-language breakdown/disagreement note reading.ts already derived
 * from the existing consensus counts. Never averages or "fixes" a
 * disagreement — a genuine conflict is shown as a genuine conflict. */
export function MethodConsistencyCard({
  consensusLabel,
  consensusBreakdown,
  disagreementNote,
  methods,
}: {
  consensusLabel: string;
  consensusBreakdown: string | null;
  disagreementNote: string | null;
  methods: ReadingMethodRow[];
}) {
  const counted = methods.filter((m) => m.counted);
  if (counted.length === 0) return null;

  return (
    <Card>
      <p className="mb-2 text-[11px] uppercase tracking-widest text-sand/40">Method consistency</p>
      <div className="space-y-1.5">
        {counted.map((m) => (
          <p key={m.id} className="flex items-center gap-2 text-sm">
            <span className={m.agreesWithOverall ? 'text-sand-light' : 'text-clay-light'}>
              {m.agreesWithOverall ? '✓' : '✕'}
            </span>
            <span className="text-sand-light">{m.label}</span>
            <span className="text-sand/50">— {m.outcomeLabel}</span>
          </p>
        ))}
      </div>
      <p className="mt-3 text-sm text-sand-light">
        {consensusLabel}
        {consensusBreakdown ? <span className="text-sand/50"> ({consensusBreakdown})</span> : null}
      </p>
      {disagreementNote ? <p className="mt-1 text-[12px] leading-relaxed text-sand/50">{disagreementNote}</p> : null}
      <p className="mt-2 text-[11px] leading-relaxed text-sand/35">
        This reflects how consistently the traditional methods agree with each other — a measure of
        method consistency, not a statistical probability.
      </p>
    </Card>
  );
}
