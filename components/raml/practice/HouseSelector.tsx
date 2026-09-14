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
export function HouseSelector({
  chart,
  required,
  selected,
  onToggle,
}: {
  chart: Chart;
  required: number[];
  selected: Set<number>;
  onToggle: (n: number) => void;
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
            <Card key={h.n} padding="p-2" className="flex flex-col items-center gap-1.5 text-center">
              <span className="type-label text-sand/65">H{h.n}</span>
              <FigureGlyph pattern={h.pattern} size="sm" />
              <span className="type-label text-sand-light">{h.star.name}</span>
              <span className="type-label text-sand/65">{info.title}</span>
            </Card>
          );
        }

        return (
          <button
            key={h.n}
            type="button"
            onClick={() => onToggle(h.n)}
            aria-pressed={isSelected}
            aria-label={`House ${h.n}, ${info.title}. ${isSelected ? 'Selected' : 'Required — tap to select'}.`}
            className={`flex min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-2xl border p-2 text-center transition-colors ${
              isSelected ? 'border-clay bg-clay/15' : 'border-clay/40 bg-ink-card'
            }`}
          >
            <span className={`type-label font-medium ${isSelected ? 'text-clay-light' : 'text-sand-light'}`}>
              H{h.n}
            </span>
            <FigureGlyph pattern={h.pattern} size="sm" />
            <span className="type-label text-sand/65">{info.title}</span>
          </button>
        );
      })}
    </div>
  );
}
