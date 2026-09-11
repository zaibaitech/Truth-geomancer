import { FigureGlyph } from './FigureGlyph';
import { Badge } from '@/components/ui/Badge';
import { FORTUNE_LABEL, UPDOWN_LABEL } from '@/content/classicalAttributes';
import type { MethodVerdictResult } from '@/lib/raml/methodVerdicts';

const FORTUNE_TONE = { good: 'sand', bad: 'fire', neutral: 'neutral' } as const;
const UPDOWN_TONE = { upward: 'air', downward: 'water', level: 'neutral' } as const;

export function MethodVerdictCard({ verdict }: { verdict: MethodVerdictResult }) {
  const { result } = verdict;

  return (
    <div className="rounded-xl border border-sand/10 bg-ink px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-clay-light">{verdict.label}</p>

      <div className="mt-2 space-y-0.5">
        {verdict.calculationSteps.map((step, i) => (
          <p key={i} className="text-[12px] text-sand/50">
            {step}
          </p>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <FigureGlyph pattern={result.pattern} size="sm" />
        <div>
          <p className="text-sm font-medium text-sand-light">{result.starName}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge tone={FORTUNE_TONE[result.fortune]}>{FORTUNE_LABEL[result.fortune]}</Badge>
            <Badge tone={UPDOWN_TONE[result.upDown]}>{UPDOWN_LABEL[result.upDown]}</Badge>
          </div>
        </div>
      </div>

      <p className={`mt-3 text-sm leading-relaxed ${verdict.ambiguous ? 'text-sand/50 italic' : 'text-sand-light'}`}>
        {verdict.interpretation}
      </p>
    </div>
  );
}
