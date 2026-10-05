'use client';

import { Card } from '@/components/ui/Card';
import { FigureGlyph } from '../FigureGlyph';
import type { Chart } from '@/lib/raml/casting';
import { houseInfo } from '@/lib/raml/houses';

/**
 * The existing chart, read-only, with the houses a method's source
 * instructions name highlighted — and tappable, so a learner confirms them
 * one by one rather than being told to trust a highlight. Tapping only ever
 * toggles this component's own `selected` set; it never touches `chart`, so
 * the underlying figures can't be changed by mistake (Prompt 20, section 6).
 * A house not in `required` renders exactly as ChartGrid already shows it
 * elsewhere — same figure, same star name — just not interactive here.
 */
// Long house titles ("Transformation", "Illness & Enemies") must wrap
// inside a 360px-wide quarter tile rather than run past its border.
const WRAP = 'block w-full min-w-0 break-words hyphens-auto';

export function HouseSelector({
  chart,
  required,
  selected,
  onToggle,
  readOnly = false,
  hideTitles = false,
}: {
  chart: Chart;
  required: number[];
  selected: Set<number>;
  onToggle: (n: number) => void;
  /** Phase 1 corrective QA: the same grid as a non-interactive record —
   * required houses outlined, nothing tappable (outcome screens). */
  readOnly?: boolean;
  /** For a chart that is not the querent's own shield (a recast's second
   * chart), whose house numbers must not carry the original roles' titles. */
  hideTitles?: boolean;
}) {
  const requiredSet = new Set(required);

  return (
    <div className="grid grid-cols-4 gap-2">
      {chart.houses.map((h) => {
        const info = houseInfo(h.n);
        const isRequired = requiredSet.has(h.n);
        const isSelected = selected.has(h.n);

        if (!isRequired) {
          // Rendered exactly as ChartGrid already shows every house — same
          // classes, same contrast — just not part of this method.
          return (
            <Card key={h.n} padding="px-1 py-2" className="flex min-w-0 flex-col items-center gap-1.5 text-center">
              <span className="type-label text-sand/65">H{h.n}</span>
              <FigureGlyph pattern={h.pattern} size="sm" />
              <span className={`type-label text-sand-light ${WRAP}`}>{h.star.name}</span>
              {hideTitles ? null : <span className={`type-label text-sand/65 ${WRAP}`}>{info.title}</span>}
            </Card>
          );
        }

        if (readOnly) {
          return (
            <div
              key={h.n}
              aria-label={`House ${h.n}${hideTitles ? '' : `, ${info.title}`}: ${h.star.name}. Used by this method.`}
              className="flex min-h-[84px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl border border-clay bg-clay/15 px-1 py-2 text-center"
            >
              <span className="type-label font-medium text-clay-light">H{h.n}</span>
              <FigureGlyph pattern={h.pattern} size="sm" />
              <span className={`type-label text-sand-light ${WRAP}`}>{h.star.name}</span>
              {hideTitles ? null : <span className={`type-label text-sand/65 ${WRAP}`}>{info.title}</span>}
            </div>
          );
        }

        return (
          <button
            key={h.n}
            type="button"
            onClick={() => onToggle(h.n)}
            aria-pressed={isSelected}
            aria-label={`House ${h.n}, ${info.title}. ${isSelected ? 'Selected' : 'Required — tap to select'}.`}
            className={`flex min-h-[84px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl border px-1 py-2 text-center transition-colors ${
              isSelected ? 'border-clay bg-clay/15' : 'border-clay/40 bg-ink-card'
            }`}
          >
            <span className={`type-label font-medium ${isSelected ? 'text-clay-light' : 'text-sand-light'}`}>
              H{h.n}
            </span>
            <FigureGlyph pattern={h.pattern} size="sm" />
            {hideTitles ? null : <span className={`type-label text-sand/65 ${WRAP}`}>{info.title}</span>}
          </button>
        );
      })}
    </div>
  );
}
