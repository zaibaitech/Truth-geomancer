'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RotateCcw, Check, History } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { IntentionPicker } from './IntentionPicker';
import { CastingBoard } from './CastingBoard';
import { CastingResultView } from './CastingResultView';
import { CastingListItem } from './CastingListItem';
import { buildChart, type Chart } from '@/lib/raml/casting';
import { saveCasting, listCastings, type SavedCasting } from '@/lib/raml/storage';
import { getIntentionById } from '@/content/intentions';
import type { Pattern } from '@/content/stars';

type Step = 'ask' | 'casting' | 'result';

export function CastingFlow() {
  const [step, setStep] = useState<Step>('ask');
  const [intentionId, setIntentionId] = useState('general');
  const [question, setQuestion] = useState('');
  const [chart, setChart] = useState<Chart | null>(null);
  const [recent, setRecent] = useState<SavedCasting[] | null>(null);

  useEffect(() => {
    if (step === 'ask') setRecent(listCastings().slice(0, 3));
  }, [step]);

  // Each step replaces a tall screen with another tall screen, but the app
  // scrolls an inner container rather than the window — so without this the
  // viewport kept whatever offset the previous step left behind. Casting in
  // particular happens at the BOTTOM of the board, which meant a finished
  // reading opened roughly 800px down: past the question, past the verdict,
  // somewhere in the supporting indicators. Reset to the top on every step
  // change so the answer is the first thing on screen.
  useEffect(() => {
    document.querySelector('[data-app-scroll]')?.scrollTo({ top: 0 });
  }, [step]);

  function reset() {
    setStep('ask');
    setIntentionId('general');
    setQuestion('');
    setChart(null);
  }

  function startCasting() {
    setStep('casting');
  }

  function handleCastComplete(mothers: [Pattern, Pattern, Pattern, Pattern]) {
    const built = buildChart(mothers);
    setChart(built);
    saveCasting({ question, mothers, intentionId });
    setStep('result');
  }

  if (step === 'ask') {
    return (
      <div className="px-4">
        <p className="mb-2 text-sm font-semibold text-sand-light">What is this reading for?</p>
        <p className="mb-3 text-xs text-sand/50">
          Pick the closest category and, once cast, you’ll get the exact method Kanzul Mikban
          gives for it — read against your own chart.
        </p>
        <IntentionPicker value={intentionId} onChange={setIntentionId} />

        <Card className="mt-4">
          <p className="mb-2 text-sm font-semibold text-sand-light">What are you asking?</p>
          <p className="mb-3 text-xs text-sand/50">
            Optional — hold it in mind as you cast, or simply cast for a general reading.
          </p>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            aria-label="What are you asking? (optional)"
            placeholder="e.g. Will this move forward this month?"
            className="w-full resize-none rounded-xl border border-sand/15 bg-ink px-3 py-2 text-sm text-sand-light placeholder:text-sand/30 focus:border-clay/50 focus:outline-none"
          />
        </Card>
        <button
          onClick={startCasting}
          className="mt-4 w-full rounded-xl bg-clay py-3 text-sm font-semibold text-ink"
        >
          Begin casting
        </button>

        {recent && recent.length > 0 ? (
          <div className="mt-8">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-widest text-sand/45">Recent castings</p>
              <Link href="/raml/history" className="flex items-center gap-1 text-xs text-clay-light">
                <History size={13} /> View all
              </Link>
            </div>
            <div className="space-y-2.5">
              {recent.map((c) => (
                <CastingListItem key={c.id} casting={c} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (step === 'casting') {
    const intention = getIntentionById(intentionId);
    return (
      <div className="px-4">
        {intention && intention.id !== 'general' ? (
          <p className="mb-3 text-center text-[11px] text-clay-light">Casting for: {intention.label}</p>
        ) : null}
        <CastingBoard onComplete={handleCastComplete} />
      </div>
    );
  }

  if (step === 'result' && chart) {
    return (
      <CastingResultView
        chart={chart}
        question={question}
        intentionId={intentionId}
        meta={
          <p className="mt-1 flex items-center gap-1 text-[11px] text-sand/35">
            <Check size={12} className="text-clay-light" /> Saved to Past Castings on this device
          </p>
        }
        footer={
          <button
            onClick={reset}
            className="mx-4 mt-6 mb-2 flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-xl border border-sand/15 py-3 text-sm text-sand/60"
          >
            <RotateCcw size={15} /> New casting
          </button>
        }
      />
    );
  }

  return null;
}
