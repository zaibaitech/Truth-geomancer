'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { FigureGlyph } from '@/components/raml/FigureGlyph';
import { CancellingLineFlow } from '../CancellingMethodDiagram';
import {
  CANCELLING_METHOD_EXAMPLES,
  CANCELLING_METHOD_CLOSING,
  cancellingMotherPattern,
} from '@/content/manuscripts/chapterOneDiagrams';
import { MASTER_CHAPTER_META, CANCELLING_METHOD_QUOTE } from '@/content/manuscripts/masterOfGeomancyMeta';

type Stage = 'intro' | 'lines' | 'result';

// Prompt 27: only the chapter's number (public metadata) and this one
// quote (see masterOfGeomancyMeta.ts's own comment) are needed here —
// never the full chapter body.
const CHAPTER = MASTER_CHAPTER_META.find((c) => c.id === 'drawing-a-chart')!;
// The chapter's own third paragraph, "**The Cancelling Method.** You will
// make 4 straight lines with dots and start cancelling 2, 2, 2, from your
// right to the left as shown below." — ** markers stripped for a plain
// quote, same convention as CountingMethodPractice.tsx.
const SOURCE_QUOTE = CANCELLING_METHOD_QUOTE.replace(/\*\*/g, '');

/**
 * "Try the Cancelling Method" (Prompt 22). Walks one of the source's own
 * four worked examples (chapterOneDiagrams.ts, transcribed verbatim from
 * the manuscript's typeset tally marks) one line at a time, reusing the
 * exact `CancellingLineFlow` markup the static chapter diagram already
 * renders — original dots, pairs cancelled right to left, what remains,
 * the line's mark. Nothing here computes a new value: `cancelledLineMark`/
 * `cancellingMotherPattern` (imported, not reimplemented) read the same
 * transcribed tokens the static diagram uses. Kept as its own distinct
 * flow from CountingMethodPractice — the two methods are never merged into
 * one undifferentiated walkthrough (Prompt 22, section 3).
 */
export function CancellingMethodPractice() {
  const [stage, setStage] = useState<Stage>('intro');
  const [exampleIndex, setExampleIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);

  const example = CANCELLING_METHOD_EXAMPLES[exampleIndex];
  const motherPattern = cancellingMotherPattern(example);

  function start() {
    setStage('lines');
    setLineIndex(0);
  }
  function next() {
    if (lineIndex < 3) setLineIndex((i) => i + 1);
    else setStage('result');
  }
  function back() {
    if (stage === 'result') {
      setStage('lines');
      setLineIndex(3);
      return;
    }
    if (lineIndex > 0) setLineIndex((i) => i - 1);
    else setStage('intro');
  }
  function tryOtherExample() {
    setExampleIndex((i) => (i + 1) % CANCELLING_METHOD_EXAMPLES.length);
    setLineIndex(0);
    setStage('lines');
  }

  const header = (
    <div className="px-4 pb-4 pt-5">
      <p role="status" className="type-meta uppercase tracking-widest text-sand/65">
        Practicing
      </p>
      <h1 className="mt-0.5 type-section font-semibold text-sand-light">The Cancelling Method</h1>
      <p className="mt-1 type-body text-sand/70">
        The Master of Geomancy, Volume 1 · Chapter {CHAPTER.number}
      </p>
    </div>
  );

  if (stage === 'intro') {
    return (
      <div>
        {header}
        <div className="space-y-4 px-4 pb-6">
          <Card>
            <p className="type-meta uppercase tracking-widest text-sand/65">How this method works</p>
            <ol className="mt-2 space-y-1.5 type-body text-sand/80">
              <li>1. Make 4 lines, each a row of dots</li>
              <li>2. Cancel the dots in pairs, right to left</li>
              <li>3. See what is left — one dot, or two</li>
              <li>4. See the four resulting Mother Stars</li>
            </ol>
          </Card>

          <Card>
            <p className="type-meta uppercase tracking-widest text-sand/65">Source</p>
            <p className="mt-1.5 type-quote italic leading-relaxed text-sand/80">“{SOURCE_QUOTE}”</p>
            <p className="mt-1.5 type-meta text-sand/65">
              The Master of Geomancy · Chapter {CHAPTER.number}
            </p>
          </Card>

          <p className="type-body text-sand/70">
            The lines below are one of the source’s own four worked examples — not numbers to aim for. Tap
            through each of its four lines to see the cancellation.
          </p>

          <button
            type="button"
            onClick={start}
            className="min-h-[52px] w-full rounded-xl bg-clay py-3 type-body font-semibold text-ink"
          >
            Start
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'lines') {
    const tokens = example.lines[lineIndex];
    return (
      <div>
        {header}
        <div className="space-y-4 px-4 pb-6">
          <p role="status" className="type-meta uppercase tracking-widest text-sand/65">
            {example.label} · Line {lineIndex + 1} of 4
          </p>
          <CancellingLineFlow tokens={tokens} lineIndex={lineIndex} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={back}
              className="min-h-[48px] flex-1 rounded-xl border border-sand/15 py-3 type-body text-sand/70"
            >
              Back
            </button>
            <button
              type="button"
              onClick={next}
              className="min-h-[48px] flex-1 rounded-xl bg-clay py-3 type-body font-semibold text-ink"
            >
              {lineIndex < 3 ? 'Continue' : 'See the Mother Star'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // stage === 'result'
  return (
    <div>
      {header}
      <div className="space-y-4 px-4 pb-6">
        <p className="type-meta uppercase tracking-widest text-sand/65">Mother star</p>
        <Card>
          <div className="flex items-center gap-3">
            <FigureGlyph pattern={motherPattern} size="md" />
            <span className="type-method text-sand-light">Mother Star {exampleIndex + 1}</span>
          </div>
          <p className="mt-3 type-evidence italic text-sand/70">{CANCELLING_METHOD_CLOSING}</p>
        </Card>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={back}
            className="min-h-[48px] flex-1 rounded-xl border border-sand/15 py-3 type-body text-sand/70"
          >
            Back
          </button>
          <button
            type="button"
            onClick={tryOtherExample}
            className="min-h-[48px] flex-1 rounded-xl border border-sand/15 py-3 type-body text-sand-light"
          >
            Try the next Mother Star
          </button>
        </div>
        <Link
          href="/books/master-of-geomancy-vol-1/read#drawing-a-chart"
          className="block min-h-[48px] w-full rounded-xl border border-sand/15 py-3 text-center type-body text-sand-light"
        >
          Back to the chapter
        </Link>
      </div>
    </div>
  );
}
