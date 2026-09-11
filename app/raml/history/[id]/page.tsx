'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { CastingResultView } from '@/components/raml/CastingResultView';
import { buildChart, type Chart } from '@/lib/raml/casting';
import { getCasting, deleteCasting, type SavedCasting } from '@/lib/raml/storage';

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short' }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

export default function SavedCastingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'found' | 'missing'>('loading');
  const [casting, setCasting] = useState<SavedCasting | null>(null);
  const [chart, setChart] = useState<Chart | null>(null);

  useEffect(() => {
    const found = getCasting(params.id);
    if (found) {
      setCasting(found);
      setChart(buildChart(found.mothers));
      setState('found');
    } else {
      setState('missing');
    }
  }, [params.id]);

  function handleDelete() {
    deleteCasting(params.id);
    router.push('/raml/history');
  }

  return (
    <div>
      <Header title="Saved Casting" />
      <div className="px-4 py-3">
        <Link href="/raml/history" className="inline-flex items-center gap-1.5 text-xs text-sand/50">
          <ArrowLeft size={14} /> All past castings
        </Link>
      </div>

      {state === 'loading' ? null : null}

      {state === 'missing' ? (
        <div className="mx-4 flex flex-col items-center gap-3 rounded-2xl border border-sand/10 py-10 text-center">
          <Sparkles size={20} className="text-clay-light" />
          <p className="text-sm text-sand/55">This casting couldn’t be found on this device.</p>
          <Link href="/raml" className="mt-1 rounded-xl bg-clay px-4 py-2.5 text-sm font-semibold text-ink">
            Cast a new chart
          </Link>
        </div>
      ) : null}

      {state === 'found' && casting && chart ? (
        <CastingResultView
          chart={chart}
          question={casting.question}
          meta={<p className="mt-1 text-[11px] text-sand/35">{formatDate(casting.createdAt)}</p>}
          footer={
            <div className="mx-4 mb-2 mt-6 flex gap-2">
              <Link
                href="/raml"
                className="flex-1 rounded-xl border border-sand/15 py-3 text-center text-sm text-sand/70"
              >
                Cast a new chart
              </Link>
              <button
                onClick={handleDelete}
                aria-label="Delete this casting"
                className="flex items-center justify-center rounded-xl border border-clay/25 px-4 text-clay-light"
              >
                <Trash2 size={16} />
              </button>
            </div>
          }
        />
      ) : null}
    </div>
  );
}
