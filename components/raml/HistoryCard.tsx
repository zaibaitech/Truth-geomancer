'use client';

import Link from 'next/link';
import { Check, CircleHelp, CircleSlash, Split, Compass, Sparkles, FileText, TriangleAlert, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { HistoryEntry, HistoryStateKind } from '@/lib/raml/history';

const STATE_ICON: Record<HistoryStateKind, LucideIcon> = {
  favourable: Check,
  unfavourable: CircleSlash,
  mixed: Split,
  descriptive: Compass,
  insufficient: CircleHelp,
  'source-detail-missing': CircleHelp,
  'not-defined-in-source': CircleHelp,
  'no-automatic-reading': FileText,
  general: Sparkles,
  unreconstructable: TriangleAlert,
};

// Tone is an accent only. Every badge also carries its own words and an icon,
// so nothing here depends on colour to be understood (Prompt 16, section 21).
const STATE_TONE: Record<HistoryStateKind, string> = {
  favourable: 'border-sand/30 text-sand-light',
  unfavourable: 'border-clay/40 text-clay-light',
  mixed: 'border-clay/30 text-clay-light',
  descriptive: 'border-sand/25 text-sand-light',
  insufficient: 'border-sand/15 text-sand/70',
  'source-detail-missing': 'border-sand/15 text-sand/70',
  'not-defined-in-source': 'border-sand/15 text-sand/70',
  'no-automatic-reading': 'border-sand/15 text-sand/70',
  general: 'border-sand/20 text-sand/70',
  unreconstructable: 'border-clay/30 text-clay-light',
};

export function HistoryStateBadge({ entry }: { entry: HistoryEntry }) {
  const Icon = STATE_ICON[entry.stateKind];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 type-label font-medium ${
        STATE_TONE[entry.stateKind]
      }`}
    >
      <Icon size={11} aria-hidden />
      {entry.stateLabel}
    </span>
  );
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** One past reading, as a journal entry rather than a table row: the question
 * first, then what came of it, then quiet provenance. */
export function HistoryCard({
  entry,
  onDelete,
}: {
  entry: HistoryEntry;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-sand/10 bg-ink-card p-3">
      <Link href={`/raml/history/${entry.record.id}`} className="min-w-0 flex-1">
        <p className="type-body font-medium text-sand-light">{entry.title}</p>
        {entry.intentionText ? (
          <p className="mt-1 line-clamp-2 type-label italic text-sand/70">“{entry.intentionText}”</p>
        ) : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <HistoryStateBadge entry={entry} />
          {entry.sourceLabel ? <span className="type-label text-sand/65">{entry.sourceLabel}</span> : null}
        </div>
        <p className="mt-1.5 type-label text-sand/65">{formatDate(entry.record.createdAt)}</p>
      </Link>
      {onDelete ? (
        <button
          type="button"
          onClick={() => onDelete(entry.record.id)}
          aria-label={`Delete the reading “${entry.title}” from ${formatDate(entry.record.createdAt)}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sand/10 text-sand/65"
        >
          <Trash2 size={14} />
        </button>
      ) : null}
    </div>
  );
}
