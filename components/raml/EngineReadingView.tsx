'use client';

import { useState } from 'react';
import type { ReadingResult } from '@/lib/raml/engine/reading';
import { ReadingHeader } from './reading/ReadingHeader';
import { OutcomeCard } from './reading/OutcomeCard';
import { InsufficientNotice } from './reading/InsufficientNotice';
import { FigureCard } from './reading/FigureCard';
import { MethodConsistencyCard } from './reading/MethodConsistencyCard';
import { SupportingIndicators } from './reading/SupportingIndicators';
import { CalculationDetails } from './reading/CalculationDetails';
import { SourceReference } from './reading/SourceReference';
import { VerificationNotice } from './reading/VerificationNotice';

// Display order follows Prompt 3.5 section 4's recommended order exactly:
// header -> overall outcome + 1-2 sentence answer -> primary indication
// (figure, qualities, THIS method's own outcome, short interpretation) ->
// supporting indicators (each with its own relevance note) -> method
// consistency -> calculation details (collapsed by default) -> source. The
// old always-visible, multi-method "Interpretation" block was retired here:
// its content is now either the primary indication's own short quote, or
// (for advanced users) the "Full computed interpretation" note inside
// Calculation Details — never a wall of concatenated method text on the
// first screen. Every value still comes straight off the ReadingResult
// built in lib/raml/engine/reading.ts — this component only arranges it.
export function EngineReadingView({ result }: { result: ReadingResult }) {
  const [showCalculation, setShowCalculation] = useState(false);

  return (
    <div className="space-y-4">
      <ReadingHeader question={result.question} questionCategory={result.questionCategory} />

      {result.isInsufficient ? (
        <InsufficientNotice shortSummary={result.shortSummary} methods={result.methodResults} />
      ) : (
        <>
          <OutcomeCard outcomeLabel={result.outcomeLabel} overallOutcome={result.overallOutcome} shortSummary={result.shortSummary} />

          {result.primaryFigure ? <FigureCard indicator={result.primaryFigure} /> : null}

          <SupportingIndicators indicators={result.supportingIndicators} />

          <MethodConsistencyCard
            consensusLabel={result.consensusLabel}
            consensusSentence={result.consensusSentence}
            disagreementNote={result.disagreementNote}
            methods={result.methodResults}
          />
        </>
      )}

      {result.verificationNotice ? (
        <VerificationNotice text={result.verificationNotice} onExpand={() => setShowCalculation(true)} />
      ) : null}

      <button
        onClick={() => setShowCalculation((v) => !v)}
        className="w-full rounded-xl border border-sand/15 px-3 py-2 text-xs font-medium text-sand-light"
      >
        {showCalculation ? 'Hide calculation details' : 'How was this calculated?'}
      </button>

      {showCalculation ? (
        <CalculationDetails methods={result.methodResults} detailedInterpretation={result.detailedInterpretation} />
      ) : null}

      <SourceReference sources={result.sourceReferences} />
    </div>
  );
}
