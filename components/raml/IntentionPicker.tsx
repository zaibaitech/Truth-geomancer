'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Clock, Search, Sparkles, Check } from 'lucide-react';
import { CATEGORIES, INTENTIONS, getIntentionById, intentionsInCategory, type CategoryId } from '@/content/intentions';
import { INTENTION_ICONS } from './intentionIcons';
import { recordRecentIntention, listRecentIntentionIds } from '@/lib/raml/recentIntentions';

type View = 'categories' | 'all';

function QuestionRow({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 border-b border-sand/8 px-3 py-2.5 text-left last:border-b-0 ${
        selected ? 'bg-clay/10' : ''
      }`}
    >
      <span className={`text-[13px] leading-snug ${selected ? 'text-sand-light' : 'text-sand/75'}`}>{label}</span>
      {selected ? <Check size={14} className="shrink-0 text-clay-light" /> : null}
    </button>
  );
}

export function IntentionPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [view, setView] = useState<View>('categories');
  const [expanded, setExpanded] = useState<CategoryId | 'recent' | null>(null);
  const [query, setQuery] = useState('');
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    setRecentIds(listRecentIntentionIds());
  }, []);

  function select(id: string) {
    onChange(id);
    recordRecentIntention(id);
    setRecentIds(listRecentIntentionIds());
    setExpanded(null);
  }

  const selected = getIntentionById(value);
  const recentIntentions = recentIds.map((id) => getIntentionById(id)).filter((i): i is NonNullable<typeof i> => !!i);

  const filteredAll = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = INTENTIONS.filter((i) => i.id !== 'general').slice().sort((a, b) => a.label.localeCompare(b.label));
    if (!q) return list;
    return list.filter((i) => i.label.toLowerCase().includes(q));
  }, [query]);

  return (
    <div>
      {/* Current selection + General Reading shortcut */}
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => select('general')}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
            value === 'general' ? 'border-clay/60 bg-clay/10 text-sand-light' : 'border-sand/15 text-sand/60'
          }`}
        >
          <Sparkles size={13} /> General Reading
        </button>
        {selected && selected.id !== 'general' ? (
          <span className="min-w-0 flex-1 truncate rounded-full border border-clay/30 bg-clay/10 px-3 py-1.5 text-xs text-sand-light">
            {selected.label}
          </span>
        ) : null}
      </div>

      {/* View toggle */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setView('categories')}
          className={`rounded-xl py-2 text-xs font-semibold ${
            view === 'categories' ? 'bg-clay text-ink' : 'border border-sand/15 text-sand/60'
          }`}
        >
          Categories
        </button>
        <button
          type="button"
          onClick={() => setView('all')}
          className={`rounded-xl py-2 text-xs font-semibold ${
            view === 'all' ? 'bg-clay text-ink' : 'border border-sand/15 text-sand/60'
          }`}
        >
          All (A-Z)
        </button>
      </div>

      {view === 'categories' ? (
        <div className="overflow-hidden rounded-xl border border-sand/12">
          {recentIntentions.length > 0 ? (
            <div className="border-b border-sand/12 last:border-b-0">
              <button
                type="button"
                onClick={() => setExpanded(expanded === 'recent' ? null : 'recent')}
                className="flex w-full items-center gap-2.5 bg-ink-card px-3 py-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sand/15 text-clay-light">
                  <Clock size={15} />
                </div>
                <span className="flex-1 text-left text-[13px] font-medium text-sand-light">Recent</span>
                <span className="text-xs text-sand/40">{recentIntentions.length}</span>
                {expanded === 'recent' ? (
                  <ChevronDown size={15} className="text-sand/40" />
                ) : (
                  <ChevronRight size={15} className="text-sand/40" />
                )}
              </button>
              {expanded === 'recent'
                ? recentIntentions.map((i) => (
                    <QuestionRow key={i.id} label={i.label} selected={value === i.id} onClick={() => select(i.id)} />
                  ))
                : null}
            </div>
          ) : null}

          {CATEGORIES.map((cat) => {
            const Icon = INTENTION_ICONS[cat.icon];
            const items = intentionsInCategory(cat.id);
            const isOpen = expanded === cat.id;
            return (
              <div key={cat.id} className="border-b border-sand/12 last:border-b-0">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : cat.id)}
                  className="flex w-full items-center gap-2.5 bg-ink-card px-3 py-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sand/15 text-clay-light">
                    <Icon size={15} />
                  </div>
                  <span className="flex-1 text-left text-[13px] font-medium text-sand-light">{cat.label}</span>
                  <span className="text-xs text-sand/40">{items.length}</span>
                  {isOpen ? (
                    <ChevronDown size={15} className="text-sand/40" />
                  ) : (
                    <ChevronRight size={15} className="text-sand/40" />
                  )}
                </button>
                {isOpen ? items.map((i) => <QuestionRow key={i.id} label={i.label} selected={value === i.id} onClick={() => select(i.id)} />) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-sand/15 bg-ink-card px-3 py-2">
            <Search size={14} className="text-sand/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter questions…"
              className="w-full bg-transparent text-sm text-sand-light placeholder:text-sand/30 focus:outline-none"
            />
          </div>
          <div className="max-h-80 overflow-y-auto rounded-xl border border-sand/12">
            {filteredAll.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-sand/40">No questions match “{query}”.</p>
            ) : (
              filteredAll.map((i) => (
                <QuestionRow key={i.id} label={i.label} selected={value === i.id} onClick={() => select(i.id)} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
