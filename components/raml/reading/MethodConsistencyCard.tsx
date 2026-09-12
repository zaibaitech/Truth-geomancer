import { Card } from '@/components/ui/Card';
import { OUTCOME_ROW_LABEL } from '@/lib/raml/engine/reading';
import type { ReadingMethodRow } from '@/lib/raml/engine/reading';
import type { MethodOutcome } from '@/lib/raml/engine/types';

// The row mark reflects the METHOD'S OWN outcome type, never whether it
// happens to agree with the overall headline — a "Mixed"/conditional result
// is visually and semantically distinct from a genuine "Unfavourable" one,
// per Prompt 3.5 section 2. Only 3 outcome types ever reach this card
// (COMPARE_RESULTS/reading.ts's `counted` flag already excludes anything
// that isn't a tallied favourable/unfavourable/mixed verdict).
const ROW_ICON: Record<MethodOutcome, string> = {
  favourable: '✓',
  unfavourable: '✕',
  mixed: '~',
  uncertain: '?',
};

const ROW_TONE: Record<MethodOutcome, string> = {
  favourable: 'text-sand-light',
  unfavourable: 'text-clay-light',
  mixed: 'text-sand/60',
  uncertain: 'text-sand/60',
};

/** Section 2/5: one row per method that actually produced a counted
 * verdict, plus a full-sentence agreement summary built only from the
 * existing consensus counts. Never averages or "fixes" a disagreement — a
 * genuine conflict is shown as a genuine conflict. */
export function MethodConsistencyCard({
  consensusLabel,
  consensusSentence,
  disagreementNote,
  methods,
}: {
  consensusLabel: string;
  consensusSentence: string | null;
  disagreementNote: string | null;
  methods: ReadingMethodRow[];
}) {
  const counted = methods.filter((m) => m.counted && m.outcome !== null);
  if (counted.length === 0) return null;

  return (
    <Card>
      <p className="mb-2 text-[11px] uppercase tracking-widest text-sand/40">Method consistency</p>
      <div className="space-y-1.5">
        {counted.map((m) => (
          <p key={m.id} className="flex items-center gap-2 text-sm">
            <span className={ROW_TONE[m.outcome!]}>{ROW_ICON[m.outcome!]}</span>
            <span className="text-sand-light">{m.label}</span>
            <span className="text-sand/50">— {OUTCOME_ROW_LABEL[m.outcome!]}</span>
          </p>
        ))}
      </div>
      <p className="mt-3 text-sm font-medium text-sand-light">{consensusLabel}</p>
      {consensusSentence ? <p className="mt-1 text-[12px] leading-relaxed text-sand/50">{consensusSentence}</p> : null}
      {disagreementNote ? <p className="mt-1 text-[12px] leading-relaxed text-sand/50">{disagreementNote}</p> : null}
      <p className="mt-2 text-[11px] leading-relaxed text-sand/35">
        This reflects how consistently the traditional methods agree with each other — a measure of
        method consistency, not a statistical probability.
      </p>
    </Card>
  );
}
