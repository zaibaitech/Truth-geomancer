'use client';

import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { FigureGlyph } from './FigureGlyph';
import { Badge } from '@/components/ui/Badge';
import { buildChart } from '@/lib/raml/casting';
import { ELEMENT_LABEL } from '@/content/stars';
import { getIntentionById } from '@/content/intentions';
import type { SavedCasting } from '@/lib/raml/storage';

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function CastingListItem({
  casting,
  onDelete,
}: {
  casting: SavedCasting;
  onDelete?: (id: string) => void;
}) {
  const judge = buildChart(casting.mothers).houses[14];
  const intention = casting.intentionId ? getIntentionById(casting.intentionId) : undefined;
  const label = casting.question || (intention && intention.id !== 'general' ? intention.label : 'General reading');

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-sand/10 bg-ink-card p-3">
      <Link href={`/raml/history/${casting.id}`} className="flex flex-1 items-center gap-3 overflow-hidden">
        <FigureGlyph pattern={judge.pattern} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-sand-light">{label}</p>
          <p className="text-[11px] text-sand/40">{formatDate(casting.createdAt)}</p>
          <div className="mt-1">
            <Badge tone={judge.star.element}>
              {judge.star.name} · {ELEMENT_LABEL[judge.star.element]}
            </Badge>
          </div>
        </div>
      </Link>
      {onDelete ? (
        <button
          onClick={() => onDelete(casting.id)}
          aria-label="Delete casting"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sand/35"
        >
          <Trash2 size={15} />
        </button>
      ) : null}
    </div>
  );
}
