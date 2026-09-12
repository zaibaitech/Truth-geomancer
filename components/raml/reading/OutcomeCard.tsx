import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { OUTCOME_TONE } from '@/lib/raml/engine/reading';
import type { MethodOutcome } from '@/lib/raml/engine/types';

/** The direct answer to the question (section 12, priority 1-2). Never a
 * yes/no collapse — just whatever outcome label the deterministic engine
 * already decided, in traditional-consistency language (never a fabricated
 * probability/confidence score). The insufficient-data state is handled by
 * InsufficientNotice instead, which has its own required structure. */
export function OutcomeCard({
  outcomeLabel,
  overallOutcome,
  shortSummary,
}: {
  outcomeLabel: string;
  overallOutcome: MethodOutcome | 'insufficient_data';
  shortSummary: string;
}) {
  return (
    <Card>
      <p className="text-[11px] uppercase tracking-widest text-sand/40">Overall indication</p>
      <div className="mt-1.5">
        <Badge tone={OUTCOME_TONE[overallOutcome]}>{outcomeLabel}</Badge>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-sand/70">{shortSummary}</p>
    </Card>
  );
}
