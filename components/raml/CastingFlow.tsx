'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RotateCcw, Check, History, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { IntentionPicker } from './IntentionPicker';
import { CastingBoard } from './CastingBoard';
import { CastingResultView } from './CastingResultView';
import { CastingListItem } from './CastingListItem';
import { buildChart, type Chart } from '@/lib/raml/casting';
import { saveCasting, listCastings, type SavedCasting } from '@/lib/raml/storage';
import { catalogEntry, readingBrief } from '@/lib/raml/questionCatalog';
import type { Pattern } from '@/content/stars';

type Step = 'ask' | 'confirm' | 'casting' | 'result';

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

  // Choosing a question moves straight to the confirmation screen: it says
  // what the reading will actually do before any sand is cast, which is also
  // what stops an accidental tap from starting a casting.
  function chooseQuestion(id: string) {
    setIntentionId(id);
    setStep('confirm');
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
          Pick a question and you’ll get the exact method Kanzul Mikban gives for it — read against your
          own chart.
        </p>
        <IntentionPicker value={intentionId} onChange={chooseQuestion} />

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

  if (step === 'confirm') {
    const entry = catalogEntry(intentionId);
    return (
      <div className="px-4">
        <button
          type="button"
          onClick={() => setStep('ask')}
          className="mb-3 flex items-center gap-1.5 text-xs text-sand/60"
        >
          <ArrowLeft size={14} /> Choose a different question
        </button>

        <Card>
          <p className="text-[11px] uppercase tracking-widest text-sand/40">Question</p>
          <h2 className="mt-1 text-base font-semibold text-sand-light">
            {entry ? entry.title : 'General reading'}
          </h2>
          {entry?.hasShortTitle ? <p className="mt-1 text-[11px] text-sand/40">{entry.sourceTitle}</p> : null}

          <p className="mt-4 text-[11px] uppercase tracking-widest text-sand/40">What this reading does</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-sand/65">
            {entry
              ? readingBrief(entry)
              : 'You cast the sixteen houses and read the chart itself — the Judge, your own house, and the figures around them — without a set question.'}
          </p>

          <p className="mt-4 text-[11px] uppercase tracking-widest text-sand/40">Source</p>
          <p className="mt-1 text-[12.5px] text-sand/65">
            {entry
              ? entry.chapterNumber !== null
                ? `Kanzul Mikban — Chapter ${entry.chapterNumber}`
                : 'Kanzul Mikban — an additional passage with no chapter number'
              : 'The Master of Geomancy — the general chart reading'}
          </p>
        </Card>

        <Card className="mt-3">
          <label htmlFor="intention-text" className="block text-sm font-semibold text-sand-light">
            Your question or intention (optional)
          </label>
          {/* Honesty, not decoration: the engine reads the chart and nothing
              else, so this text must never be presented as an input to the
              calculation. See lib/raml/productUx.test.ts, which asserts the
              reading is a pure function of the chart. */}
          <p className="mt-1 text-xs leading-relaxed text-sand/50">
            Hold it in mind as you cast. This does not change the geomancy calculation — it is saved with
            the casting on this device so you can remember what you asked.
          </p>
          <textarea
            id="intention-text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            aria-label="Your question or intention (optional)"
            placeholder="e.g. Will this move forward this month?"
            className="mt-2 w-full resize-none rounded-xl border border-sand/15 bg-ink px-3 py-2 text-sm text-sand-light placeholder:text-sand/30 focus:border-clay/50 focus:outline-none"
          />
        </Card>

        <button
          onClick={() => setStep('casting')}
          className="mt-4 w-full rounded-xl bg-clay py-3 text-sm font-semibold text-ink"
        >
          Start Reading
        </button>
      </div>
    );
  }

  if (step === 'casting') {
    const entry = catalogEntry(intentionId);
    return (
      <div className="px-4">
        {entry ? <p className="mb-3 text-center text-[11px] text-clay-light">Casting for: {entry.title}</p> : null}
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
