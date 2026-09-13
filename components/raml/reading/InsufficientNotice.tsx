import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { ReadingMethodRow } from '@/lib/raml/engine/reading';
import { INSUFFICIENT_EXPLANATION, INSUFFICIENT_HEADING, METHOD_STATUS_LABEL, methodTally } from '@/lib/raml/statusLanguage';

/** Section 8: the exact required heading/copy, plus a plain-language WHY
 * (each method's own review note — never a guess) and a SOURCE STATUS tally,
 * so the user understands why nothing could be computed without the engine
 * ever manufacturing an answer. "How was this calculated?" stays a separate,
 * expandable Calculation Details section below this, in EngineReadingView. */
export function InsufficientNotice({ shortSummary, methods }: { shortSummary: string; methods: ReadingMethodRow[] }) {
  const verifiedCount = methods.filter((m) => m.status === 'verified').length;

  return (
    <Card>
      {/* Prompt 15, section 14: the same state the engine calls
          `insufficient_data`, said in words that make clear the limit is the
          manuscript's rather than a failure of the app. */}
      <p className="type-method font-semibold text-clay-light">{INSUFFICIENT_HEADING}</p>
      <p className="mt-1.5 type-body text-sand/75">{INSUFFICIENT_EXPLANATION}</p>
      <p className="mt-1.5 type-body text-sand/70">{shortSummary}</p>

      <p className="mt-5 type-meta uppercase tracking-widest text-sand/65">Why</p>
      <div className="mt-1.5 space-y-2">
        {methods.map((m) => (
          <p key={m.id} className="type-evidence text-sand/65">
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

      <p className="mt-5 type-meta uppercase tracking-widest text-sand/65">What the source gives</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className="type-evidence text-sand/65">{methodTally(verifiedCount, methods.length)}</span>
        {methods.map((m) => (
          <Badge key={m.id} tone="neutral">
            {m.label}: {METHOD_STATUS_LABEL[m.status]}
          </Badge>
        ))}
      </div>
    </Card>
  );
}
