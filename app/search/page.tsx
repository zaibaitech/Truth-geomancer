'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search as SearchIcon, BookOpen, FileText, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { FigureGlyph } from '@/components/raml/FigureGlyph';
import { BOOKS, getBookById } from '@/content/books';
import { getAllChapterRefs } from '@/lib/books/chapters';
import { STARS, ELEMENT_LABEL } from '@/content/stars';

const MAX_RESULTS = 30;

type Result =
  | { kind: 'book'; key: string; href: string; title: string; subtitle: string }
  | { kind: 'chapter'; key: string; href: string; title: string; subtitle: string }
  | { kind: 'star'; key: string; href: string; title: string; subtitle: string; pattern: (typeof STARS)[number]['pattern'] };

export default function SearchPage() {
  const [query, setQuery] = useState('');

  const { results, totalCount } = useMemo<{ results: Result[]; totalCount: number }>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { results: [], totalCount: 0 };

    const bookResults: Result[] = BOOKS.filter(
      (b) => b.title.toLowerCase().includes(q) || b.subtitle.toLowerCase().includes(q),
    ).map((b) => ({ kind: 'book', key: b.id, href: `/books/${b.id}`, title: b.title, subtitle: b.subtitle }));

    const chapterResults: Result[] = getAllChapterRefs()
      .filter((c) => c.title.toLowerCase().includes(q))
      .map((c) => ({
        kind: 'chapter',
        key: `${c.bookId}-${c.id}`,
        href: `/books/${c.bookId}/read#${c.id}`,
        title: c.title,
        subtitle: `${getBookById(c.bookId)?.title ?? ''}${c.number !== null ? ` · Chapter ${c.number}` : ''}`,
      }));

    const starResults: Result[] = STARS.filter((s) => s.name.toLowerCase().includes(q)).map((s) => ({
      kind: 'star',
      key: s.id,
      href: `/books/master-of-geomancy-vol-1/read#${s.id}`,
      title: s.name,
      subtitle: ELEMENT_LABEL[s.element],
      pattern: s.pattern,
    }));

    const all = [...bookResults, ...starResults, ...chapterResults];
    return { results: all.slice(0, MAX_RESULTS), totalCount: all.length };
  }, [query]);

  return (
    <div>
      <Header title="Search" subtitle="Books, chapters and stars" />
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 rounded-xl border border-sand/15 bg-ink-card px-3 py-2.5">
          <SearchIcon size={16} className="text-sand/40" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search “pregnancy”, “travel”, “Yussif”…"
            className="w-full bg-transparent text-sm text-sand-light placeholder:text-sand/30 focus:outline-none"
          />
        </div>

        {query.trim() && results.length === 0 ? (
          <p className="mt-6 text-center text-sm text-sand/40">Nothing found for “{query}”.</p>
        ) : null}

        <div className="mt-4 space-y-2">
          {results.map((r) => (
            <Link
              key={`${r.kind}-${r.key}`}
              href={r.href}
              className="flex items-center gap-3 rounded-xl border border-sand/10 bg-ink-card px-3 py-2.5"
            >
              {r.kind === 'star' ? (
                <FigureGlyph pattern={r.pattern} size="sm" />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sand/15 text-clay-light">
                  {r.kind === 'book' ? <BookOpen size={14} /> : <FileText size={14} />}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-sand-light">{r.title}</p>
                <p className="text-[11px] text-sand/45">{r.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>

        {totalCount > results.length ? (
          <p className="mt-3 text-center text-[11px] text-sand/35">
            Showing {results.length} of {totalCount} matches — refine your search to narrow it down.
          </p>
        ) : null}

        {!query.trim() ? (
          <div className="mt-8 flex flex-col items-center gap-2 text-center">
            <Sparkles size={18} className="text-sand/25" />
            <p className="text-sm text-sand/40">
              Search both books — 160+ chapters and reading methods — plus all 16 stars.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
