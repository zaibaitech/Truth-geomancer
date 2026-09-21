// The engine's single entry point (sections 3, 5, 9). Takes an already-cast
// chart and a question definition, runs every one of the question's methods
// automatically — no house is ever asked of the user — and returns a
// complete, deterministic result with a full audit trail.

import type { Chart } from '../casting';
import { buildChartModel } from './chartModel';
import { COMPARE_RESULTS } from './operations';
import { buildInterpretation, buildSummary } from './interpretation';
import type { EngineResult, MethodCalculation, MethodConsensus, MethodOutcome, MethodResult, QuestionDefinition } from './types';

// Prompt 3.5 compatibility fix (minimal, presentation-consistency only —
// no calculation/consensus math changed): COMPARE_RESULTS' own 'mixed'
// level already means "no dominant type" (see operations.ts — it's assigned
// exactly when nothing reaches a >50% majority). The >= comparisons below
// are only safe once a level of 'agree' or 'mostly_agree' has already
// established genuine, unique dominance; applied to a 'mixed' level they
// can silently pick a side on an exact tie (e.g. 1 favourable vs. 1 mixed,
// 0 unfavourable — favourableCount >= mixedCount is true on a tie), which
// produced a self-contradictory display (an outcome badge reading
// "Favourable" next to a Method Consistency summary reading "Mixed").
// 'mixed' is now handled the same way 'conflict' already was.
// Prompt 4.5: a descriptive question (terrain/direction/location) never
// resolves through the favourable/unfavourable/mixed logic below — its own
// consensus.level ('agree'/'disagree'/'insufficient_data') already says
// everything the display needs; 'descriptive' here just flags "this
// question's methods answer categorically," never a favourable/unfavourable
// judgment the source never made.
function deriveOverallResult(consensus: MethodConsensus): MethodOutcome | 'insufficient_data' {
  if (consensus.level === 'insufficient_data') return 'insufficient_data';
  if (consensus.kind === 'descriptive') return 'descriptive';
  if (consensus.level === 'conflict' || consensus.level === 'mixed') return 'mixed';
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
    // 'castingRequirement' included (Prompt 74) so reading.ts can expose a
    // method's already-existing casting classification to the presentation
    // layer via the same getEffectiveCastingRequirement/toPublicCastingMeta
    // sanitizer used elsewhere. Pure metadata pass-through — calculate() and
    // evaluate() below are still called on the untouched `method`, so no
    // calculation behavior changes.
    const methodRef = {
      id: method.id,
      label: method.label,
      status: method.status,
      reviewNote: method.reviewNote,
      source: method.source,
      castingRequirement: method.castingRequirement,
    };

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

  const consensus = COMPARE_RESULTS(methods, question.resultKind ?? 'outcome');
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
