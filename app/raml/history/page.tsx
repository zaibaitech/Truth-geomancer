'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Sparkles, Trash2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { HistoryCard } from '@/components/raml/HistoryCard';
import {
  clearHistory,
  deleteReading,
  describeHistory,
  filterHistory,
  isHistoryAvailable,
  listReadings,
  searchHistory,
  type HistoryEntry,
  type HistoryFilter,
} from '@/lib/raml/history';

const FILTERS: { id: HistoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'favourable', label: 'Favourable' },
  { id: 'unfavourable', label: 'Unfavourable' },
  { id: 'mixed', label: 'Mixed' },
  { id: 'descriptive', label: 'Descriptive' },
  { id: 'unresolved', label: 'Unresolved' },
];

/** Search and filters only appear once there is enough history to need them —
 * below that they are clutter on an otherwise obvious list. */
const TOOLS_THRESHOLD = 6;

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [available, setAvailable] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    setAvailable(isHistoryAvailable());
    setEntries(describeHistory(listReadings()));
  }, []);

  const visible = useMemo(() => {
    if (!entries) return [];
    return searchHistory(filterHistory(entries, filter), query);
  }, [entries, filter, query]);

  function handleDelete(id: string) {
    const removed = entries?.find((e) => e.record.id === id);
    deleteReading(id);
    setEntries((prev) => (prev ? prev.filter((e) => e.record.id !== id) : prev));
    setAnnouncement(removed ? `Deleted the reading “${removed.title}”.` : 'Reading deleted.');
  }

  function handleClearAll() {
    if (!confirmingClear) {
      setConfirmingClear(true);
      return;
    }
    clearHistory();
    setEntries([]);
    setConfirmingClear(false);
    setAnnouncement('All readings deleted from this device.');
  }

  const showTools = (entries?.length ?? 0) >= TOOLS_THRESHOLD;

  return (
    <div>
      <Header title="Past Readings" subtitle="Saved on this device only" />
      <div className="px-4 py-4">
        <Link href="/raml" className="mb-4 inline-flex items-center gap-1.5 type-meta text-sand/65">
          <ArrowLeft size={14} /> Back to casting
        </Link>

        {/* Deletions and clear-all are silent visual changes otherwise. */}
        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>

        {!available ? (
          <p className="mb-4 rounded-xl border border-clay/25 bg-clay/5 px-3 py-2.5 type-meta text-sand/70">
            This browser is not letting the app store anything on this device, so readings cannot be kept
            here. Everything else still works — a reading you cast now will simply not be saved.
          </p>
        ) : null}

        {entries === null ? null : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-sand/10 py-10 text-center">
            <Sparkles size={20} className="text-clay-light" />
            <p className="type-body font-medium text-sand-light">Your readings will appear here.</p>
            <p className="max-w-[260px] type-meta text-sand/65">
              Complete a geomancy reading and it will be available here for you to revisit — kept on this
              device, never sent anywhere.
            </p>
            <Link href="/raml" className="mt-1 rounded-xl bg-clay px-4 py-2.5 type-body font-semibold text-ink">
              Start a Reading
            </Link>
          </div>
        ) : (
          <>
            {showTools ? (
              <>
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-sand/15 bg-ink-card px-3 py-2">
                  <Search size={14} className="shrink-0 text-sand/65" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search your past readings"
                    placeholder="Search your readings…"
                    className="w-full bg-transparent type-body text-sand-light placeholder:text-sand/65"
                  />
                  {query ? (
                    <button type="button" onClick={() => setQuery('')} className="shrink-0 type-label text-sand/65">
                      Clear
                    </button>
                  ) : null}
                </div>
                <div className="scrollbar-none mb-3 flex gap-1.5 overflow-x-auto pb-1">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilter(f.id)}
                      aria-pressed={filter === f.id}
                      className={`shrink-0 rounded-full px-3 py-1.5 type-label font-medium ${
                        filter === f.id ? 'bg-clay text-ink' : 'border border-sand/15 text-sand/70'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            <p role="status" className="mb-2 type-label uppercase tracking-widest text-sand/65">
              {visible.length} of {entries.length} reading{entries.length === 1 ? '' : 's'}
            </p>

            {visible.length === 0 ? (
              <p className="rounded-xl border border-sand/12 bg-ink-card px-3 py-6 text-center type-body text-sand/65">
                No saved reading matches that.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {visible.map((entry) => (
                  <HistoryCard key={entry.record.id} entry={entry} onDelete={handleDelete} />
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleClearAll}
              className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 type-body ${
                confirmingClear ? 'border-clay/50 bg-clay/10 text-clay-light' : 'border-sand/15 text-sand/70'
              }`}
            >
              <Trash2 size={14} />
              {confirmingClear ? 'Tap again to delete all readings — this cannot be undone' : 'Clear all readings'}
            </button>
            {confirmingClear ? (
              <button
                type="button"
                onClick={() => setConfirmingClear(false)}
                className="mt-2 w-full rounded-xl py-2 type-meta text-sand/65"
              >
                Cancel
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
