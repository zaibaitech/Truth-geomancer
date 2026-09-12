import { Card } from '@/components/ui/Card';
import { FigureGlyph } from '../FigureGlyph';
import type { ReadingIndicator } from '@/lib/raml/engine/reading';

/** One figure — primary or supporting — with only the attributes this
 * project actually has a verified value for (section 6: never show
 * "unknown" fields). `contextualNote`, when given, is an already-written,
 * question-specific sentence (a method's own verdict interpretation) — this
 * component never invents generic personality-style copy of its own. */
export function FigureCard({ indicator, contextualNote }: { indicator: ReadingIndicator; contextualNote?: string | null }) {
  const attributes = [indicator.fortune, indicator.direction, indicator.element].filter(Boolean) as string[];

  return (
    <Card className={indicator.role === 'primary' ? 'border-clay/25' : ''}>
      <div className="flex items-center gap-3">
        <FigureGlyph pattern={indicator.dotPattern} size={indicator.role === 'primary' ? 'md' : 'sm'} />
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-sand/40">
            {indicator.role === 'primary' ? 'Primary indicator' : 'Supporting indicator'}
          </p>
          <p className="text-sm font-medium text-sand-light">{indicator.figureName}</p>
          {attributes.length > 0 ? <p className="text-[11px] text-sand/45">{attributes.join(' • ')}</p> : null}
          <p className="text-[11px] text-sand/35">
            {indicator.methodLabel} · {indicator.housesUsed.map((n) => `H${n}`).join(' + ')}
          </p>
        </div>
      </div>
      {contextualNote ? <p className="mt-2.5 text-sm leading-relaxed text-sand/70">{contextualNote}</p> : null}
    </Card>
  );
}
