'use client';

import { FigureGlyph } from '../FigureGlyph';
import type { Chart } from '@/lib/raml/casting';
import type { ReadingRecord } from '@/lib/raml/history';
import { catalogEntry } from '@/lib/raml/questionCatalog';
import { currentChartKind } from '@/lib/raml/methodPractice';
import { QUESTION_REGISTRY_META } from '@/lib/raml/questionRegistryMeta';

/**
 * Phase 1: a compact, read-only preview of the user's current chart (the
 * most recent saved reading) shown BEFORE they apply a method to it — when it
 * was cast, what it was cast for, and its sixteen figures. Display only: the
 * chart it receives was already rebuilt by the same buildChart() the History
 * screen uses, and nothing here can change it.
 */
export function CurrentChartPreview({ chart, record }: { chart: Chart; record: ReadingRecord }) {
  const entry = catalogEntry(record.questionId);
  const castFor = entry?.title ?? 'A general reading';
  const when = formatWhen(record.createdAt);
  // Corrective QA (B/C): say plainly what kind of chart this is and where it
  // came from, so it is never used without the user knowing which it is.
  const kind = currentChartKind(record);
  // Practice polish: a chart cast from a method practice says so, and its
  // question is shown as the SOURCE question — the user never typed it.
  const practiceMethod = record.practice
    ? QUESTION_REGISTRY_META[record.practice.chapterId]?.methods.find((m) => m.id === record.practice!.methodId)?.label
    : undefined;
  const chapterPart = entry?.chapterNumber != null ? ` · Kanzul Mikban, Chapter ${entry.chapterNumber}` : '';
  const source = record.practice
    ? `${kind === 'mothers_only' ? 'Dream method practice chart' : 'Method practice chart'}${chapterPart}${
        practiceMethod ? ` · ${practiceMethod}` : ''
      }`
    : kind === 'general'
      ? 'General reading chart'
      : `${kind === 'mothers_only' ? 'Dream reading chart' : 'Question chart'}${chapterPart}`;

  return (
    <div>
      <p className="type-body font-medium text-sand-light">{source}</p>
      <p className="mt-0.5 type-meta text-sand/65">
        {when ? `Cast ${when}` : 'Cast earlier'} · {record.practice ? `Source question: “${castFor}”` : castFor}
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
