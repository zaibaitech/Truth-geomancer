import { Card } from '@/components/ui/Card';
import { FigureGlyph } from '@/components/raml/FigureGlyph';
import { FigureAttributes } from './FigureAttributes';
import type { ReasoningStep } from '@/lib/raml/readingExplanation';

function StepBody({ step }: { step: ReasoningStep }) {
  const row = step.row;
  return (
    <div className="space-y-3">
      <div>
        <p className="type-meta uppercase tracking-widest text-sand/65">Houses the method uses</p>
        <ul className="mt-1.5 space-y-1.5">
          {step.houses.map((h) => (
            <li key={h.number} className="flex items-center gap-3 rounded-xl border border-sand/10 bg-ink px-3 py-2">
              <FigureGlyph pattern={h.pattern} size="sm" />
              <div className="min-w-0">
                <p className="type-body text-sand-light">
                  House {h.number} · {h.title}
                </p>
                <p className="type-label text-sand/65">{h.figureName}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {step.working.length > 0 ? (
        <div>
          <p className="type-meta uppercase tracking-widest text-sand/65">Working</p>
          <div className="mt-0.5 space-y-1">
            {step.working.map((line, i) => (
              <p key={i} className="type-evidence text-sand/70 break-words">
                {line}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {step.result ? (
        <div>
          <p className="type-meta uppercase tracking-widest text-sand/65">Result figure</p>
          <div className="mt-1.5 flex items-center gap-3">
            <FigureGlyph pattern={step.result.pattern} size="md" />
            <div className="min-w-0">
              <p className="type-body font-semibold text-sand-light">{step.result.name}</p>
              {step.result.element ? <p className="type-label text-sand/65">{step.result.element}</p> : null}
            </div>
          </div>
          <FigureAttributes
            basis={row.interpretationBasis}
            quality={row.figureQuality}
            facts={{ fortune: row.resultFortune, direction: row.resultDirection, element: row.resultElement }}
            className="mt-2 type-evidence text-sand/65"
          />
        </div>
      ) : null}
    </div>
  );
}

/** How the method reached its answer, from the user's own chart: the houses
 * it used (with the app's house names), the figure in each house with its dot
 * pattern, the engine's own working line and the result figure. It shows
 * only what the ReadingResult and chart contain. With several methods the
 * first is open and the rest are collapsed. */
export function ReasoningSteps({ steps }: { steps: ReasoningStep[] }) {
  if (steps.length === 0) return null;
  return (
    <Card>
      <p className="type-section font-semibold text-sand-light">How the method reached this</p>
      <div className="mt-3 space-y-3">
        {steps.length === 1 ? (
          <StepBody step={steps[0]} />
        ) : (
          steps.map((step, i) => (
            <details key={step.methodId} open={i === 0} className="rounded-xl border border-sand/10 px-3 py-2">
              <summary className="min-h-[44px] cursor-pointer py-2 type-body font-medium text-clay-light">
                {step.sourceLabel}, {step.methodLabel}
              </summary>
              <div className="pb-2 pt-1">
                <StepBody step={step} />
              </div>
            </details>
          ))
        )}
      </div>
    </Card>
  );
}
