'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Clock, Search, Sparkles } from 'lucide-react';
import { CATEGORIES, type CategoryId } from '@/content/intentions';
import { INTENTION_ICONS } from './intentionIcons';
import { QuestionCard } from './QuestionCard';
import { recordRecentIntention, listRecentIntentionIds } from '@/lib/raml/recentIntentions';
import {
  QUESTION_CATALOG,
  SUGGESTED_QUESTIONS,
  catalogEntry,
  catalogInCategory,
  categoryCounts,
  searchCatalog,
} from '@/lib/raml/questionCatalog';

type View = { kind: 'home' } | { kind: 'category'; id: CategoryId } | { kind: 'all' };

/** The question picker, organised around what a person wants to know rather
 * than around the manuscript's chapter order (Prompt 15, sections 3-7).
 *
 * Three ways in, all over the SAME 153 catalogue entries: search, a category,
 * or the full A-Z list. Nothing here can surface a question that is not
 * already registered — `searchCatalog` filters the existing catalogue and
 * never generates anything. */
export function IntentionPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [view, setView] = useState<View>({ kind: 'home' });
  const [query, setQuery] = useState('');
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    setRecentIds(listRecentIntentionIds());
  }, []);

  // Opening a category from a tile far down the landing page used to leave the
  // list scrolled to wherever that tile happened to be (measured: 535px in at
  // 360px wide). The step-level reset in CastingFlow does not fire for a view
  // change inside the picker, so the picker resets its own container. Search
  // results deliberately do NOT reset — the field must stay under the cursor
  // while typing.
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    document.querySelector('[data-app-scroll]')?.scrollTo({ top: 0 });
  }, [view]);

  function select(id: string) {
    recordRecentIntention(id);
    setRecentIds(listRecentIntentionIds());
    onChange(id);
  }

  const counts = useMemo(() => categoryCounts(), []);
  const results = useMemo(() => (query.trim() ? searchCatalog(query) : null), [query]);
  const recentEntries = useMemo(
    () => recentIds.map((id) => catalogEntry(id)).filter((e): e is NonNullable<typeof e> => !!e),
    [recentIds],
  );

  const alphabetical = useMemo(() => [...QUESTION_CATALOG].sort((a, b) => a.title.localeCompare(b.title)), []);

  function renderList(entries: typeof QUESTION_CATALOG) {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {entries.map((entry) => (
          <QuestionCard key={entry.id} entry={entry} selected={value === entry.id} onClick={() => select(entry.id)} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Search is always the fastest route, so it stays at the top of every
          view rather than hiding inside an "All questions" tab. */}
      <div className="mb-3 flex items-center gap-2 rounded-xl border border-sand/15 bg-ink-card px-3 py-2">
        <Search size={14} className="shrink-0 text-sand/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search questions"
          placeholder="Search: money, marriage, enemy, lost…"
          className="w-full bg-transparent text-sm text-sand-light placeholder:text-sand/30 focus:outline-none"
        />
        {query ? (
          <button type="button" onClick={() => setQuery('')} className="shrink-0 text-[11px] text-sand/45">
            Clear
          </button>
        ) : null}
      </div>

      {results ? (
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-widest text-sand/45" role="status">
            {results.length} question{results.length === 1 ? '' : 's'} match “{query.trim()}”
          </p>
          {results.length === 0 ? (
            <p className="rounded-xl border border-sand/12 bg-ink-card px-3 py-6 text-center text-sm text-sand/45">
              Nothing in the book matches that word. Try “money”, “marriage”, “enemy”, “travel” or “lost”.
            </p>
          ) : (
            renderList(results)
          )}
        </div>
      ) : view.kind === 'home' ? (
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => select('general')}
            className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left ${
              value === 'general' ? 'border-clay/60 bg-clay/10' : 'border-sand/15 bg-ink-card'
            }`}
          >
            <Sparkles size={15} className="shrink-0 text-clay-light" />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium text-sand-light">General reading</span>
              <span className="block text-[11px] text-sand/45">Cast without a set question and read the chart itself</span>
            </span>
          </button>

          {recentEntries.length > 0 ? (
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-sand/45">
                <Clock size={12} /> Recent
              </h3>
              {renderList(recentEntries)}
            </section>
          ) : null}

          <section>
            <h3 className="mb-2 text-[11px] uppercase tracking-widest text-sand/45">What would you like to know?</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIES.map((category) => {
                const Icon = INTENTION_ICONS[category.icon];
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setView({ kind: 'category', id: category.id })}
                    className="flex flex-col items-start gap-1.5 rounded-xl border border-sand/12 bg-ink-card p-3 text-left hover:border-sand/25"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-sand/15 text-clay-light">
                      <Icon size={14} />
                    </span>
                    <span className="text-[12.5px] font-medium leading-tight text-sand-light">{category.label}</span>
                    <span className="text-[10.5px] text-sand/40">
                      {counts[category.id]} question{counts[category.id] === 1 ? '' : 's'}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            {/* "Suggested", never "Popular": the app records no usage, so any
                popularity claim would be invented. */}
            <h3 className="mb-2 text-[11px] uppercase tracking-widest text-sand/45">Suggested questions</h3>
            {renderList(SUGGESTED_QUESTIONS)}
          </section>

          <button
            type="button"
            onClick={() => setView({ kind: 'all' })}
            className="w-full rounded-xl border border-sand/15 py-2.5 text-xs font-medium text-sand/70"
          >
            Browse all {QUESTION_CATALOG.length} questions
          </button>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setView({ kind: 'home' })}
            className="mb-3 flex items-center gap-1.5 text-xs text-sand/60"
          >
            <ArrowLeft size={14} /> All categories
          </button>
          {view.kind === 'category' ? (
            <>
              <h3 className="text-sm font-semibold text-sand-light">
                {CATEGORIES.find((c) => c.id === view.id)?.label}
              </h3>
              <p className="mb-3 text-[11px] text-sand/45">
                {CATEGORIES.find((c) => c.id === view.id)?.description} · {counts[view.id]} question
                {counts[view.id] === 1 ? '' : 's'}
              </p>
              {renderList(catalogInCategory(view.id))}
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-sand-light">All questions</h3>
              <p className="mb-3 text-[11px] text-sand/45">
                Every passage in Kanzul Mikban the app can take a question from, A-Z.
              </p>
              {renderList(alphabetical)}
            </>
          )}
        </div>
      )}
    </div>
  );
}
