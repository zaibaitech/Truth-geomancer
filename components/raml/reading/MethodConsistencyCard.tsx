import { Card } from '@/components/ui/Card';
import { OUTCOME_ROW_LABEL } from '@/lib/raml/engine/reading';
import type { ReadingMethodRow } from '@/lib/raml/engine/reading';
import type { MethodOutcome } from '@/lib/raml/engine/types';

// The row mark reflects the METHOD'S OWN outcome type, never whether it
// happens to agree with the overall headline — a "Mixed"/conditional result
// is visually and semantically distinct from a genuine "Unfavourable" one,
// per Prompt 3.5 section 2. 'descriptive' never reaches this map — see the
// descriptive branch below, which renders those rows without an icon at all.
const ROW_ICON: Record<Exclude<MethodOutcome, 'descriptive'>, string> = {
  favourable: '✓',
  unfavourable: '✕',
  mixed: '~',
  uncertain: '?',
};

const ROW_TONE: Record<Exclude<MethodOutcome, 'descriptive'>, string> = {
  favourable: 'text-sand-light',
  unfavourable: 'text-clay-light',
  mixed: 'text-sand/70',
  uncertain: 'text-sand/70',
};

/** Section 2/5 (outcome questions) and Prompt 4.5 section 4 (descriptive
 * questions): one row per method that actually produced a counted verdict.
 * An outcome question gets a check/cross/tilde mark against the overall
 * headline; a descriptive question instead shows each method's own
 * categorical answer plainly ("Method 1 → East") with no mark at all — a
 * factual match/mismatch isn't the same kind of "agreement" as a favourable/
 * unfavourable judgment, so it isn't given the same icon. Never averages or
 * "fixes" a disagreement — a genuine conflict or mismatch is shown as one. */
export function MethodConsistencyCard({
  resultKind,
  consensusLabel,
  consensusSentence,
  disagreementNote,
  methods,
}: {
  resultKind: 'outcome' | 'descriptive';
  consensusLabel: string;
  consensusSentence: string | null;
  disagreementNote: string | null;
  methods: ReadingMethodRow[];
}) {
  const counted = methods.filter((m) => m.counted && m.outcome !== null);
  if (counted.length === 0) return null;

  return (
    <Card>
      <p className="mb-2 type-meta uppercase tracking-widest text-sand/65">Method consistency</p>
      <div className="space-y-1.5">
        {counted.map((m) =>
          resultKind === 'descriptive' ? (
            <p key={m.id} className="flex items-center gap-2 text-sm">
              <span className="text-sand-light">{m.label}</span>
              <span className="text-sand/65">→</span>
              <span className="text-sand-light">{m.outcomeLabel}</span>
            </p>
          ) : (
            <p key={m.id} className="flex items-center gap-2 text-sm">
              <span className={ROW_TONE[m.outcome as Exclude<MethodOutcome, 'descriptive'>]}>
                {ROW_ICON[m.outcome as Exclude<MethodOutcome, 'descriptive'>]}
              </span>
              <span className="text-sand-light">{m.label}</span>
              <span className="text-sand/65">— {OUTCOME_ROW_LABEL[m.outcome!]}</span>
            </p>
          ),
        )}
      </div>
      <p className="mt-3 text-sm font-medium text-sand-light">{consensusLabel}</p>
      {consensusSentence ? <p className="mt-1 type-evidence text-sand/70">{consensusSentence}</p> : null}
      {disagreementNote ? <p className="mt-1 type-evidence text-sand/70">{disagreementNote}</p> : null}
      <p className="mt-2 type-meta text-sand/65">
        {resultKind === 'descriptive'
          ? 'This reflects whether the traditional methods point to the same answer — not a favourable/unfavourable judgment.'
          : 'This reflects how consistently the traditional methods agree with each other — a measure of method consistency, not a statistical probability.'}
      </p>
    </Card>
  );
}
