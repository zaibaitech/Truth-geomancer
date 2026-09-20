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
import { hydrateCanonicalStars } from './chartValidation';

/** Same signature as lib/raml/engine's own runReading() — null when
 * intentionId isn't a question the engine has registered (the caller
 * falls back to the parser-based reading-verdicts route instead). Full
 * charts are unchanged; slim charts are hydrated first. */
export function getReadingResult(chart: Chart, intentionId: string): ReadingResult | null {
  return runReading(hydrateCanonicalStars(chart), intentionId);
}