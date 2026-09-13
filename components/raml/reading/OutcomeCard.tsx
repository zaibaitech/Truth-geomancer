import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { OUTCOME_TONE } from '@/lib/raml/engine/reading';
import type { MethodOutcome } from '@/lib/raml/engine/types';

/** The direct answer to the question (section 12, priority 1-2). An outcome
 * question gets a favourable/unfavourable/mixed badge, in traditional-
 * consistency language (never a fabricated probability/confidence score).
 * A descriptive question (Prompt 4.5) has no such badge to show — there was
 * never a favourable/unfavourable judgment in the source to begin with — so
 * it shows a plain "Reading" eyebrow and the actual verified answer text
 * instead, exactly as prominently. The insufficient-data state is handled
 * by InsufficientNotice instead, which has its own required structure. */
export function OutcomeCard({
  resultKind,
  outcomeLabel,
  overallOutcome,
  shortSummary,
  descriptiveAnswer,
}: {
  resultKind: 'outcome' | 'descriptive';
  outcomeLabel: string;
  overallOutcome: MethodOutcome | 'insufficient_data';
  shortSummary: string;
  descriptiveAnswer: string | null;
}) {
  if (resultKind === 'descriptive') {
    return (
      <Card>
        <p className="type-meta uppercase tracking-widest text-sand/65">Reading</p>
        <p className="mt-1.5 type-method font-semibold text-sand-light">
          {descriptiveAnswer ?? 'The methods give different answers'}
        </p>
        <p className="mt-2 type-body text-sand/75">{shortSummary}</p>
      </Card>
    );
  }

  return (
    <Card>
      <p className="type-meta uppercase tracking-widest text-sand/65">Overall indication</p>
      <div className="mt-1.5">
        <Badge tone={OUTCOME_TONE[overallOutcome]}>{outcomeLabel}</Badge>
      </div>
      <p className="mt-2 type-body text-sand/75">{shortSummary}</p>
    </Card>
  );
}
