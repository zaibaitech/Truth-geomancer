import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { MethodOutcome } from '@/lib/raml/engine/types';

const OUTCOME_TONE: Record<MethodOutcome | 'insufficient_data', 'sand' | 'fire' | 'neutral'> = {
  favourable: 'sand',
  unfavourable: 'fire',
  mixed: 'neutral',
  uncertain: 'neutral',
  insufficient_data: 'neutral',
};

/** The direct answer to the question (section 12, priority 1-2). Never a
 * yes/no collapse — just whatever outcome label the deterministic engine
 * already decided. The insufficient-data state gets its own exact copy
 * (section 10) rather than a badge, since there is no outcome to show. */
export function OutcomeCard({
  outcomeLabel,
  overallOutcome,
  shortSummary,
  isInsufficient,
}: {
  outcomeLabel: string;
  overallOutcome: MethodOutcome | 'insufficient_data';
  shortSummary: string;
  isInsufficient: boolean;
}) {
  if (isInsufficient) {
    return (
      <Card>
        <p className="text-sm font-semibold uppercase tracking-wide text-clay-light">Insufficient Verified Data</p>
        <p className="mt-2 text-sm leading-relaxed text-sand/70">{shortSummary}</p>
      </Card>
    );
  }

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
