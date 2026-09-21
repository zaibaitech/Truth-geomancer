import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { OUTCOME_TONE } from '@/lib/raml/engine/reading';
import type { ReadingMethodRow } from '@/lib/raml/engine/reading';
import { METHOD_STATUS_LABEL } from '@/lib/raml/statusLanguage';
import { RecastWorkingDiagram } from './RecastWorkingDiagram';

/** The "advanced view" (section 5, 8, 17): per method, exactly the houses
 * used, the operation trace, the resulting figure's identity AND its
 * qualities (kept visually separate from the method's own outcome badge,
 * same rule as FigureCard), and the evaluation — the same audit trail the
 * engine has always produced, just relocated here rather than shown up
 * front. Also carries the full multi-method interpretation text as a
 * secondary reference for advanced users.
 *
 * Prompt 17 rebuilt the typography rather than the content. It was 11-12px
 * throughout, which made the one part of the app a practising geomancer
 * actually studies — the source wording and the working — the hardest part to
 * read. Everything now uses the shared rem-based scale in globals.css, so it
 * also grows with a reader's own browser font setting, and the eye has a
 * hierarchy to follow: method, then source, then working, then verdict. */
export function CalculationDetails({ methods, detailedInterpretation }: { methods: ReadingMethodRow[]; detailedInterpretation?: string }) {
  return (
    <Card>
      {/* Deliberately no invented hierarchy between these methods in this
          heading (Prompt 19, section 6) — the source never establishes one.
          The outer disclosure control already says "How this was
          determined"; repeating that exact phrase here would be the one
          deliberate duplication this screen still had. */}
      <p className="mb-3 type-section font-semibold text-sand-light">Verified Methods</p>
      <div className="space-y-4">
        {methods.map((m) => {
          const qualities = [m.resultFortune, m.resultDirection, m.resultElement].filter(Boolean) as string[];
          return (
            <div key={m.id} className="rounded-xl border border-sand/10 bg-ink px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="type-method font-semibold text-clay-light">{m.label}</p>
                <Badge tone={m.status === 'verified' ? 'sand' : 'neutral'}>{METHOD_STATUS_LABEL[m.status]}</Badge>
              </div>

              {/* The source excerpt is the reason any of this can be trusted,
                  so it reads like an excerpt — a quoted block with room to
                  breathe — rather than like disabled small print. */}
              <blockquote className="mt-3 border-l-2 border-clay/30 pl-3">
                <p className="type-quote italic text-sand/75">“{m.sourceQuote}”</p>
                <cite className="mt-1.5 block type-meta not-italic text-sand/65">{m.sourceLabel}</cite>
              </blockquote>

              {m.casting.inspects === 'recast' ? (
                <RecastWorkingDiagram method={m} />
              ) : (
                <>
                  {m.housesUsed.length > 0 ? (
                    <div className="mt-3">
                      <p className="type-meta uppercase tracking-widest text-sand/65">Houses used</p>
                      <p className="mt-0.5 type-evidence text-sand/70">{m.housesUsed.map((n) => `H${n}`).join(', ')}</p>
                    </div>
                  ) : null}

                  {m.calculationSteps.length > 0 ? (
                    <div className="mt-3">
                      <p className="type-meta uppercase tracking-widest text-sand/65">Working</p>
                      <div className="mt-0.5 space-y-1">
                        {m.calculationSteps.map((step, i) => (
                          <p key={i} className="type-evidence text-sand/70">
                            {step}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              )}

              {m.resultFigureName ? (
                <div className="mt-3">
                  <p className="type-meta uppercase tracking-widest text-sand/65">Result figure</p>
                  <p className="mt-0.5 type-evidence text-sand/70">
                    {m.resultFigureName}
                    {qualities.length > 0 ? ` (${qualities.join(' · ')})` : ''}
                  </p>
                </div>
              ) : null}

              {m.outcome ? (
                <div className="mt-4 border-t border-sand/10 pt-3">
                  <Badge tone={OUTCOME_TONE[m.outcome]}>{m.outcomeLabel}</Badge>
                  <p className="mt-1.5 type-verdict text-sand-light">{m.interpretation}</p>
                </div>
              ) : (
                <p className="mt-4 border-t border-sand/10 pt-3 type-body text-sand/70">{m.reviewNote}</p>
              )}
            </div>
          );
        })}
      </div>

      {detailedInterpretation ? (
        <div className="mt-4 rounded-xl border border-sand/10 bg-ink px-4 py-4">
          <p className="mb-1.5 type-meta uppercase tracking-widest text-sand/65">
            Full computed interpretation (all methods)
          </p>
          <p className="type-body text-sand/65">{detailedInterpretation}</p>
        </div>
      ) : null}

      <p className="mt-4 type-meta text-sand/65">
        Good/bad and upward/downward here are read from classical geomancy attributions for each
        figure — not from this manuscript, which doesn’t tabulate them itself. Methods marked
        “source detail missing” or “not defined in the source” are shown for transparency but don’t
        count toward the result above.
      </p>
    </Card>
  );
}
