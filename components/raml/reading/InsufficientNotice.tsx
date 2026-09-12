import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { ReadingMethodRow } from '@/lib/raml/engine/reading';
import type { RuleStatus } from '@/lib/raml/engine/types';

const STATUS_LABEL: Record<RuleStatus, string> = {
  verified: 'Verified',
  needs_review: 'Needs review',
  uncertain: 'Uncertain',
};

/** Section 8: the exact required heading/copy, plus a plain-language WHY
 * (each method's own review note — never a guess) and a SOURCE STATUS tally,
 * so the user understands why nothing could be computed without the engine
 * ever manufacturing an answer. "How was this calculated?" stays a separate,
 * expandable Calculation Details section below this, in EngineReadingView. */
export function InsufficientNotice({ shortSummary, methods }: { shortSummary: string; methods: ReadingMethodRow[] }) {
  const verifiedCount = methods.filter((m) => m.status === 'verified').length;

  return (
    <Card>
      <p className="text-sm font-semibold uppercase tracking-wide text-clay-light">Insufficient Verified Data</p>
      <p className="mt-2 text-sm leading-relaxed text-sand/70">{shortSummary}</p>

      <p className="mt-4 text-[11px] uppercase tracking-widest text-sand/40">Why</p>
      <div className="mt-1.5 space-y-1.5">
        {methods.map((m) => (
          <p key={m.id} className="text-[12px] leading-relaxed text-sand/55">
            <span className="text-sand-light">{m.label}</span> —{' '}
            {/* A method's own reviewNote (why the whole method is withheld,
                e.g. needs_review/uncertain status) takes priority; a
                verified method whose THIS-CHART outcome is merely
                'uncertain' has no reviewNote at all, so its own verdict's
                interpretation (e.g. "the source only defines the X
                trigger — this is not addressed") is shown instead — never
                the generic fallback, which would wrongly claim a fully
                verified rule was "not yet verified". */}
            {m.reviewNote ?? m.interpretation ?? 'Not yet verified against the source manuscript.'}
          </p>
        ))}
      </div>

      <p className="mt-4 text-[11px] uppercase tracking-widest text-sand/40">Source status</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className="text-[12px] text-sand/55">{verifiedCount} of {methods.length} method(s) verified —</span>
        {methods.map((m) => (
          <Badge key={m.id} tone="neutral">
            {m.label}: {STATUS_LABEL[m.status]}
          </Badge>
        ))}
      </div>
    </Card>
  );
}
