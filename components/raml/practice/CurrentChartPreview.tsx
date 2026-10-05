'use client';

import { FigureGlyph } from '../FigureGlyph';
import type { Chart } from '@/lib/raml/casting';
import type { ReadingRecord } from '@/lib/raml/history';
import { catalogEntry } from '@/lib/raml/questionCatalog';

/**
 * Phase 1: a compact, read-only preview of the user's current chart (the
 * most recent saved reading) shown BEFORE they apply a method to it — when it
 * was cast, what it was cast for, and its sixteen figures. Display only: the
 * chart it receives was already rebuilt by the same buildChart() the History
 * screen uses, and nothing here can change it.
 */
export function CurrentChartPreview({ chart, record }: { chart: Chart; record: ReadingRecord }) {
  const castFor = catalogEntry(record.questionId)?.title ?? 'A general reading';
  const when = formatWhen(record.createdAt);

  return (
    <div>
      <p className="type-meta text-sand/65">
        {when ? `Cast ${when}` : 'Cast earlier'} · {castFor}
      </p>
      {record.intentionText ? (
        <p className="mt-1 type-meta italic text-sand/65 break-words">“{record.intentionText}”</p>
      ) : null}
      <div className="mt-2.5 grid grid-cols-8 gap-1" role="list" aria-label="Your current chart’s sixteen houses">
        {chart.houses.map((h) => (
          <div
            key={h.n}
            role="listitem"
            aria-label={`House ${h.n}: ${h.star.name}`}
            className="flex min-w-0 flex-col items-center gap-1 rounded-md border border-sand/10 bg-ink py-1.5"
          >
            <span className="type-label text-sand/65" aria-hidden>
              {h.n}
            </span>
            <FigureGlyph pattern={h.pattern} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

function formatWhen(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}
