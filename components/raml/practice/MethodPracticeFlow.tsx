'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CastingBoard } from '../CastingBoard';
import { HouseSelector } from './HouseSelector';
import { CurrentChartPreview } from './CurrentChartPreview';
import { PracticeChartPanel } from './PracticeChartPanel';
import { FigureGlyph } from '../FigureGlyph';
import { RecastWorkingDiagram } from '../reading/RecastWorkingDiagram';
import { DreamWorkingPanel } from '../DreamWorkingPanel';
import type { Chart } from '@/lib/raml/casting';
import type { ReadingRecord } from '@/lib/raml/history';
import { OUTCOME_TONE, type ReadingMethodRow } from '@/lib/raml/engine/reading';
import {
  findPracticableMethod,
  mostRecentChart,
  savePracticeChart,
  isWholeChartRow,
  needsExplicitChartChoice,
  chapterSourceLabel,
  practiceResultState,
} from '@/lib/raml/methodPractice';
// Prompt 27: only `.title` is read here (line ~122's chapter subheading) —
// the public metadata export carries it, so the full chapter text never
// needs to enter this client component's import graph.
import { KM_CHAPTER_META as KM_CHAPTERS } from '@/content/manuscripts/kanzulMikbanMeta';
import type { Pattern } from '@/content/stars';

// PROMPT 27C (server-side reading execution migration): this component used
// to call runReading()/read practicable.method.source.quote directly,
// which pulled the ENTIRE engine — every question's protected source text,
// not just this one method's — into the client bundle just because this
// screen exists. Both the quote and the computed walkthrough row now come
// from the gated server practice route instead — see
// the server practice service (Prompt 27C). The page-level entitlement gate
// (app/raml/practice/[chapterId]/[methodId]/page.tsx) still decides
// whether this component renders at all; this route re-checks the SAME
// entitlement independently, so the quote/result can never reach an
// unauthorized request even if that page-level gate were ever bypassed.
interface PracticeApiResult {
  questionId: string;
  label: string;
  sourceQuote: string;
  sourceLabel: string;
  row: ReadingMethodRow | null;
}

type Stage = 'intro' | 'casting' | 'walkthrough';
// 'whole' (Phase 1) replaces 'houses' for a method that reads the whole
// chart (an empty housesUsed): there is nothing to select, so no selection
// step — and never a "0 of 0 houses selected" counter — is shown.
type WalkthroughStep = 'houses' | 'whole' | 'working' | 'result';

// Prompt 21 — descriptive stage labels, not a raw step count. Keyed by STAGE
// KIND rather than stepIndex: a method with more than one working line (see
// money-method-2) still shows the same "See the calculation" label for each
// of its working steps, because the underlying stage hasn't changed, only
// where inside it the reader is. This is presentation-only wording; the
// actual number and order of steps still comes entirely from `steps` below.
const STAGE_LABEL: Record<WalkthroughStep, string> = {
  houses: 'Step 1 · Select the houses',
  whole: 'Step 1 · The whole chart',
  working: 'Step 2 · See the calculation',
  result: 'Step 3 · See the result',
};

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
  // Phase 1: the user's CURRENT chart — the most recent saved reading,
  // whether it was cast in the Reading flow or in an earlier practice
  // session. Read after mount (localStorage only exists in the browser), so
  // the server render and the first client render agree; `existingChecked`
  // keeps the intro from flashing "no chart" before the check has run.
  const [existing, setExisting] = useState<{ chart: Chart; record: ReadingRecord } | null>(null);
  const [existingChecked, setExistingChecked] = useState(false);
  useEffect(() => {
    setExisting(mostRecentChart());
    setExistingChecked(true);
  }, []);
  // false only when a chart cast here could not be stored by the browser.
  const [practiceSaved, setPracticeSaved] = useState<boolean | null>(null);

  const [stage, setStage] = useState<Stage>('intro');
  const [chart, setChart] = useState<Chart | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedHouses, setSelectedHouses] = useState<Set<number>>(new Set());
  const [showSource, setShowSource] = useState(false);
  // Set only right after finishing THIS session's own casting stage — never
  // set when an existing chart was reused, since nothing was just cast in
  // that path. Drives the one-line "Chart ready" transition (section 9).
  const [justCast, setJustCast] = useState(false);

  const [practiceData, setPracticeData] = useState<PracticeApiResult | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!practicable) return;
    let cancelled = false;
    setPracticeData(null);
    setLoadFailed(false);
    fetch('/api/raml/practice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId, methodId, chart: chart ?? undefined }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('request failed'))))
      .then((data: PracticeApiResult) => {
        if (!cancelled) setPracticeData(data);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId, methodId, chart, !!practicable]);

  const row = practiceData?.row ?? null;

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
  // Same rule CastingFlow uses for the board's wording: a method whose own
  // public casting metadata displays only the Mothers and their pairing
  // (Chapter 151) gets the "Mother 1-4" board copy. Wording only — the board
  // and its four-Mother output are identical either way.
  const mothersOnly = method.casting?.display === 'mothers_and_pairing';
  const explicitChoice = existing !== null && needsExplicitChartChoice(existing.record, questionId);

  function startCasting() {
    setStage('casting');
  }

  function useExistingChart() {
    if (!existing) return;
    setChart(existing.chart);
    setSelectedHouses(new Set());
    setStepIndex(0);
    setJustCast(false);
    setStage('walkthrough');
  }

  function onCastComplete(mothers: [Pattern, Pattern, Pattern, Pattern]) {
    // Saved through the existing history store (savePracticeChart ->
    // saveReading) so it becomes the current chart for every other method;
    // the chart itself comes from the same buildChart(mothers).
    const saved = savePracticeChart(questionId, mothers, { chapterId, methodId: method.id });
    setChart(saved.chart);
    setExisting({ chart: saved.chart, record: saved.record });
    setPracticeSaved(saved.persisted);
    setSelectedHouses(new Set());
    setStepIndex(0);
    setJustCast(true);
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
          {!existingChecked ? (
            <Card>
              <p role="status" className="type-body text-sand/65">Looking for your current chart…</p>
            </Card>
          ) : existing ? (
            <Card>
              <p className="type-meta uppercase tracking-widest text-sand/65">Your current chart</p>
              <div className="mt-2">
                <CurrentChartPreview chart={existing.chart} record={existing.record} />
              </div>
              {explicitChoice ? (
                // Corrective QA (C): a chart cast for a Mothers-only (Dream)
                // reading is never used for a full-chart method by default —
                // it is named as such, casting a new chart is the primary
                // action, and using it anyway is an explicit choice.
                <div className="mt-4 space-y-2.5">
                  <p className="type-meta text-sand-light">
                    This chart was cast for a Dream reading, which reads only its four Mothers. This method reads a full
                    16-house chart — cast a new chart for it, or choose to use the full chart built from these Mothers.
                  </p>
                  <button
                    type="button"
                    onClick={startCasting}
                    className="min-h-[52px] w-full rounded-xl bg-clay py-3 type-body font-semibold text-ink"
                  >
                    Cast a new chart
                  </button>
                  <button
                    type="button"
                    onClick={useExistingChart}
                    className="min-h-[48px] w-full rounded-xl border border-sand/15 py-3 type-body text-sand-light"
                  >
                    Use this Dream chart anyway
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-2.5">
                  <button
                    type="button"
                    onClick={useExistingChart}
                    className="min-h-[52px] w-full rounded-xl bg-clay py-3 type-body font-semibold text-ink"
                  >
                    Practice with this chart
                  </button>
                  <p className="text-center type-meta text-sand/65">Use the chart you already cast.</p>
                  <button
                    type="button"
                    onClick={startCasting}
                    className="min-h-[48px] w-full rounded-xl border border-sand/15 py-3 type-body text-sand-light"
                  >
                    Cast a new chart
                  </button>
                </div>
              )}
            </Card>
          ) : (
            <Card>
              <p className="type-meta uppercase tracking-widest text-sand/65">Create a chart</p>
              <p className="mt-1.5 type-body text-sand-light">This method needs a chart to continue.</p>
              <p className="mt-1 type-meta text-sand/65">
                Cast a chart to continue — you’ll come straight back to {method.label}, and the chart is kept as your
                current chart for other methods.
              </p>
              <button
                type="button"
                onClick={startCasting}
                className="mt-4 min-h-[52px] w-full rounded-xl bg-clay py-3 type-body font-semibold text-ink"
              >
                Cast a chart
              </button>
            </Card>
          )}

          <Card>
            <p className="type-meta uppercase tracking-widest text-sand/65">How this method works</p>
            {/* Phase 1: casting and practising are two different things —
                this never implies a method needs a fresh casting. */}
            <p className="mt-2 type-body text-sand/80">
              Casting creates a chart. Practising applies this method to a chart you already have.
            </p>
            <ol className="mt-2 space-y-1.5 type-body text-sand/80">
              <li>1. Start from your chart</li>
              <li>2. Follow the houses specified by the source</li>
              <li>3. Perform the source operation</li>
              <li>4. See the traditional result</li>
            </ol>
          </Card>

          <Card>
            <p className="type-meta uppercase tracking-widest text-sand/65">Source</p>
            {practiceData ? (
              <p className="mt-1.5 type-quote italic leading-relaxed text-sand/80">“{practiceData.sourceQuote}”</p>
            ) : loadFailed ? (
              <p className="mt-1.5 type-body text-sand/65">The source wording couldn’t be loaded — check your connection and try again.</p>
            ) : (
              <p className="mt-1.5 type-body text-sand/65">Loading the source wording…</p>
            )}
            <p className="mt-1.5 type-meta text-sand/65">{sourceLabel} · {method.label}</p>
          </Card>
        </div>
      </div>
    );
  }

  if (stage === 'casting') {
    return (
      <div>
        {header}
        <div className="px-4 pb-6">
          <button
            type="button"
            onClick={() => setStage('intro')}
            className="mb-2 flex min-h-[44px] items-center gap-1.5 type-meta text-sand/70"
          >
            <ArrowLeft size={14} aria-hidden /> Back to {method.label}
          </button>
          <p className="mb-1 text-center type-label text-clay-light">Casting for: {method.label}</p>
          <p className="mx-auto mb-4 max-w-[20rem] text-center type-meta text-sand/65">
            When the chart is complete you’ll return straight to this method. It is saved as your current chart, so
            other methods can use it too.
          </p>
          <CastingBoard onComplete={onCastComplete} mothersOnly={mothersOnly} />
        </div>
      </div>
    );
  }

  // stage === 'walkthrough'
  if (!chart) return null; // unreachable: walkthrough only follows chart being set

  if (!practiceData && !loadFailed) {
    return (
      <div>
        {header}
        <div className="px-4 pb-6">
          <Card>
            <p className="type-body text-sand/65">Calculating your practice result…</p>
          </Card>
        </div>
      </div>
    );
  }

  const resultState = practiceResultState(row);

  // Phase 1: after a cast made here, say (once) that the chart was kept as
  // the current chart — on every outcome screen, including the "doesn't
  // trigger" one, so the user knows other methods can reuse it.
  const savedChartNote = justCast ? (
    <p className="type-meta text-sand/65">
      {practiceSaved === false
        ? 'This browser would not let the app save the chart, so other methods can’t reuse it.'
        : 'Saved as your current chart — other methods can use it without casting again.'}
    </p>
  ) : null;

  if (resultState === 'failure' || !row) {
    // A verified method's calculation should never fail — this is a defensive
    // backstop, never a state the app tries to talk its way around. A
    // genuine network failure gets the same honest, non-fabricating
    // treatment: no result is shown rather than a guessed one. This is a
    // TECHNICAL failure state only — never reached for a method that
    // computed a real (even if uncounted) verdict; see the `!row.counted`
    // branch just below for that case.
    return (
      <div>
        {header}
        <div className="px-4 pb-6">
          <Card>
            <p className="type-body font-semibold text-sand-light">
              {loadFailed ? "This method's result couldn't be loaded." : "This method couldn’t be computed for this chart."}
            </p>
            <p className="mt-1.5 type-body text-sand/70">
              {loadFailed ? 'Check your connection and try again.' : 'Nothing was assumed or filled in — no result is shown.'}
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (resultState === 'uncertain') {
    // `counted === false` on a row that DID produce a resultPattern means
    // the method computed a real, valid `uncertain` verdict — reading.ts's
    // own definition of `counted` (verdict.outcome !== 'uncertain'), the
    // same one COMPARE_RESULTS/ruleEngine.ts already use to decide what
    // counts toward cross-method consensus. This is not a failure: the
    // source rule simply doesn't define an outcome for this chart (e.g.
    // Chapter 32 Method 1 only states what happens when Ali IS adjacent —
    // it is silent on every other chart). Showing "couldn't be computed"
    // here would discard a real, already-computed, source-faithful answer.
    // Nothing is inferred beyond what `row.interpretation` already says —
    // in particular this never converts a missing negative branch into an
    // invented one ("no rain", "unfavourable", etc.).
    return (
      <div>
        {header}
        <div className="space-y-4 px-4 pb-6">
          {savedChartNote}
          <Card>
            <p className="type-body font-semibold text-sand-light">This chart does not trigger this method’s defined condition.</p>
            <p className="mt-1.5 type-body text-sand/70">
              This method was fully evaluated for your chart. The source only defines an outcome for one specific
              condition, and this chart doesn’t meet it — so no result is shown for this case, rather than a guessed one.
            </p>
            {/* Corrective QA (E): the figure the calculation actually
                produced, so the user can see what was checked — never for a
                whole-chart method, whose figure is only a reference. */}
            {!isWholeChartRow(row) && row.resultPattern ? (
              <div className="mt-3 flex items-center gap-3">
                <FigureGlyph pattern={row.resultPattern} size="md" />
                <div className="min-w-0">
                  <p className="type-meta text-sand/65">Figure produced</p>
                  <p className="type-body font-medium text-sand-light">{row.resultFigureName}</p>
                </div>
              </div>
            ) : null}
            <div className="mt-4 border-t border-sand/10 pt-3">
              {row.outcomeLabel ? <Badge tone={row.outcome ? OUTCOME_TONE[row.outcome] : 'neutral'}>{row.outcomeLabel}</Badge> : null}
              <p className="mt-1.5 type-verdict text-sand-light">According to the source: {row.interpretation}</p>
            </div>
          </Card>

          <PracticeChartPanel chart={chart} row={row} />

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
        </div>
      </div>
    );
  }

  const workingCount = row.calculationSteps.length;
  const wholeChart = isWholeChartRow(row);
  const steps: WalkthroughStep[] = [
    wholeChart ? 'whole' : 'houses',
    ...Array<WalkthroughStep>(workingCount).fill('working'),
    'result',
  ];
  const current = steps[stepIndex] ?? 'result';
  const requiredHouses = Array.from(new Set(row.housesUsed));
  const selectedRequiredCount = requiredHouses.filter((h) => selectedHouses.has(h)).length;
  const housesConfirmed = selectedRequiredCount === requiredHouses.length;

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
          {STAGE_LABEL[current]}
        </p>

        {justCast && stepIndex === 0 ? (
          <div>
            <p className="type-body text-sand-light">
              <span className="font-medium">Chart ready.</span>{' '}
              {wholeChart ? 'Now apply this method to it.' : 'Now follow the houses specified by this method.'}
            </p>
            <div className="mt-1">{savedChartNote}</div>
          </div>
        ) : null}

        {current === 'whole' ? (
          <>
            <div>
              <p className="type-body font-medium text-sand-light">This method reads the whole chart.</p>
              <p className="mt-1 type-meta text-sand/65">
                There are no particular houses to select — the source operation looks across all sixteen houses of
                your chart.
              </p>
            </div>
            <HouseSelector chart={chart} required={[]} selected={selectedHouses} onToggle={toggleHouse} />
          </>
        ) : null}

        {current === 'houses' ? (
          <>
            <div>
              <p className="type-meta uppercase tracking-widest text-sand/65">Select the houses used by this method</p>
              <p className="mt-1.5 type-body font-medium text-sand-light">
                {requiredHouses.map((h) => `H${h}`).join(' · ')}
              </p>
              <p className="mt-1 type-meta text-sand/65">Tap each house to select it.</p>
            </div>
            {/* A compact, always-current count — never assumes four houses;
                every total comes straight from this method's own
                requiredHouses (Prompt 21, section 3). */}
            <p role="status" className="type-meta text-sand/65">
              {selectedRequiredCount} of {requiredHouses.length} {requiredHouses.length === 1 ? 'house' : 'houses'} selected
            </p>
            <HouseSelector chart={chart} required={requiredHouses} selected={selectedHouses} onToggle={toggleHouse} />
          </>
        ) : null}

        {current === 'working' ? (
          <Card>
            <p className="type-meta uppercase tracking-widest text-sand/65">Source operation</p>
            <p className="mt-2 type-evidence text-sand-light">{row.calculationSteps[stepIndex - 1]}</p>
            <p className="mt-2 type-meta text-sand/65">This is the operation specified by {method.label}.</p>
            {/* Phase 1: the same recast diagram the Reading flow's
                Calculation Details draws, driven by the row's own casting
                metadata — shown once, on the first working step. */}
            {stepIndex === 1 && row.casting.inspects === 'recast' ? <RecastWorkingDiagram method={row} /> : null}
          </Card>
        ) : null}

        {current === 'result' ? (
          <>
            {/* Phase 1: Chapter 151's own Mothers-and-pairing working, the
                same panel the Reading flow shows, computed from this chart. */}
            {row.casting.display === 'mothers_and_pairing' ? <DreamWorkingPanel chart={chart} /> : null}
            <Card>
              <p className="type-meta uppercase tracking-widest text-sand/65">Method result</p>
              {wholeChart ? (
                // A whole-chart method has no single result figure: the
                // engine's resultFigure for it is only a representative
                // reference, so it is never presented as the result here.
                <p className="mt-2 type-body text-sand/70">
                  This method reads the whole chart, so there is no single result figure to show.
                </p>
              ) : (
                <div className="mt-2 flex items-center gap-3">
                  {row.resultPattern ? <FigureGlyph pattern={row.resultPattern} size="md" /> : null}
                  <div>
                    <p className="type-body font-medium text-sand-light">{row.resultFigureName}</p>
                    <p className="type-meta text-sand/65">
                      {[row.resultFortune, row.resultDirection, row.resultElement].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
              )}
              <div className="mt-4 border-t border-sand/10 pt-3">
                {row.outcomeLabel ? (
                  <Badge tone={row.outcome ? OUTCOME_TONE[row.outcome] : 'neutral'}>{row.outcomeLabel}</Badge>
                ) : null}
                <p className="mt-1.5 type-verdict text-sand-light">According to the source, this indicates: {row.interpretation}</p>
              </div>
            </Card>

            <PracticeChartPanel chart={chart} row={row} />

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

            <p className="type-meta text-sand/65">
              Your chart stays as your current chart. Open another method from the book to apply it to the same chart.
            </p>
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
