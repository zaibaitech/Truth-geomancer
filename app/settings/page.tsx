'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2, History, BookOpen, Info } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { ReaderSizeControl } from '@/components/settings/ReaderSizeControl';
import { countReadings, clearHistory } from '@/lib/raml/history';

export default function SettingsPage() {
  const [count, setCount] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setCount(countReadings());
  }, []);

  function handleClear() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    clearHistory();
    setCount(0);
    setConfirming(false);
  }

  return (
    <div>
      <Header title="Settings" />
      <div className="space-y-4 px-4 py-4">
        <ReaderSizeControl />

        <Card>
          <p className="mb-3 type-label uppercase tracking-widest text-sand/65">Your Data</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <History size={16} className="text-clay-light" />
              <div>
                <p className="type-body text-sand-light">Saved readings</p>
                <p className="type-meta text-sand/65">{count === null ? '—' : count} on this device</p>
              </div>
            </div>
            <Link href="/raml/history" className="type-meta font-medium text-clay-light">
              View
            </Link>
          </div>

          <button
            onClick={handleClear}
            disabled={count === 0}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 type-body disabled:opacity-30 ${
              confirming ? 'border-clay/50 bg-clay/10 text-clay-light' : 'border-sand/15 text-sand/70'
            }`}
          >
            <Trash2 size={14} />
            {confirming ? 'Tap again to confirm — this can’t be undone' : 'Clear all saved readings'}
          </button>
        </Card>

        <Card>
          <p className="mb-3 type-label uppercase tracking-widest text-sand/65">About</p>
          <div className="flex items-start gap-2.5">
            <Info size={16} className="mt-0.5 shrink-0 text-clay-light" />
            <p className="type-meta text-sand/70">
              Truth Geomancer is an Ilm al-Raml casting tool and manuscript library. Castings are
              saved only on this device — nothing is synced to an account or server yet.
            </p>
          </div>
          <Link
            href="/books/master-of-geomancy-vol-1"
            className="mt-4 flex items-center gap-2.5 rounded-xl border border-sand/10 px-3 py-2.5 type-body text-sand/70"
          >
            <BookOpen size={15} className="text-clay-light" /> The Master of Geomancy, Vol. 1
          </Link>
        </Card>
      </div>
    </div>
  );
}
