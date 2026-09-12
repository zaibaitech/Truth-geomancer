// The engine's single entry point (sections 3, 5, 9). Takes an already-cast
// chart and a question definition, runs every one of the question's methods
// automatically — no house is ever asked of the user — and returns a
// complete, deterministic result with a full audit trail.

import type { Chart } from '../casting';
import { buildChartModel } from './chartModel';
import { COMPARE_RESULTS } from './operations';
import { buildInterpretation, buildSummary } from './interpretation';
import type { EngineResult, MethodCalculation, MethodConsensus, MethodOutcome, MethodResult, QuestionDefinition } from './types';

function deriveOverallResult(consensus: MethodConsensus): MethodOutcome | 'insufficient_data' {
  if (consensus.level === 'insufficient_data') return 'insufficient_data';
  if (consensus.level === 'conflict') return 'mixed';
  const { favourableCount, unfavourableCount, mixedCount } = consensus;
  if (favourableCount >= unfavourableCount && favourableCount >= mixedCount && favourableCount > 0) return 'favourable';
  if (unfavourableCount >= favourableCount && unfavourableCount >= mixedCount && unfavourableCount > 0) return 'unfavourable';
  return 'mixed';
}

export function runQuestion(chart: Chart, question: QuestionDefinition): EngineResult {
  const model = buildChartModel(chart);

  // A method's CALCULATION and its VERDICT are gated separately (section 8):
  // even a 'needs_review'/'uncertain' method's calculate() runs and its
  // facts stay visible in the audit trail where it's genuinely computable
  // (e.g. "check H2 and H6" is a real fact regardless of whether the
  // engine trusts the verdict drawn from it) — only evaluate() is withheld
  // for anything short of 'verified', so an unverified rule never
  // contributes an opinion, only the houses/figures it actually touched.
  // A method whose calculate() itself throws (its source depends on
  // figures the transcription never captured) shows neither.
  const methods: MethodResult[] = question.methods.map((method) => {
    const methodRef = { id: method.id, label: method.label, status: method.status, reviewNote: method.reviewNote, source: method.source };

    let calculation: MethodCalculation;
    try {
      calculation = method.calculate(model);
    } catch (err) {
      return {
        method: { ...methodRef, reviewNote: methodRef.reviewNote ?? `Calculation failed: ${(err as Error).message}` },
        calculation: null,
        verdict: null,
      };
    }

    if (method.status !== 'verified') {
      return { method: methodRef, calculation, verdict: null };
    }

    const verdict = method.evaluate(calculation, model);
    return { method: methodRef, calculation, verdict };
  });

  const consensus = COMPARE_RESULTS(methods);
  const overallResult = deriveOverallResult(consensus);
  const primaryFigure = methods.find((m) => m.verdict) ?? null;
  const supportingHouses = Array.from(new Set(methods.flatMap((m) => m.calculation?.housesUsed ?? []))).sort((a, b) => a - b);

  return {
    questionId: question.id,
    question: question.title,
    overallResult,
    summary: buildSummary(overallResult, consensus),
    primaryFigure,
    supportingHouses,
    methods,
    interpretation: buildInterpretation(question.title, methods, consensus),
    calculationDetails: { consensus },
  };
}
