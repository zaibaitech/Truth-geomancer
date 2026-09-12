import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { OUTCOME_TONE } from '@/lib/raml/engine/reading';
import type { ReadingMethodRow } from '@/lib/raml/engine/reading';
import { METHOD_STATUS_LABEL } from '@/lib/raml/statusLanguage';

/** The "advanced view" (section 5, 8, 17): per method, exactly the houses
 * used, the operation trace, the resulting figure's identity AND its
 * qualities (kept visually separate from the method's own outcome badge,
 * same rule as FigureCard), and the evaluation — the same audit trail the
 * engine has always produced, just relocated here rather than shown up
 * front. Also carries the full multi-method interpretation text as a
 * secondary reference for advanced users. Doubles as the "View traditional
 * calculation" detail next to each source reference (section 9), since
 * every row already carries its exact source quote. */
export function CalculationDetails({ methods, detailedInterpretation }: { methods: ReadingMethodRow[]; detailedInterpretation?: string }) {
  return (
    <Card>
      <p className="mb-3 text-[11px] uppercase tracking-widest text-sand/40">How this was determined</p>
      <div className="space-y-3">
        {methods.map((m) => {
          const qualities = [m.resultFortune, m.resultDirection, m.resultElement].filter(Boolean) as string[];
          return (
            <div key={m.id} className="rounded-xl border border-sand/10 bg-ink px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-clay-light">{m.label}</p>
                <Badge tone={m.status === 'verified' ? 'sand' : 'neutral'}>{METHOD_STATUS_LABEL[m.status]}</Badge>
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
                <p className="mt-1 text-[12px] text-sand/50">
                  Result figure: {m.resultFigureName}
                  {qualities.length > 0 ? ` (${qualities.join(' · ')})` : ''}
                </p>
              ) : null}

              {m.outcome ? (
                <p className="mt-2 text-sm text-sand-light">
                  <Badge tone={OUTCOME_TONE[m.outcome]}>{m.outcomeLabel}</Badge>
                  <span className="ml-2">{m.interpretation}</span>
                </p>
              ) : (
                <p className="mt-2 text-[12px] text-sand/40">{m.reviewNote}</p>
              )}
            </div>
          );
        })}
      </div>

      {detailedInterpretation ? (
        <div className="mt-3 rounded-xl border border-sand/10 bg-ink px-3 py-3">
          <p className="mb-1 text-[11px] uppercase tracking-widest text-sand/40">Full computed interpretation (all methods)</p>
          <p className="text-[12px] leading-relaxed text-sand/55">{detailedInterpretation}</p>
        </div>
      ) : null}

      <p className="mt-3 text-[11px] leading-relaxed text-sand/35">
        Good/bad and upward/downward here are read from classical geomancy attributions for each
        figure — not from this manuscript, which doesn’t tabulate them itself. Methods marked
        “needs review” or “uncertain” are shown for transparency but don’t count toward the
        result above.
      </p>
    </Card>
  );
}
