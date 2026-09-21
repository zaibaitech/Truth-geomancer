import { Card } from '@/components/ui/Card';
import { FigureGlyph } from './FigureGlyph';
import type { Chart } from '@/lib/raml/casting';
import { dreamWorkingFromChart, type DreamWorkingFigure } from '@/lib/raml/dreamPairingPresentation';

function WorkingGlyph({ figure, size = 'md' }: { figure: DreamWorkingFigure; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <FigureGlyph pattern={figure.pattern} size={size} />
      <p className="min-w-0 type-body font-medium text-sand-light break-words">{figure.star.name}</p>
    </div>
  );
}

/** Visible Chapter 151 working: four Mothers and the three pairing products.
 * Never labels those products as Daughters, Nieces, Witnesses, Judge, or Reconciler. */
export function DreamWorkingPanel({ chart }: { chart: Chart }) {
  const working = dreamWorkingFromChart(chart);
  if (!working) return null;

  return (
    <div className="space-y-4">
      <Card>
        <p className="type-section font-semibold text-sand-light">The Four Mothers</p>
        <p className="mt-1 type-meta text-sand/65">The four Umuhat you drew.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {working.mothers.map((mother) => (
            <div
              key={mother.key}
              className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl border border-sand/10 bg-ink px-2 py-3 text-center"
            >
              <p className="type-label uppercase tracking-widest text-sand/65">{mother.label}</p>
              <FigureGlyph pattern={mother.pattern} size="md" />
              <p className="type-label text-sand-light break-words">{mother.star.name}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="type-section font-semibold text-sand-light">The Pairing</p>
        <p className="mt-1 type-meta text-sand/65">Mother 1 with Mother 2, Mother 3 with Mother 4, then those two results.</p>
        <div className="mt-3 space-y-3">
          <div className="rounded-xl border border-sand/10 bg-ink px-3 py-3">
            <p className="type-meta text-sand/65">Mother 1 + Mother 2</p>
            <p className="mt-0.5 type-label uppercase tracking-widest text-clay-light">→ Pair 1</p>
            <div className="mt-2">
              <WorkingGlyph figure={working.pair1} />
            </div>
          </div>
          <div className="rounded-xl border border-sand/10 bg-ink px-3 py-3">
            <p className="type-meta text-sand/65">Mother 3 + Mother 4</p>
            <p className="mt-0.5 type-label uppercase tracking-widest text-clay-light">→ Pair 2</p>
            <div className="mt-2">
              <WorkingGlyph figure={working.pair2} />
            </div>
          </div>
          <div className="rounded-xl border border-clay/25 bg-ink px-3 py-3">
            <p className="type-meta text-sand/65">Pair 1 + Pair 2</p>
            <p className="mt-0.5 type-label uppercase tracking-widest text-clay-light">→ Final Figure</p>
            <div className="mt-2">
              <WorkingGlyph figure={working.final} size="lg" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
