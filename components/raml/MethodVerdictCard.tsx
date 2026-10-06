import { FigureGlyph } from './FigureGlyph';
import { contextualOnlyQuality } from '@/content/kanzulFigureQuality';
import { FigureAttributes } from '@/components/raml/reading/FigureAttributes';
import { FORTUNE_LABEL, UPDOWN_LABEL } from '@/content/classicalAttributes';
import type { PublicMethodVerdict } from '@/lib/raml/readingVerdictTypes';

export function MethodVerdictCard({ verdict }: { verdict: PublicMethodVerdict }) {
  const { result } = verdict;

  return (
    <div className="rounded-xl border border-sand/10 bg-ink px-3 py-3">
      <p className="type-meta font-semibold uppercase tracking-widest text-clay-light">{verdict.label}</p>

      <div className="mt-2 space-y-0.5">
        {verdict.calculationSteps.map((step, i) => (
          <p key={i} className="type-meta text-sand/65">
            {step}
          </p>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <FigureGlyph pattern={result.pattern} size="sm" />
        <div>
          <p className="type-body font-medium text-sand-light">{result.starName}</p>
          <FigureAttributes
            className="mt-1 type-meta text-sand/65"
            basis={verdict.interpretationBasis}
            quality={verdict.figureQuality ? contextualOnlyQuality(verdict.figureQuality) : null}
            facts={{
              fortune: FORTUNE_LABEL[result.fortune],
              direction: UPDOWN_LABEL[result.upDown],
              element: result.element.charAt(0).toUpperCase() + result.element.slice(1),
            }}
          />
        </div>
      </div>

      <p className={`mt-3 type-body ${verdict.ambiguous ? 'text-sand/65 italic' : 'text-sand-light'}`}>
        {verdict.interpretation}
      </p>
    </div>
  );
}
