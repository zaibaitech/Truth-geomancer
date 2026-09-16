// Server-only Overview/"Your Reading" execution (Prompt 27C). Reuses
// lib/raml/engine's existing, UNCHANGED runReading() — this file adds no
// calculation logic of its own, only a server-side call site for it.
//
// ACCESS DECISION: stays free/ungated, matching the pre-existing free
// casting/Overview product design already confirmed in Prompt 27B for
// lib/server/readingVerdictService.ts (the SAME product feature — this is
// its engine-backed sibling, for questions the engine covers directly).
// What this closes is the CLIENT BUNDLE leak (the full engine, with every
// question's embedded source text, no longer needs to be imported by
// ResultTabs.tsx/ReadingTab.tsx) — not a change to who can see a free
// reading's result.
import type { Chart } from '@/lib/raml/casting';
import { runReading, type ReadingResult } from '@/lib/raml/engine';

/** Same signature and behavior as lib/raml/engine's own runReading() —
 * null when intentionId isn't a question the engine has registered (the
 * caller falls back to the parser-based reading-verdicts route instead,
 * exactly as before this migration). */
export function getReadingResult(chart: Chart, intentionId: string): ReadingResult | null {
  return runReading(chart, intentionId);
}
