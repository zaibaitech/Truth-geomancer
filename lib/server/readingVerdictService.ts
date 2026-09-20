// Server-only computation for the "Your Reading" tab (Prompt 27B, closing
// the residual Kanzul Mikban corpus leak Prompt 27 documented and left
// open). Reuses lib/server/raml/methodVerdicts.ts — the SAME two-tier
// calculation Prompt 27B found already existed — unchanged, so an
// authorized request gets byte-for-byte the same computed verdict it
// always did (see lib/server/raml/readingVerdictsEquivalence.test.ts).
//
// ACCESS DECISION (Prompt 59): this function is the computation wrapper
// ONLY. Authorization happens in app/api/raml/reading-verdicts/route.ts
// via authorizeCastingForUser() BEFORE this is called. Do not invoke it
// from a public route without that check.
//
// What keeps this from becoming "an endpoint that returns the parsed
// corpus" (the thing Prompt 27B explicitly forbids): chapterIds are NEVER
// taken from the caller. They are derived here, server-side, from a real
// intentionId via getIntentionById — the exact same public, small mapping
// ReadingTab always used — so a caller cannot request arbitrary chapters
// across the whole 153-chapter book in one call. Each response is also
// trimmed to PublicMethodVerdict (drops methodText, the full protected
// paragraph, which the UI never rendered anyway — see
// lib/raml/readingVerdictTypes.ts).
import { getIntentionById } from '@/content/intentions';
import type { Chart } from '@/lib/raml/casting';
import type { ReadingVerdictsByChapter } from '@/lib/raml/readingVerdictTypes';
import { getMethodVerdicts, type MethodVerdictResult } from './raml/methodVerdicts';

export type ReadingVerdictsResult =
  | { ok: true; verdicts: ReadingVerdictsByChapter }
  | { ok: false; reason: 'unknown-intention' };

/** The one entry point the reading-verdicts Route Handler calls. Chart is
 * caller-supplied (it's the user's OWN just-cast chart — never secret,
 * never someone else's), but chapterIds never are. */
export function getReadingVerdictsForIntention(intentionId: string, chart: Chart): ReadingVerdictsResult {
  const intention = getIntentionById(intentionId);
  if (!intention) return { ok: false, reason: 'unknown-intention' };

  const verdicts: ReadingVerdictsByChapter = {};
  for (const chapterId of intention.chapterIds) {
    const full = getMethodVerdicts(chapterId, chart);
    verdicts[chapterId] = full === null ? null : full.map((v) => (v === null ? null : stripProtectedFields(v)));
  }
  return { ok: true, verdicts };
}

function stripProtectedFields(v: MethodVerdictResult) {
  const { methodText: _methodText, ...rest } = v;
  return rest;
}
