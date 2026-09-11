'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { FigureGlyph } from './FigureGlyph';
import { ResultTabs } from './ResultTabs';
import { reduceCount, buildChart, type Chart } from '@/lib/raml/casting';
import type { DotRow, Pattern } from '@/content/stars';

type Step = 'ask' | 'casting' | 'result';

const MOTHER_NAMES = ['First', 'Second', 'Third', 'Fourth'];

export function CastingFlow() {
  const [step, setStep] = useState<Step>('ask');
  const [question, setQuestion] = useState('');
  const [mothers, setMothers] = useState<Pattern[]>([]);
  const [currentLines, setCurrentLines] = useState<DotRow[]>([]);
  const [taps, setTaps] = useState(0);
  const [chart, setChart] = useState<Chart | null>(null);

  const motherIndex = mothers.length;
  const lineIndex = currentLines.length;

  function reset() {
    setStep('ask');
    setQuestion('');
    setMothers([]);
    setCurrentLines([]);
    setTaps(0);
    setChart(null);
  }

  function startCasting() {
    setStep('casting');
  }

  function tapSand() {
    setTaps((t) => t + 1);
  }

  function lockLine() {
    if (taps === 0) return;
    const row = reduceCount(taps);
    const nextLines = [...currentLines, row];
    setTaps(0);

    if (nextLines.length === 4) {
      const pattern = nextLines as Pattern;
      const nextMothers = [...mothers, pattern];
      setMothers(nextMothers);
      setCurrentLines([]);

      if (nextMothers.length === 4) {
        const built = buildChart(nextMothers as [Pattern, Pattern, Pattern, Pattern]);
        setChart(built);
        setStep('result');
      }
    } else {
      setCurrentLines(nextLines);
    }
  }

  if (step === 'ask') {
    return (
      <div className="px-4">
        <Card>
          <p className="mb-2 text-sm font-semibold text-sand-light">What are you asking?</p>
          <p className="mb-3 text-xs text-sand/50">
            Optional — hold it in mind as you cast, or simply cast for a general reading.
          </p>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
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
      </div>
    );
  }

  if (step === 'casting') {
    return (
      <div className="px-4">
        <p className="mb-1 text-center text-xs uppercase tracking-widest text-sand/40">
          {MOTHER_NAMES[motherIndex]} Mother · Line {lineIndex + 1} of 4
        </p>
        <p className="mb-5 text-center text-xs text-sand/40">
          Tap freely, without counting. Stop whenever it feels right, then lock the line.
        </p>

        <div className="mb-5 flex justify-center gap-3">
          {mothers.map((m, i) => (
            <div key={i} className="opacity-60">
              <FigureGlyph pattern={m} size="sm" />
            </div>
          ))}
        </div>

        <button
          onClick={tapSand}
          className="mx-auto flex h-44 w-44 flex-col items-center justify-center gap-2 rounded-full border-2 border-clay/40 bg-ink-card active:scale-95"
        >
          <span className="font-logo text-4xl text-sand-light">{taps}</span>
          <span className="text-[11px] uppercase tracking-widest text-sand/40">tap the sand</span>
        </button>

        <div className="mt-5 flex flex-wrap justify-center gap-2" style={{ maxWidth: 260, margin: '20px auto 0' }}>
          {Array.from({ length: Math.min(taps, 40) }).map((_, i) => (
            <span key={i} className="dot-in h-2 w-2 rounded-full bg-sand/50" style={{ animationDelay: `${i * 15}ms` }} />
          ))}
        </div>

        <button
          onClick={lockLine}
          disabled={taps === 0}
          className="mx-auto mt-6 block w-full max-w-xs rounded-xl bg-clay py-3 text-sm font-semibold text-ink disabled:opacity-30"
        >
          Lock this line
        </button>
      </div>
    );
  }

  if (step === 'result' && chart) {
    return (
      <div>
        {question ? (
          <div className="mx-4 mb-4 rounded-xl border border-sand/10 bg-ink-card px-3 py-2">
            <p className="text-[11px] uppercase tracking-widest text-sand/40">Your question</p>
            <p className="text-sm text-sand-light">{question}</p>
          </div>
        ) : null}
        <ResultTabs chart={chart} />
        <button
          onClick={reset}
          className="mx-4 mt-6 mb-2 flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-xl border border-sand/15 py-3 text-sm text-sand/60"
        >
          <RotateCcw size={15} /> New casting
        </button>
      </div>
    );
  }

  return null;
}
