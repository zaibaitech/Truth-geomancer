import { FigureCard } from './FigureCard';
import type { ReadingIndicator, ReadingMethodRow } from '@/lib/raml/engine/reading';

/** Section 6/19: every OTHER figure a question's methods produced, besides
 * the primary one — deduped by figure in reading.ts already. Reuses
 * FigureCard, the same component the primary indicator uses. */
export function SupportingIndicators({
  indicators,
  methods,
}: {
  indicators: ReadingIndicator[];
  methods: ReadingMethodRow[];
}) {
  if (indicators.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-[11px] uppercase tracking-widest text-sand/40">Supporting indicators</p>
      <div className="space-y-2.5">
        {indicators.map((indicator) => {
          const method = methods.find((m) => m.label === indicator.methodLabel);
          return <FigureCard key={indicator.figureId} indicator={indicator} contextualNote={method?.interpretation} />;
        })}
      </div>
    </div>
  );
}
