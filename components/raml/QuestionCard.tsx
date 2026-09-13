import { Check, ChevronRight } from 'lucide-react';
import type { CatalogEntry } from '@/lib/raml/questionCatalog';

/** One question, described the way a reader would describe it (Prompt 15,
 * section 4): the plain-language question first, the manuscript's own heading
 * underneath as supporting detail, then the category and chapter as quiet
 * metadata. The chapter number is deliberately not the loudest thing on the
 * card — it is where the question comes from, not what it is. */
export function QuestionCard({
  entry,
  selected,
  onClick,
}: {
  entry: CatalogEntry;
  selected: boolean;
  onClick: () => void;
}) {
  const badge = entry.availability.kind === 'no-automatic-reading' ? entry.availability.badge : null;
  const consolidated = entry.availability.kind === 'consolidated';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-start gap-2.5 rounded-xl border p-3 text-left transition-colors ${
        selected ? 'border-clay/60 bg-clay/10' : 'border-sand/12 bg-ink-card hover:border-sand/25'
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block type-body font-medium text-sand-light">{entry.title}</span>
        {entry.hasShortTitle ? (
          <span className="mt-1 block type-label text-sand/70">{entry.sourceTitle}</span>
        ) : null}
        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {entry.categoryLabel ? (
            <span className="rounded-full border border-sand/12 px-2 py-0.5 type-label text-sand/70">
              {entry.categoryLabel}
            </span>
          ) : null}
          {entry.chapterNumber !== null ? (
            <span className="type-label text-sand/65">Chapter {entry.chapterNumber}</span>
          ) : (
            <span className="type-label text-sand/65">Additional passage</span>
          )}
          {badge ? (
            <span className="rounded-full border border-clay/30 px-2 py-0.5 type-label text-clay-light">{badge}</span>
          ) : null}
          {consolidated ? (
            <span className="rounded-full border border-sand/12 px-2 py-0.5 type-label text-sand/65">
              Uses the canonical method
            </span>
          ) : null}
        </span>
      </span>
      {selected ? (
        <Check size={15} className="mt-0.5 shrink-0 text-clay-light" />
      ) : (
        <ChevronRight size={15} className="mt-0.5 shrink-0 text-sand/65" />
      )}
    </button>
  );
}
