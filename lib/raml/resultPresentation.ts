// Presentation-only classification of an already-composed ReadingResult
// (Prompt 19 — simplify/clarify the results screen). This file decides
// nothing about geomancy: every value it reads (consensusLabel, each
// method's own `counted`/`outcomeLabel`, `outcomeLabel`, `descriptiveAnswer`)
// was already computed by reading.ts from the engine's own consensus. All
// this does is turn that already-decided state into the short, honest
// status line and headline the primary reading card shows — a phrasing
// layer, never a second opinion.
import type { ReadingResult } from './engine/reading';

export type PrimaryStatusKind = 'single' | 'agree' | 'mostly_agree' | 'no_dominant';

export interface PrimaryStatus {
  kind: PrimaryStatusKind;
  /** How many methods actually counted toward this reading — never a count
   * of methods shown, quoted, or merely calculated. */
  countedCount: number;
  /** The one short line shown directly under the answer. */
  statusText: string;
  /** True when the individual counted methods should be listed by name
   * ("Method 1 → answer") because no single answer can honestly stand in
   * for all of them — never true when they actually agree. */
  showBreakdown: boolean;
}

/** Classifies the reading's already-computed consensus into the four states
 * the primary screen distinguishes. Never re-tallies a single method result
 * — `result.methodResults[].counted` and `result.consensusLabel` are the
 * engine's own decision (COMPARE_RESULTS via reading.ts), read here as-is. */
export function computePrimaryStatus(result: ReadingResult): PrimaryStatus {
  const countedCount = result.methodResults.filter((m) => m.counted).length;

  if (countedCount <= 1) {
    return { kind: 'single', countedCount, statusText: 'Based on 1 verified method.', showBreakdown: false };
  }
  if (result.consensusLabel === 'Methods agree') {
    return { kind: 'agree', countedCount, statusText: `${countedCount} verified methods agree.`, showBreakdown: false };
  }
  if (result.consensusLabel === 'Methods mostly agree') {
    // A real dominant answer exists here — not a genuine conflict — so the
    // headline still shows it (see primaryAnswerText). The breakdown stays
    // visible precisely because it is not unanimous.
    return {
      kind: 'mostly_agree',
      countedCount,
      statusText: `${countedCount} verified methods mostly agree.`,
      showBreakdown: true,
    };
  }
  // 'Mixed indications', 'Methods conflict' or 'Methods disagree' — no
  // dominant side at all. Never smoothed into an "agree" or "mostly agree"
  // reading.
  return { kind: 'no_dominant', countedCount, statusText: 'Verified methods give mixed indications.', showBreakdown: true };
}

/** The single headline word/phrase shown as the answer. Only 'no_dominant'
 * overrides the engine's own label — with no dominant side, there is no
 * single answer to feature, so the headline says exactly that rather than
 * arbitrarily picking one method's result. Every other state shows the
 * engine's own already-computed outcomeLabel/descriptiveAnswer verbatim. */
export function primaryAnswerText(result: ReadingResult, status: PrimaryStatus): string {
  if (status.kind === 'no_dominant') return 'Mixed indications';
  if (result.resultKind === 'descriptive') return result.descriptiveAnswer ?? 'Mixed indications';
  return result.outcomeLabel;
}
