// Public entry point for the automatic geomancy interpretation engine.
//
//   CAST → USER MANUALLY PICKS HOUSES → USER CALCULATES     (old)
//   CAST → runEngine(chart, intentionId) → ready-made reading  (this)

import type { Chart } from '../casting';
import { getQuestionDefinition } from './questions';
import { runQuestion } from './ruleEngine';
import type { EngineResult } from './types';

/** Returns a complete, automatically-calculated reading for one of the
 * pilot questions in questions/index.ts, or null if this intention isn't in
 * the registry yet (the caller should fall back to the existing
 * lib/raml/methodVerdicts.ts flow in that case — this engine is additive,
 * not a replacement for the chapters it doesn't cover yet). */
export function runEngine(chart: Chart, intentionId: string): EngineResult | null {
  const question = getQuestionDefinition(intentionId);
  if (!question) return null;
  return runQuestion(chart, question);
}

export { QUESTION_REGISTRY, getQuestionDefinition } from './questions';
export { buildChartModel } from './chartModel';
export * as engineOperations from './operations';
export type * from './types';
