'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { ChapterNavItem } from '@/lib/books/chapters';

export function ChapterList({ bookId, chapters }: { bookId: string; chapters: ChapterNavItem[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chapters;
    return chapters.filter((c) => c.title.toLowerCase().includes(q));
  }, [chapters, query]);

  const showFilter = chapters.length > 20;

  return (
    <div>
      {showFilter ? (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-sand/15 bg-ink-card px-3 py-2">
          <Search size={14} className="text-sand/65" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter chapters…"
            className="w-full bg-transparent text-sm text-sand-light placeholder:text-sand/65 focus:outline-none"
          />
        </div>
      ) : null}

      {showFilter && query ? (
        <p className="mb-2 text-[11px] text-sand/65">
          {filtered.length} of {chapters.length} chapters
        </p>
      ) : null}

      <Card padding="p-0">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-sand/65">No chapters match “{query}”.</p>
        ) : (
          filtered.map((ch, i) => (
            <Link
              key={ch.id}
              href={`/books/${bookId}/read#${ch.id}`}
              className={`flex items-center justify-between gap-3 px-4 py-3 text-sm ${
                i !== filtered.length - 1 ? 'border-b border-sand/10' : ''
              }`}
            >
              <span className="text-sand-light/90">
                {ch.number !== null ? <span className="mr-2 text-sand/65">{ch.number}.</span> : null}
                {ch.title}
              </span>
              <ChevronRight size={16} className="shrink-0 text-sand/65" />
            </Link>
          ))
        )}
      </Card>
    </div>
  );
}
