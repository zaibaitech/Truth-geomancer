'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { CastingListItem } from '@/components/raml/CastingListItem';
import { listCastings, deleteCasting, type SavedCasting } from '@/lib/raml/storage';

export default function HistoryPage() {
  const [castings, setCastings] = useState<SavedCasting[] | null>(null);

  useEffect(() => {
    setCastings(listCastings());
  }, []);

  function handleDelete(id: string) {
    deleteCasting(id);
    setCastings((prev) => (prev ? prev.filter((c) => c.id !== id) : prev));
  }

  return (
    <div>
      <Header title="Past Castings" subtitle="Every chart you've cast, saved on this device" />
      <div className="px-4 py-4">
        <Link href="/raml" className="mb-4 inline-flex items-center gap-1.5 text-xs text-sand/50">
          <ArrowLeft size={14} /> Back to casting
        </Link>

        {castings === null ? null : castings.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-sand/10 py-10 text-center">
            <Sparkles size={20} className="text-clay-light" />
            <p className="max-w-[240px] text-sm text-sand/55">
              Nothing saved yet. Every chart you cast is kept here automatically.
            </p>
            <Link href="/raml" className="mt-1 rounded-xl bg-clay px-4 py-2.5 text-sm font-semibold text-ink">
              Cast a chart
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {castings.map((c) => (
              <CastingListItem key={c.id} casting={c} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
