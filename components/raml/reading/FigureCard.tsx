import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FigureGlyph } from '../FigureGlyph';
import { OUTCOME_TONE } from '@/lib/raml/engine/reading';
import type { ReadingIndicator } from '@/lib/raml/engine/reading';

/** One figure — primary or supporting. Prompt 3.5's core fix: a figure's
 * traditional QUALITIES (Good/Bad, Upward/Downward, element) are shown in
 * one block, and the SPECIFIC method's own OUTCOME (favourable/
 * unfavourable/conditional) in a clearly separate block below a divider —
 * never implied to be the same thing. A "Bad" figure producing a
 * "Favourable" method outcome is real and stays visible as exactly that. */
export function FigureCard({ indicator }: { indicator: ReadingIndicator }) {
  const qualities = [indicator.fortune, indicator.direction, indicator.element].filter(Boolean) as string[];

  return (
    <Card className={indicator.role === 'primary' ? 'border-clay/25' : ''}>
      <div className="flex items-center gap-3">
        <FigureGlyph pattern={indicator.dotPattern} size={indicator.role === 'primary' ? 'md' : 'sm'} />
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-sand/40">
            {indicator.role === 'primary' ? 'Primary indication' : 'Supporting indicator'}
          </p>
          <p className="text-sm font-medium text-sand-light">{indicator.figureName}</p>
          {qualities.length > 0 ? <p className="text-[11px] text-sand/45">{qualities.join(' · ')}</p> : null}
        </div>
      </div>

      <div className="mt-3 border-t border-sand/10 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-widest text-sand/40">{indicator.methodLabel}</span>
          {indicator.methodOutcomeLabel ? (
            <Badge tone={OUTCOME_TONE[indicator.methodOutcome!]}>{indicator.methodOutcomeLabel}</Badge>
          ) : (
            <Badge tone="neutral">Not counted</Badge>
          )}
        </div>
        {indicator.interpretation ? <p className="mt-1.5 text-sm leading-relaxed text-sand/80">“{indicator.interpretation}”</p> : null}
        {indicator.role === 'supporting' && indicator.relevance ? (
          <p className="mt-1.5 text-[12px] leading-relaxed text-sand/45">{indicator.relevance}</p>
        ) : null}
        <p className="mt-1.5 text-[11px] text-sand/35">{indicator.housesUsed.map((n) => `H${n}`).join(' + ')}</p>
      </div>
    </Card>
  );
}
