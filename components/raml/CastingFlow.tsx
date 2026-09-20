'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RotateCcw, Check, History, ArrowLeft, TriangleAlert } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { IntentionPicker } from './IntentionPicker';
import { CastingBoard } from './CastingBoard';
import { CastingResultView } from './CastingResultView';
import { HistoryCard } from './HistoryCard';
import { buildChart, type Chart } from '@/lib/raml/casting';
import { describeHistory, listReadings, saveReading, type HistoryEntry } from '@/lib/raml/history';
import { catalogEntry, readingBrief } from '@/lib/raml/questionCatalog';
import type { Pattern } from '@/content/stars';
import {
  accessForIntention,
  canProceedToCast,
  type CastingAccessSnapshot,
} from '@/lib/access/castingAuthorization';

type Step = 'ask' | 'confirm' | 'casting' | 'result';

export function CastingFlow({ access }: { access: CastingAccessSnapshot }) {
  const [step, setStep] = useState<Step>('ask');
  const [intentionId, setIntentionId] = useState('general');
  const [question, setQuestion] = useState('');
  const [chart, setChart] = useState<Chart | null>(null);
  const [recent, setRecent] = useState<HistoryEntry[] | null>(null);
  // null until a casting completes; false when the browser refused to store it.
  const [saved, setSaved] = useState<boolean | null>(null);

  useEffect(() => {
    if (step !== 'ask') return;
    let cancelled = false;
    describeHistory(listReadings().slice(0, 3)).then((e) => {
      if (!cancelled) setRecent(e);
    });
    return () => {
      cancelled = true;
    };
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
    setSaved(null);
  }

  // Choosing a question moves straight to the confirmation screen: it says
  // what the reading will actually do before any sand is cast, which is also
  // what stops an accidental tap from starting a casting.
  function chooseQuestion(id: string) {
    if (!canProceedToCast(accessForIntention(access, id).accessState)) return;
    setIntentionId(id);
    setStep('confirm');
  }

  function handleCastComplete(mothers: [Pattern, Pattern, Pattern, Pattern]) {
    if (!canProceedToCast(accessForIntention(access, intentionId).accessState)) {
      setStep('ask');
      return;
    }
    const built = buildChart(mothers);
    setChart(built);
    // Every completed reading is kept on this device automatically — see
    // lib/raml/history.ts. `persisted` is false when the browser refuses to
    // store anything, and the result screen then says so rather than
    // claiming a save that did not happen.
    const { persisted } = saveReading({ questionId: intentionId, intentionText: question, mothers });
    setSaved(persisted);
    setStep('result');
  }

  if (step === 'ask') {
    return (
      <div className="px-4">
        <p className="mb-2 type-body font-semibold text-sand-light">What is this reading for?</p>
        <p className="mb-3 type-meta text-sand/65">
          Pick a question and you’ll get the exact method its book gives for it — read against your
          own chart. Locked questions need access to that book.
        </p>
        <IntentionPicker value={intentionId} onChange={chooseQuestion} access={access} />

        {recent && recent.length > 0 ? (
          <div className="mt-8">
            <div className="mb-2 flex items-center justify-between">
              <p className="type-label uppercase tracking-widest text-sand/65">Recent readings</p>
              <Link href="/raml/history" className="flex items-center gap-1 type-meta text-clay-light">
                <History size={13} /> View all
              </Link>
            </div>
            <div className="space-y-2.5">
              {recent.map((entry) => (
                <HistoryCard key={entry.record.id} entry={entry} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (step === 'confirm') {
    const entry = catalogEntry(intentionId);
    const accessState = accessForIntention(access, intentionId);
    if (!canProceedToCast(accessState.accessState)) {
      return (
        <div className="px-4">
          <button
            type="button"
            onClick={() => setStep('ask')}
            className="mb-3 flex items-center gap-1.5 type-meta text-sand/70"
          >
            <ArrowLeft size={14} /> Choose a different question
          </button>
          <Card>
            <p className="type-body font-semibold text-sand-light">
              {accessState.accessState === 'pending' ? 'Payment review pending' : 'This reading is locked'}
            </p>
            <p className="mt-1.5 type-body text-sand/70">
              {accessState.accessState === 'pending'
                ? `Your payment request for ${accessState.bookTitle ?? 'this book'} is awaiting review.`
                : `${accessState.bookTitle ?? 'This book'} is required before this question can be cast.`}
            </p>
            <Link
              href={accessState.purchaseProductId ? `/purchase/${accessState.purchaseProductId}` : '/purchase'}
              className="mt-4 inline-block min-h-[44px] rounded-xl bg-clay px-4 py-2.5 type-body font-semibold text-ink"
            >
              {accessState.accessState === 'pending' ? 'View my request' : 'Request access'}
            </Link>
          </Card>
        </div>
      );
    }
    return (
      <div className="px-4">
        <button
          type="button"
          onClick={() => setStep('ask')}
          className="mb-3 flex items-center gap-1.5 type-meta text-sand/70"
        >
          <ArrowLeft size={14} /> Choose a different question
        </button>

        <Card>
          <p className="type-label uppercase tracking-widest text-sand/65">Question</p>
          <h2 className="mt-1 type-section font-semibold text-sand-light">
            {entry ? entry.title : 'General reading'}
          </h2>
          {entry?.hasShortTitle ? <p className="mt-1 type-label text-sand/65">{entry.sourceTitle}</p> : null}

          <p className="mt-4 type-label uppercase tracking-widest text-sand/65">What this reading does</p>
          <p className="mt-1 type-meta text-sand/65">
            {entry
              ? readingBrief(entry)
              : 'You cast the sixteen houses and read the chart itself — the Judge, your own house, and the figures around them — without a set question.'}
          </p>

          <p className="mt-4 type-label uppercase tracking-widest text-sand/65">Source</p>
          <p className="mt-1 type-meta text-sand/65">
            {entry
              ? entry.chapterNumber !== null
                ? `Kanzul Mikban — Chapter ${entry.chapterNumber}`
                : 'Kanzul Mikban — an additional passage with no chapter number'
              : 'The Master of Geomancy — the general chart reading'}
          </p>
        </Card>

        <Card className="mt-3">
          <label htmlFor="intention-text" className="block type-body font-semibold text-sand-light">
            Your question or intention (optional)
          </label>
          {/* Honesty, not decoration: the engine reads the chart and nothing
              else, so this text must never be presented as an input to the
              calculation. See lib/raml/productUx.test.ts, which asserts the
              reading is a pure function of the chart. */}
          <p className="mt-1 type-meta text-sand/65">
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
            className="mt-2 w-full resize-none rounded-xl border border-sand/15 bg-ink px-3 py-2 type-body text-sand-light placeholder:text-sand/65 focus:border-clay/50"
          />
        </Card>

        <button
          onClick={() => setStep('casting')}
          className="mt-4 w-full rounded-xl bg-clay py-3 type-body font-semibold text-ink"
        >
          Start Reading
        </button>
      </div>
    );
  }

  if (step === 'casting') {
    if (!canProceedToCast(accessForIntention(access, intentionId).accessState)) {
      return (
        <div className="px-4">
          <button
            type="button"
            onClick={() => setStep('ask')}
            className="mb-3 flex items-center gap-1.5 type-meta text-sand/70"
          >
            <ArrowLeft size={14} /> Choose a different question
          </button>
          <Card>
            <p className="type-body font-semibold text-sand-light">This reading is locked</p>
            <p className="mt-1.5 type-body text-sand/70">This question cannot be cast without access to its book.</p>
          </Card>
        </div>
      );
    }
    const entry = catalogEntry(intentionId);
    return (
      <div className="px-4">
        {entry ? <p className="mb-3 text-center type-label text-clay-light">Casting for: {entry.title}</p> : null}
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
          saved === false ? (
            <p className="mt-1 flex items-start gap-1 type-label text-clay-light">
              <TriangleAlert size={12} className="mt-0.5 shrink-0" /> This browser would not let the app save
              the reading, so it won’t appear in Past Readings.
            </p>
          ) : (
            <p className="mt-1 flex items-center gap-1 type-label text-sand/65">
              <Check size={12} className="text-clay-light" /> Saved on this device — nothing is sent anywhere
            </p>
          )
        }
        footer={
          <div className="mx-4 mb-2 mt-6 flex gap-2">
            <button
              onClick={reset}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-sand/15 py-3 type-body text-sand/70"
            >
              <RotateCcw size={15} /> New reading
            </button>
            <Link
              href="/raml/history"
              className="flex items-center justify-center gap-2 rounded-xl border border-sand/15 px-4 py-3 type-body text-sand/70"
            >
              <History size={15} /> History
            </Link>
          </div>
        }
      />
    );
  }

  return null;
}
