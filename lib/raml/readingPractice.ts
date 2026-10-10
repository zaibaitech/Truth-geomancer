// Free-cast Phase B: the eligibility gate and answer check for the optional
// "Try it yourself" addition practice.
//
// This is NOT a second calculation engine. It offers practice only when the
// reading already carries one verified, counted addition method whose houses and
// order can be read unambiguously from the engine's own working line, and when
// folding those houses with the app's existing addPatterns reproduces the
// engine's recorded result. The ANSWER KEY is the engine's recorded result
// pattern; the fold is only a validation check. Any doubt returns null.
//
// Pure and client-safe: types plus addPatterns only. No access decisions are
// made here; the caller passes the free-sample flag it derived from the
// existing casting-authorization helpers.
import type { Chart } from '@/lib/raml/casting';
import { addPatterns } from '@/lib/raml/casting';
import type { Pattern } from '@/content/stars';
import type { ReadingResult } from '@/lib/raml/engine/reading';
import { isSourceSilentReading } from '@/lib/raml/resultPresentation';
import type { ReasoningStep, StepHouse } from '@/lib/raml/readingExplanation';

export interface PracticePlan {
  methodId: string;
  /** The input figures, in the engine's recorded order. */
  houses: StepHouse[];
  /** The engine's recorded result pattern. Never rendered before the user asks. */
  answerKey: Pattern;
  resultName: string;
  /** The engine's own working line, verbatim. */
  workingLine: string;
}

// The engine's trace shape: "H1 (Issah) + H4 (Ali) + ... = Ali".
const TRACE = /^H\d+ \([^)]+\)( \+ H\d+ \([^)]+\))+ = .+$/;
const TERM = /H(\d+) \(([^)]+)\)/g;

const isRow = (v: unknown): v is 1 | 2 => v === 1 || v === 2;
const isPattern = (p: unknown): p is Pattern => Array.isArray(p) && p.length === 4 && p.every(isRow);
const same = (a: Pattern, b: Pattern) => a.every((v, i) => v === b[i]);

export function buildPractice(
  result: ReadingResult,
  steps: ReasoningStep[],
  chart: Chart | undefined,
  context: { isFreeSample: boolean },
): PracticePlan | null {
  if (context.isFreeSample !== true || !chart) return null;
  if (result.isInsufficient || isSourceSilentReading(result) || result.resultKind === 'descriptive') return null;

  const counted = result.methodResults.filter((m) => m.counted);
  if (counted.length !== 1 || counted[0].status !== 'verified') return null;
  if (counted[0].casting.inspects === 'recast') return null;

  if (steps.length !== 1) return null;
  const step = steps[0];
  if (step.methodId !== counted[0].id || step.working.length !== 1 || !step.result) return null;

  const line = step.working[0];
  if (!TRACE.test(line)) return null;
  const terms = Array.from(line.matchAll(TERM)).map((m) => ({ n: Number(m[1]), name: m[2] }));
  if (terms.length < 2 || terms.length !== step.houses.length) return null;
  if (new Set(terms.map((t) => t.n)).size !== terms.length) return null;

  // The order in the trace, the houses the step shows, and the chart must agree exactly.
  for (let i = 0; i < terms.length; i++) {
    const h = step.houses[i];
    const ch = chart.houses[terms[i].n - 1];
    if (!ch || ch.n !== terms[i].n || h.number !== terms[i].n) return null;
    if (h.figureName !== terms[i].name || ch.star.name !== terms[i].name) return null;
    if (!isPattern(h.pattern) || !isPattern(ch.pattern) || !same(h.pattern, ch.pattern)) return null;
  }

  const key = step.result.pattern;
  if (!isPattern(key)) return null;

  // Validation only: the fold must reproduce the engine's recorded result.
  let folded: Pattern = step.houses[0].pattern;
  for (let i = 1; i < step.houses.length; i++) folded = addPatterns(folded, step.houses[i].pattern);
  if (!same(folded, key)) return null;

  return { methodId: step.methodId, houses: step.houses, answerKey: key, resultName: step.result.name, workingLine: line };
}

export type Attempt = ReadonlyArray<1 | 2 | null>;
export type AttemptCheck = 'incomplete' | 'correct' | 'incorrect';

export function checkAttempt(key: Pattern, attempt: Attempt): AttemptCheck {
  if (attempt.length !== 4 || attempt.some((v) => v !== 1 && v !== 2)) return 'incomplete';
  return attempt.every((v, i) => v === key[i]) ? 'correct' : 'incorrect';
}
