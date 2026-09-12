import { FigureCard } from './FigureCard';
import type { ReadingIndicator } from '@/lib/raml/engine/reading';

/** Section 6: every OTHER figure a question's methods produced, besides the
 * primary one — deduped by figure in reading.ts already, each carrying its
 * own relevance note (why it supports/qualifies/differs from the reading)
 * so this section never reads as an undifferentiated dump of figures. */
export function SupportingIndicators({ indicators }: { indicators: ReadingIndicator[] }) {
  if (indicators.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-[11px] uppercase tracking-widest text-sand/40">Supporting indicators</p>
      <div className="space-y-2.5">
        {indicators.map((indicator) => (
          <FigureCard key={indicator.figureId} indicator={indicator} />
        ))}
      </div>
    </div>
  );
}
