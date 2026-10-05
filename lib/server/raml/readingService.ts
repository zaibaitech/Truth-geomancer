// Server-only Overview/"Your Reading" execution (Prompt 27C). Reuses
// lib/raml/engine's existing, UNCHANGED runReading() — this file adds no
// calculation logic of its own, only a server-side call site for it.
//
// ACCESS DECISION (Prompt 59): this function is the engine wrapper ONLY.
// Authorization happens in app/api/raml/reading/route.ts via
// authorizeCastingForUser() BEFORE this is called. Do not invoke
// getReadingResult() from a public route without that check — an unpaid
// caller must never reach runReading() for a paid question.
//
// Prompt 61: slim serialized charts may omit star.element. Canonical
// fields are restored from STARS by id here, before runReading, so
// element-dependent methods (Chapter 32 Method 4) still see the real
// figure. Unknown star ids are left untouched — never invented.
import type { Chart } from '@/lib/raml/casting';
import { runReading, type ReadingResult } from '@/lib/raml/engine';
import { QUESTION_REGISTRY } from '@/lib/raml/engine/questions';
import { customerSafeInterpretation, customerSafeRow, noticeForReasonCode } from '@/lib/raml/customerText';
import { hydrateCanonicalStars } from './chartValidation';

/** Same signature as lib/raml/engine's own runReading() — null when
 * intentionId isn't a question the engine has registered (the caller
 * falls back to the parser-based reading-verdicts route instead). Full
 * charts are unchanged; slim charts are hydrated first. */
export function getReadingResult(chart: Chart, intentionId: string): ReadingResult | null {
  const result = runReading(hydrateCanonicalStars(chart), intentionId);
  return result ? toCustomerReading(result) : result;
}

/** Customer-safe wording only (lib/raml/customerText.ts): withheld methods'
 * internal review notes become the neutral source-limitation line and
 * transcription markers are removed from source quotes. Nothing computed
 * (outcomes, figures, houses, verdicts) is touched. */
export function toCustomerReading(result: ReadingResult): ReadingResult {
  const codeOf = (methodId: string) =>
    QUESTION_REGISTRY[result.questionId]?.methods.find((m) => m.id === methodId)?.reviewReasonCode ?? null;
  return {
    ...result,
    methodResults: result.methodResults.map((m) => customerSafeRow(m, codeOf(m.id))),
    detailedInterpretation: customerSafeInterpretation(
      result.detailedInterpretation,
      result.methodResults.map((m): [string | null, string] => [m.reviewNote, noticeForReasonCode(codeOf(m.id))]),
    ),
  };
}