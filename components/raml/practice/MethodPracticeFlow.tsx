'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CastingBoard } from '../CastingBoard';
import { HouseSelector } from './HouseSelector';
import { FigureGlyph } from '../FigureGlyph';
import { buildChart, type Chart } from '@/lib/raml/casting';
import { runReading } from '@/lib/raml/engine';
import { OUTCOME_TONE } from '@/lib/raml/engine/reading';
import { findPracticableMethod, mostRecentChart, chapterSourceLabel } from '@/lib/raml/methodPractice';
import { KM_CHAPTERS } from '@/content/manuscripts/kanzul-mikban';
import type { Pattern } from '@/content/stars';

type Stage = 'intro' | 'casting' | 'walkthrough';
type WalkthroughStep = 'houses' | 'working' | 'result';

/**
 * The practice screen (Prompt 20). Deliberately a different experience from
 * the Reading flow (section 11): every header on this screen says
 * "Practicing", because the user is intentionally studying ONE named
 * traditional method, not receiving the app's synthesized verdict. Nothing
 * here recalculates anything: once a chart exists, this component's only
 * job is to run the same `runReading()` the Reading flow uses and walk the
 * ALREADY-COMPUTED houses/steps/result for that one method into a sequence
 * of screens.
 */
export function MethodPracticeFlow({ chapterId, methodId }: { chapterId: string; methodId: string }) {
  const practicable = findPracticableMethod(chapterId, methodId);
  const chapter = KM_CHAPTERS.find((c) => c.id === chapterId);
  const existing = useMemo(() => mostRecentChart(), []);

  const [stage, setStage] = useState<Stage>('intro');
  const [chart, setChart] = useState<Chart | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedHouses, setSelectedHouses] = useState<Set<number>>(new Set());
  const [showSource, setShowSource] = useState(false);

  const row = useMemo(() => {
    if (!chart || !practicable) return null;
    const reading = runReading(chart, practicable.questionId);
    return reading?.methodResults.find((m) => m.id === practicable.method.id) ?? null;
  }, [chart, practicable]);

  if (!practicable || !chapter) {
    // Section 14: never a fake practice experience — an unverified,
    // unresolved or unknown method gets this neutral label instead of a
    // walkthrough built on nothing.
    return (
      <div className="px-4 py-6">
        <Card>
          <p className="type-body font-semibold text-sand-light">Source method — practice unavailable</p>
          <p className="mt-1.5 type-body text-sand/70">
            This method isn’t yet verified closely enough against the source to practice interactively. The
            original text is still available in the chapter.
          </p>
          <Link href={`/books/kanzul-mikban/read#${chapterId}`} className="mt-3 inline-block type-body text-clay-light underline underline-offset-2">
            Back to the chapter
          </Link>
        </Card>
      </div>
    );
  }

  const { method, questionId } = practicable;
  const sourceLabel = chapterSourceLabel(chapterId);

  function startCasting() {
    setStage('casting');
  }

  function useExistingChart() {
    if (!existing) return;
    setChart(existing.chart);
    setSelectedHouses(new Set());
    setStepIndex(0);
    setStage('walkthrough');
  }

  function onCastComplete(mothers: [Pattern, Pattern, Pattern, Pattern]) {
    setChart(buildChart(mothers));
    setSelectedHouses(new Set());
    setStepIndex(0);
    setStage('walkthrough');
  }

  function toggleHouse(n: number) {
    setSelectedHouses((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  const header = (
    <div className="px-4 pb-4 pt-5">
      <p role="status" className="type-meta uppercase tracking-widest text-sand/65">
        Practicing {method.label}
      </p>
      <h1 className="mt-0.5 type-section font-semibold text-sand-light">{sourceLabel}</h1>
      <p className="mt-1 type-body text-sand/70">{chapter.title}</p>
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
              <li>1. Cast a chart</li>
              <li>2. Follow the houses specified by the source</li>
              <li>3. Perform the source operation</li>
              <li>4. See the traditional result</li>
            </ol>
          </Card>

          <Card>
            <p className="type-meta uppercase tracking-widest text-sand/65">Source</p>
            <p className="mt-1.5 type-quote italic leading-relaxed text-sand/80">“{method.source.quote}”</p>
            <p className="mt-1.5 type-meta text-sand/65">{sourceLabel} · {method.label}</p>
          </Card>

          <div className="space-y-2.5">
            {existing ? (
              <button
                type="button"
                onClick={useExistingChart}
                className="min-h-[52px] w-full rounded-xl bg-clay py-3 type-body font-semibold text-ink"
              >
                Practice with this chart
              </button>
            ) : null}
            <button
              type="button"
              onClick={startCasting}
              className={`min-h-[52px] w-full rounded-xl py-3 type-body font-semibold ${
                existing ? 'border border-sand/15 text-sand-light' : 'bg-clay text-ink'
              }`}
            >
              Cast a chart
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'casting') {
    return (
      <div>
        {header}
        <div className="px-4 pb-6">
          <p className="mb-3 text-center type-label text-clay-light">Casting for: {method.label}</p>
          <CastingBoard onComplete={onCastComplete} />
        </div>
      </div>
    );
  }

  // stage === 'walkthrough'
  if (!chart) return null; // unreachable: walkthrough only follows chart being set

  if (!row || !row.counted || row.resultPattern === null) {
    // A verified method's calculation should never fail — this is a defensive
    // backstop, never a state the app tries to talk its way around.
    return (
      <div>
        {header}
        <div className="px-4 pb-6">
          <Card>
            <p className="type-body font-semibold text-sand-light">This method couldn’t be computed for this chart.</p>
            <p className="mt-1.5 type-body text-sand/70">Nothing was assumed or filled in — no result is shown.</p>
          </Card>
        </div>
      </div>
    );
  }

  const workingCount = row.calculationSteps.length;
  const steps: WalkthroughStep[] = ['houses', ...Array<WalkthroughStep>(workingCount).fill('working'), 'result'];
  const current = steps[stepIndex] ?? 'result';
  const requiredHouses = Array.from(new Set(row.housesUsed));
  const housesConfirmed = requiredHouses.every((h) => selectedHouses.has(h));

  function next() {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }
  function back() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  return (
    <div>
      {header}
      <div className="space-y-4 px-4 pb-6">
        <p role="status" className="type-meta uppercase tracking-widest text-sand/65">
          Step {stepIndex + 1} of {steps.length}
        </p>

        {current === 'houses' ? (
          <>
            <p className="type-body text-sand/80">
              Tap {requiredHouses.map((h) => `H${h}`).join(' and ')} — the houses this method uses.
            </p>
            <HouseSelector chart={chart} required={requiredHouses} selected={selectedHouses} onToggle={toggleHouse} />
          </>
        ) : null}

        {current === 'working' ? (
          <Card>
            <p className="type-meta uppercase tracking-widest text-sand/65">Working</p>
            <p className="mt-2 type-evidence text-sand-light">{row.calculationSteps[stepIndex - 1]}</p>
          </Card>
        ) : null}

        {current === 'result' ? (
          <>
            <Card>
              <p className="type-meta uppercase tracking-widest text-sand/65">Method result</p>
              <div className="mt-2 flex items-center gap-3">
                {row.resultPattern ? <FigureGlyph pattern={row.resultPattern} size="md" /> : null}
                <div>
                  <p className="type-body font-medium text-sand-light">{row.resultFigureName}</p>
                  <p className="type-meta text-sand/65">
                    {[row.resultFortune, row.resultDirection, row.resultElement].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
              <div className="mt-4 border-t border-sand/10 pt-3">
                {row.outcomeLabel ? (
                  <Badge tone={row.outcome ? OUTCOME_TONE[row.outcome] : 'neutral'}>{row.outcomeLabel}</Badge>
                ) : null}
                <p className="mt-1.5 type-verdict text-sand-light">According to the source, this indicates: {row.interpretation}</p>
              </div>
            </Card>

            <Card>
              <p className="type-meta uppercase tracking-widest text-sand/65">Source method</p>
              <p className="mt-1 type-body text-sand-light">{sourceLabel} · {method.label}</p>
              <button
                type="button"
                onClick={() => setShowSource((v) => !v)}
                aria-expanded={showSource}
                className="mt-2 type-body text-clay-light underline underline-offset-2"
              >
                {showSource ? 'Hide source instructions' : 'View source instructions'}
              </button>
              {showSource ? (
                <blockquote className="mt-2 border-l-2 border-clay/30 pl-3">
                  <p className="type-quote italic text-sand/75">“{row.sourceQuote}”</p>
                </blockquote>
              ) : null}
            </Card>

            <Link
              href={`/books/kanzul-mikban/read#${chapterId}`}
              className="block min-h-[48px] w-full rounded-xl border border-sand/15 py-3 text-center type-body text-sand-light"
            >
              Back to the chapter
            </Link>
          </>
        ) : null}

        <div className="flex gap-2">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={back}
              className="min-h-[48px] flex-1 rounded-xl border border-sand/15 py-3 type-body text-sand/70"
            >
              Back
            </button>
          ) : null}
          {current !== 'result' ? (
            <button
              type="button"
              onClick={next}
              disabled={current === 'houses' && !housesConfirmed}
              className="min-h-[48px] flex-1 rounded-xl bg-clay py-3 type-body font-semibold text-ink disabled:opacity-30"
            >
              Continue
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
