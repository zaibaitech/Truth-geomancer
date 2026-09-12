'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FigureGlyph } from './FigureGlyph';
import type { EngineResult, MethodOutcome, RuleStatus } from '@/lib/raml/engine/types';

const OUTCOME_LABEL: Record<MethodOutcome | 'insufficient_data', string> = {
  favourable: 'Favourable',
  unfavourable: 'Unfavourable',
  mixed: 'Mixed',
  uncertain: 'Uncertain',
  insufficient_data: 'Not enough to go on',
};

const OUTCOME_TONE: Record<MethodOutcome | 'insufficient_data', 'sand' | 'fire' | 'neutral'> = {
  favourable: 'sand',
  unfavourable: 'fire',
  mixed: 'neutral',
  uncertain: 'neutral',
  insufficient_data: 'neutral',
};

const STATUS_LABEL: Record<RuleStatus, string> = {
  verified: 'Verified',
  needs_review: 'Needs review',
  uncertain: 'Uncertain',
};

const CONSENSUS_LABEL: Record<EngineResult['calculationDetails']['consensus']['level'], string> = {
  agree: 'Methods agree',
  mostly_agree: 'Methods mostly agree',
  mixed: 'Mixed indications',
  conflict: 'Methods conflict',
  insufficient_data: 'Not enough computable methods',
};

export function EngineReadingView({ result }: { result: EngineResult }) {
  const [showInterpretation, setShowInterpretation] = useState(false);
  const [showCalculation, setShowCalculation] = useState(false);

  const consensus = result.calculationDetails.consensus;
  const primary = result.primaryFigure;

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-[11px] uppercase tracking-widest text-sand/40">Your reading is ready</p>
        <p className="mt-1 text-sm font-semibold text-sand-light">{result.question}</p>

        <div className="mt-4 flex items-center gap-2">
          <Badge tone={OUTCOME_TONE[result.overallResult]}>{OUTCOME_LABEL[result.overallResult]}</Badge>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-sand/70">{result.summary}</p>

        {primary?.calculation ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-sand/10 bg-ink px-3 py-3">
            <FigureGlyph pattern={primary.calculation.resultFigure.dotPattern} size="sm" />
            <div>
              <p className="text-[11px] uppercase tracking-widest text-sand/40">Primary indicator</p>
              <p className="text-sm font-medium text-sand-light">{primary.calculation.resultFigure.figureName}</p>
              <p className="text-[11px] text-sand/45">{primary.method.label} · {primary.calculation.housesUsed.map((n) => `H${n}`).join(' + ')}</p>
            </div>
          </div>
        ) : null}

        {result.supportingHouses.length > 0 ? (
          <div className="mt-3">
            <p className="mb-1.5 text-[11px] uppercase tracking-widest text-sand/40">Supporting houses</p>
            <div className="flex flex-wrap gap-1">
              {result.supportingHouses.map((n) => (
                <Badge key={n} tone="neutral">
                  H{n}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between rounded-xl border border-sand/10 bg-ink px-3 py-2.5">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-sand/40">Method consistency</p>
            <p className="text-sm text-sand-light">{CONSENSUS_LABEL[consensus.level]}</p>
          </div>
          <p className="text-[11px] text-sand/45">
            {consensus.verifiableCount} of {result.methods.length} method(s) computed
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setShowInterpretation((v) => !v)}
            className="flex-1 rounded-xl border border-sand/15 px-3 py-2 text-xs font-medium text-sand-light"
          >
            {showInterpretation ? 'Hide full interpretation' : 'Read full interpretation'}
          </button>
          <button
            onClick={() => setShowCalculation((v) => !v)}
            className="flex-1 rounded-xl border border-sand/15 px-3 py-2 text-xs font-medium text-sand-light"
          >
            {showCalculation ? 'Hide calculation' : 'How was this calculated?'}
          </button>
        </div>
      </Card>

      {showInterpretation ? (
        <Card>
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-sand/40">Full interpretation</p>
          <p className="text-sm leading-relaxed text-sand/80">{result.interpretation}</p>
        </Card>
      ) : null}

      {showCalculation ? (
        <Card>
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-sand/40">How was this calculated?</p>
          <div className="space-y-3">
            {result.methods.map((m) => (
              <div key={m.method.id} className="rounded-xl border border-sand/10 bg-ink px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-clay-light">{m.method.label}</p>
                  <Badge tone={m.method.status === 'verified' ? 'sand' : 'neutral'}>{STATUS_LABEL[m.method.status]}</Badge>
                </div>
                <p className="mt-1.5 text-[11px] italic text-sand/40">“{m.method.source.quote}”</p>

                {m.calculation ? (
                  <div className="mt-2 space-y-0.5">
                    {m.calculation.steps.map((step, i) => (
                      <p key={i} className="text-[12px] text-sand/55">
                        {step}
                      </p>
                    ))}
                  </div>
                ) : null}

                {m.verdict ? (
                  <p className="mt-2 text-sm text-sand-light">
                    <Badge tone={OUTCOME_TONE[m.verdict.outcome]}>{OUTCOME_LABEL[m.verdict.outcome]}</Badge>
                    <span className="ml-2">{m.verdict.interpretation}</span>
                  </p>
                ) : (
                  <p className="mt-2 text-[12px] text-sand/40">{m.method.reviewNote}</p>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-sand/35">
            Good/bad and upward/downward here are read from classical geomancy attributions for each
            figure — not from this manuscript, which doesn’t tabulate them itself. Methods marked
            “needs review” or “uncertain” are shown for transparency but don’t count toward the
            result above.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
