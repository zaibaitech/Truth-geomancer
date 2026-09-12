import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { ReadingMethodRow } from '@/lib/raml/engine/reading';
import type { RuleStatus } from '@/lib/raml/engine/types';

const STATUS_LABEL: Record<RuleStatus, string> = {
  verified: 'Verified',
  needs_review: 'Needs review',
  uncertain: 'Uncertain',
};

/** The "advanced view" (section 8, 17): per method, exactly the houses used,
 * the operation trace, the resulting figure, and the evaluation — the same
 * audit trail the engine has always produced, just relocated behind an
 * expandable rather than shown up front. Also doubles as the "View
 * traditional calculation" detail promised next to each source reference
 * (section 9), since every row already carries its exact source quote. */
export function CalculationDetails({ methods }: { methods: ReadingMethodRow[] }) {
  return (
    <Card>
      <p className="mb-3 text-[11px] uppercase tracking-widest text-sand/40">How was this calculated?</p>
      <div className="space-y-3">
        {methods.map((m) => (
          <div key={m.id} className="rounded-xl border border-sand/10 bg-ink px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-clay-light">{m.label}</p>
              <Badge tone={m.status === 'verified' ? 'sand' : 'neutral'}>{STATUS_LABEL[m.status]}</Badge>
            </div>
            <p className="mt-1.5 text-[11px] italic text-sand/40">“{m.sourceQuote}”</p>
            <p className="mt-1 text-[11px] text-sand/35">{m.sourceLabel}</p>

            {m.housesUsed.length > 0 ? (
              <p className="mt-2 text-[12px] text-sand/50">Houses used: {m.housesUsed.map((n) => `H${n}`).join(', ')}</p>
            ) : null}

            {m.calculationSteps.length > 0 ? (
              <div className="mt-1 space-y-0.5">
                {m.calculationSteps.map((step, i) => (
                  <p key={i} className="text-[12px] text-sand/55">
                    {step}
                  </p>
                ))}
              </div>
            ) : null}

            {m.resultFigureName ? (
              <p className="mt-1 text-[12px] text-sand/50">Result figure: {m.resultFigureName}</p>
            ) : null}

            {m.outcome ? (
              <p className="mt-2 text-sm text-sand-light">
                <Badge tone={m.outcome === 'favourable' ? 'sand' : m.outcome === 'unfavourable' ? 'fire' : 'neutral'}>
                  {m.outcomeLabel}
                </Badge>
                <span className="ml-2">{m.interpretation}</span>
              </p>
            ) : (
              <p className="mt-2 text-[12px] text-sand/40">{m.reviewNote}</p>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-sand/35">
        Good/bad and upward/downward here are read from classical geomancy attributions for each
        figure — not from this manuscript, which doesn’t tabulate them itself. Methods marked
        “needs review” or “uncertain” are shown for transparency but don’t count toward the
        result above.
      </p>
    </Card>
  );
}
