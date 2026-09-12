'use client';

import { useState } from 'react';
import type { ReadingResult } from '@/lib/raml/engine/reading';
import { ReadingHeader } from './reading/ReadingHeader';
import { OutcomeCard } from './reading/OutcomeCard';
import { FigureCard } from './reading/FigureCard';
import { InterpretationCard } from './reading/InterpretationCard';
import { MethodConsistencyCard } from './reading/MethodConsistencyCard';
import { SupportingIndicators } from './reading/SupportingIndicators';
import { CalculationDetails } from './reading/CalculationDetails';
import { SourceReference } from './reading/SourceReference';
import { VerificationNotice } from './reading/VerificationNotice';

// Display order follows section 12's priority list exactly, as made
// concrete by section 18's mock: header -> direct answer -> primary
// indicator -> question-specific interpretation (always visible, not
// gated) -> cross-method consistency -> supporting indicators -> optional
// calculation details -> source. Every value here comes straight off the
// ReadingResult built in lib/raml/engine/reading.ts — this component only
// arranges it, never recalculates anything.
export function EngineReadingView({ result }: { result: ReadingResult }) {
  const [showCalculation, setShowCalculation] = useState(false);

  const primaryMethod = result.methodResults.find((m) => m.label === result.primaryFigure?.methodLabel);

  return (
    <div className="space-y-4">
      <ReadingHeader question={result.question} questionCategory={result.questionCategory} />

      <OutcomeCard
        outcomeLabel={result.outcomeLabel}
        overallOutcome={result.overallOutcome}
        shortSummary={result.shortSummary}
        isInsufficient={result.isInsufficient}
      />

      {!result.isInsufficient ? (
        <>
          {result.primaryFigure ? (
            <FigureCard indicator={result.primaryFigure} contextualNote={primaryMethod?.interpretation} />
          ) : null}

          <InterpretationCard text={result.detailedInterpretation} />

          <MethodConsistencyCard
            consensusLabel={result.consensusLabel}
            consensusBreakdown={result.consensusBreakdown}
            disagreementNote={result.disagreementNote}
            methods={result.methodResults}
          />

          <SupportingIndicators indicators={result.supportingIndicators} methods={result.methodResults} />
        </>
      ) : null}

      {result.verificationNotice ? (
        <VerificationNotice text={result.verificationNotice} onExpand={() => setShowCalculation(true)} />
      ) : null}

      <button
        onClick={() => setShowCalculation((v) => !v)}
        className="w-full rounded-xl border border-sand/15 px-3 py-2 text-xs font-medium text-sand-light"
      >
        {showCalculation ? 'Hide calculation details' : 'How was this calculated?'}
      </button>

      {showCalculation ? <CalculationDetails methods={result.methodResults} /> : null}

      <SourceReference sources={result.sourceReferences} />
    </div>
  );
}
