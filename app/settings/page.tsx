'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2, History, BookOpen, Info } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { countCastings, clearAllCastings } from '@/lib/raml/storage';

export default function SettingsPage() {
  const [count, setCount] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setCount(countCastings());
  }, []);

  function handleClear() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    clearAllCastings();
    setCount(0);
    setConfirming(false);
  }

  return (
    <div>
      <Header title="Settings" />
      <div className="space-y-4 px-4 py-4">
        <Card>
          <p className="mb-3 text-[11px] uppercase tracking-widest text-sand/40">Your Data</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <History size={16} className="text-clay-light" />
              <div>
                <p className="text-sm text-sand-light">Saved castings</p>
                <p className="text-xs text-sand/45">{count === null ? '—' : count} on this device</p>
              </div>
            </div>
            <Link href="/raml/history" className="text-xs font-medium text-clay-light">
              View
            </Link>
          </div>

          <button
            onClick={handleClear}
            disabled={count === 0}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm disabled:opacity-30 ${
              confirming ? 'border-clay/50 bg-clay/10 text-clay-light' : 'border-sand/15 text-sand/60'
            }`}
          >
            <Trash2 size={14} />
            {confirming ? 'Tap again to confirm — this can’t be undone' : 'Clear all saved castings'}
          </button>
        </Card>

        <Card>
          <p className="mb-3 text-[11px] uppercase tracking-widest text-sand/40">About</p>
          <div className="flex items-start gap-2.5">
            <Info size={16} className="mt-0.5 shrink-0 text-clay-light" />
            <p className="text-xs leading-relaxed text-sand/60">
              Truth Geomancer is an Ilm al-Raml casting tool and manuscript library. Castings are
              saved only on this device — nothing is synced to an account or server yet.
            </p>
          </div>
          <Link
            href="/books/master-of-geomancy-vol-1"
            className="mt-4 flex items-center gap-2.5 rounded-xl border border-sand/10 px-3 py-2.5 text-sm text-sand/70"
          >
            <BookOpen size={15} className="text-clay-light" /> The Master of Geomancy, Vol. 1
          </Link>
        </Card>
      </div>
    </div>
  );
}
