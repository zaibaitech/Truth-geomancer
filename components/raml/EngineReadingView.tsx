'use client';

import { useState } from 'react';
import type { ReadingResult } from '@/lib/raml/engine/reading';
import { isSourceSilentReading } from '@/lib/raml/resultPresentation';
import { ReadingHeader } from './reading/ReadingHeader';
import { OutcomeCard } from './reading/OutcomeCard';
import { InsufficientNotice } from './reading/InsufficientNotice';
import { MethodConsistencyCard } from './reading/MethodConsistencyCard';
import { SupportingIndicators } from './reading/SupportingIndicators';
import { CalculationDetails } from './reading/CalculationDetails';
import { VerificationNotice } from './reading/VerificationNotice';
import { ResultSummaryCard } from './reading/ResultSummaryCard';

// Prompt 19 — simplify, clarify, be transparent. The primary screen now
// shows only what section 12 calls priorities 1-4: the question, the
// synthesized answer, whether verified methods agree, and where to find the
// evidence. Everything that used to sit permanently on screen — the primary
// indicator's figure/qualities, every supporting figure, and the full
// method-consistency breakdown — moved behind "How this was determined"
// (section 3, 4, 5, 7). None of it was deleted: FigureCard, in particular,
// is no longer rendered on its own here, but the SAME figure/quality/outcome
// data it would have shown is already present in Calculation Details' own
// per-method card, so nothing a reader could see before is now missing —
// it just isn't shown twice. Every value still comes straight off the
// ReadingResult built in lib/raml/engine/reading.ts; this component and
// resultPresentation.ts only arrange and phrase it.
export function EngineReadingView({ result, userQuestion }: { result: ReadingResult; userQuestion?: string }) {
  const [showCalculation, setShowCalculation] = useState(false);

  return (
    <div className="space-y-4">
      <ReadingHeader question={result.question} questionCategory={result.questionCategory} />

      {result.isInsufficient ? (
        <InsufficientNotice
          shortSummary={result.shortSummary}
          methods={result.methodResults}
          sourceSilent={isSourceSilentReading(result)}
        />
      ) : (
        <>
          <OutcomeCard result={result} />

          {/* Prompt 15, section 10 (kept, made secondary per Prompt 19,
              section 8): the qualification belongs directly under the
              answer it qualifies, but must never dominate it — one line,
              with a link straight into the evidence below. */}
          {result.verificationNotice ? (
            <VerificationNotice text={result.verificationNotice} onExpand={() => setShowCalculation(true)} />
          ) : null}
        </>
      )}

      {/* A real disclosure control, not a styled div: screen readers need to
          know it expands the section below it (Prompt 15, section 17). This
          is now the ONLY gateway to house numbers, figure names, quality
          labels and the per-method audit trail (Prompt 19, section 7). */}
      <button
        onClick={() => setShowCalculation((v) => !v)}
        aria-expanded={showCalculation}
        aria-controls="reading-working"
        className="min-h-[48px] w-full rounded-xl border border-sand/15 px-3 py-2.5 type-evidence font-medium text-sand-light"
      >
        {showCalculation ? 'Hide the working' : 'How this was determined'}
      </button>

      <div id="reading-working" hidden={!showCalculation}>
        {showCalculation ? (
          <div className="space-y-4">
            <CalculationDetails methods={result.methodResults} detailedInterpretation={result.detailedInterpretation} />

            <MethodConsistencyCard
              resultKind={result.resultKind}
              consensusLabel={result.consensusLabel}
              consensusSentence={result.consensusSentence}
              disagreementNote={result.disagreementNote}
              methods={result.methodResults}
            />

            <SupportingIndicators indicators={result.supportingIndicators} />

            {result.verificationNotice ? (
              <div className="rounded-2xl border border-sand/10 bg-ink-card px-4 py-4">
                <p className="type-meta uppercase tracking-widest text-sand/65">Source verification notes</p>
                <p className="mt-1.5 type-body text-sand/70">{result.verificationNotice}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* A compact, always-visible source line (Prompt 19, section 8/9) —
          kept small and secondary, distinct from the shareable summary card
          below it, which restates nothing already on screen and exists only
          to copy the reading elsewhere. */}
      {!result.isInsufficient && result.sourceReferences.length > 0 ? (
        <div className="px-1">
          <p className="type-meta uppercase tracking-widest text-sand/65">Source</p>
          <p className="mt-0.5 type-body text-sand/70">{result.sourceReferences.map((s) => s.label).join(' · ')}</p>
        </div>
      ) : null}

      <ResultSummaryCard result={result} userQuestion={userQuestion} />
    </div>
  );
}
