'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2, Sparkles, TriangleAlert } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { CastingResultView } from '@/components/raml/CastingResultView';
import { HistoryStateBadge } from '@/components/raml/HistoryCard';
import { describeReading, deleteReading, getReading, type HistoryEntry } from '@/lib/raml/history';

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function SavedReadingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'found' | 'missing'>('loading');
  const [entry, setEntry] = useState<HistoryEntry | null>(null);

  // The saved chart is rebuilt and the engine re-run against it — the reading
  // is never re-cast, so a past result cannot change (Prompt 16, sections 3
  // and 6). describeReading does the rebuilding; this page only displays it.
  useEffect(() => {
    const record = getReading(params.id);
    if (!record) {
      setState('missing');
      return;
    }
    setEntry(describeReading(record));
    setState('found');
  }, [params.id]);

  function handleDelete() {
    deleteReading(params.id);
    router.push('/raml/history');
  }

  return (
    <div>
      <Header title="Saved Reading" />
      <div className="px-4 py-3">
        <Link href="/raml/history" className="inline-flex items-center gap-1.5 text-xs text-sand/50">
          <ArrowLeft size={14} /> All past readings
        </Link>
      </div>

      {state === 'missing' ? (
        <div className="mx-4 flex flex-col items-center gap-3 rounded-2xl border border-sand/10 py-10 text-center">
          <Sparkles size={20} className="text-clay-light" />
          <p className="text-sm text-sand/55">This reading isn’t saved on this device.</p>
          <Link href="/raml" className="mt-1 rounded-xl bg-clay px-4 py-2.5 text-sm font-semibold text-ink">
            Start a Reading
          </Link>
        </div>
      ) : null}

      {state === 'found' && entry ? (
        entry.stateKind !== 'unreconstructable' && entry.chart ? (
          <CastingResultView
            chart={entry.chart}
            question={entry.intentionText ?? ''}
            intentionId={entry.record.questionId}
            meta={
              <>
                <p className="mt-1 text-[11px] text-sand/35">{formatDate(entry.record.createdAt)}</p>
                {entry.sourceLabel ? (
                  <p className="mt-0.5 text-[11px] text-sand/35">{entry.sourceLabel}</p>
                ) : null}
                <div className="mt-1.5">
                  <HistoryStateBadge entry={entry} />
                </div>
              </>
            }
            footer={
              <div className="mx-4 mb-2 mt-6 flex gap-2">
                <Link
                  href="/raml"
                  className="flex-1 rounded-xl border border-sand/15 py-3 text-center text-sm text-sand/70"
                >
                  New reading
                </Link>
                <button
                  onClick={handleDelete}
                  aria-label="Delete this reading from this device"
                  className="flex items-center justify-center rounded-xl border border-clay/25 px-4 text-clay-light"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            }
          />
        ) : (
          // The question this reading was asked under is no longer in the app,
          // so no verdict can be shown for it. The chart itself is still
          // complete, and is shown below rather than thrown away.
          <div className="px-4">
            <Card>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-clay-light">
                <TriangleAlert size={15} /> {entry.stateLabel}
              </p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-sand/60">{entry.unavailableReason}</p>
              {entry.intentionText ? (
                <>
                  <p className="mt-4 text-[11px] uppercase tracking-widest text-sand/40">You wrote</p>
                  <p className="mt-1 text-[12.5px] italic text-sand/60">“{entry.intentionText}”</p>
                </>
              ) : null}
              <p className="mt-4 text-[11px] text-sand/35">{formatDate(entry.record.createdAt)}</p>
              {entry.chart ? (
                <p className="mt-3 text-[12px] leading-relaxed text-sand/50">
                  The chart you cast that day is intact and is shown below — it can still be read against any
                  question in the app.
                </p>
              ) : null}
            </Card>

            {entry.chart ? (
              <div className="-mx-4 mt-4">
                <CastingResultView chart={entry.chart} />
              </div>
            ) : null}

            <div className="mt-4 flex gap-2">
              <Link
                href="/raml"
                className="flex-1 rounded-xl border border-sand/15 py-3 text-center text-sm text-sand/70"
              >
                Start a Reading
              </Link>
              <button
                onClick={handleDelete}
                aria-label="Delete this reading from this device"
                className="flex items-center justify-center rounded-xl border border-clay/25 px-4 text-clay-light"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}
