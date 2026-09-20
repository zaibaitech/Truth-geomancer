import Link from 'next/link';
import { Check, ChevronRight, Clock, Lock, Sparkles } from 'lucide-react';
import type { CatalogEntry } from '@/lib/raml/questionCatalog';
import type { QuestionCastingAccess } from '@/lib/access/castingAuthorization';
import { canProceedToCast } from '@/lib/access/castingAuthorization';

const STATE_LABEL: Record<QuestionCastingAccess['accessState'], string> = {
  'free-sample': 'Free',
  unlocked: 'Unlocked',
  pending: 'Pending',
  locked: 'Locked',
};

/** One question, described the way a reader would describe it (Prompt 15,
 * section 4): the plain-language question first, the manuscript's own heading
 * underneath as supporting detail, then the category and chapter as quiet
 * metadata. Prompt 59 adds the book-entitlement state (Free / Unlocked /
 * Pending / Locked) without exposing protected manuscript prose. */
export function QuestionCard({
  entry,
  selected,
  onClick,
  access,
}: {
  entry: CatalogEntry;
  selected: boolean;
  onClick: () => void;
  access: QuestionCastingAccess;
}) {
  const badge = entry.availability.kind === 'no-automatic-reading' ? entry.availability.badge : null;
  const consolidated = entry.availability.kind === 'consolidated';
  const allowed = canProceedToCast(access.accessState);
  const purchaseHref = access.purchaseProductId ? `/purchase/${access.purchaseProductId}` : '/purchase';

  return (
    <div
      className={`rounded-xl border ${
        selected && allowed ? 'border-clay/60 bg-clay/10' : 'border-sand/12 bg-ink-card'
      }`}
    >
      <button
        type="button"
        onClick={allowed ? onClick : undefined}
        disabled={!allowed}
        aria-pressed={allowed ? selected : undefined}
        aria-disabled={!allowed}
        className={`flex w-full items-start gap-2.5 p-3 text-left ${allowed ? 'hover:border-sand/25' : 'cursor-not-allowed'}`}
      >
        <span className="min-w-0 flex-1">
          <span className="block type-body font-medium text-sand-light">{entry.title}</span>
          {entry.hasShortTitle ? (
            <span className="mt-1 block type-label text-sand/70">{entry.sourceTitle}</span>
          ) : null}
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <AccessBadge state={access.accessState} />
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
          {!allowed && access.bookTitle ? (
            <span className="mt-1.5 block type-label text-sand/65">
              {access.accessState === 'pending'
                ? `Payment for ${access.bookTitle} is awaiting review`
                : `Requires ${access.bookTitle}`}
            </span>
          ) : null}
        </span>
        {allowed ? (
          selected ? (
            <Check size={15} className="mt-0.5 shrink-0 text-clay-light" />
          ) : (
            <ChevronRight size={15} className="mt-0.5 shrink-0 text-sand/65" />
          )
        ) : access.accessState === 'pending' ? (
          <Clock size={15} className="mt-0.5 shrink-0 text-sand/65" />
        ) : (
          <Lock size={15} className="mt-0.5 shrink-0 text-sand/65" />
        )}
      </button>
      {!allowed ? (
        <div className="border-t border-sand/10 px-3 py-2">
          <Link href={purchaseHref} className="type-label font-medium text-clay-light">
            {access.accessState === 'pending' ? 'View my request' : 'Request access'}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function AccessBadge({ state }: { state: QuestionCastingAccess['accessState'] }) {
  const tone =
    state === 'free-sample'
      ? 'border-clay/30 text-clay-light'
      : state === 'unlocked'
        ? 'border-sand/20 text-sand-light'
        : 'border-sand/15 text-sand/70';
  const Icon = state === 'free-sample' ? Sparkles : state === 'pending' ? Clock : state === 'locked' ? Lock : Check;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 type-label ${tone}`}>
      <Icon size={10} aria-hidden />
      {STATE_LABEL[state]}
    </span>
  );
}
