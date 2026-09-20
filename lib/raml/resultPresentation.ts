// Presentation-only classification of an already-composed ReadingResult
// (Prompt 19 — simplify/clarify the results screen). This file decides
// nothing about geomancy: every value it reads (consensusLabel, each
// method's own `counted`/`outcomeLabel`, `outcomeLabel`, `descriptiveAnswer`)
// was already computed by reading.ts from the engine's own consensus. All
// this does is turn that already-decided state into the short, honest
// status line and headline the primary reading card shows — a phrasing
// layer, never a second opinion.
import type { ReadingMethodRow, ReadingResult } from './engine/reading';

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

function normalisePhrase(s: string): string {
  return s.trim().replace(/[.]+$/g, '').toLowerCase();
}

/** True when `text` is just the headline restated — e.g. shortSummary
 * "The verified methods indicate: Interpretation #5 — Ibrahim." against
 * that same descriptiveAnswer. Never a geomantic judgement. */
function repeatsHeadline(text: string, result: ReadingResult, status: PrimaryStatus): boolean {
  const headline = primaryAnswerText(result, status);
  const nText = normalisePhrase(text);
  const nHeadline = normalisePhrase(headline);
  if (!nText || !nHeadline) return false;
  if (nText === nHeadline) return true;
  if (result.resultKind === 'descriptive' && result.descriptiveAnswer) {
    const nAnswer = normalisePhrase(result.descriptiveAnswer);
    if (nText === nAnswer) return true;
    if (nText === `the verified methods indicate: ${nAnswer}`) return true;
  }
  return false;
}

/** The source-backed interpretation already sitting on the counted method
 * row(s) / primary figure — surfaced on the primary card for a descriptive
 * reading so the reader sees the actual meaning, not only the figure
 * identifier. Returns null when there is no single shared interpretation
 * (mixed methods, outcome-kind readings, insufficient data), so existing
 * counted-method / favourable-unfavourable presentation is unchanged.
 * Never invents text; never branches on a chapter or figure name. */
export function primaryDisplayedInterpretation(result: ReadingResult, status?: PrimaryStatus): string | null {
  if (result.isInsufficient) return null;
  const resolved = status ?? computePrimaryStatus(result);
  if (resolved.kind === 'no_dominant') return null;
  if (result.resultKind !== 'descriptive') return null;

  const counted = result.methodResults.filter((m) => m.counted);
  const texts = counted.map((m) => m.interpretation?.trim() ?? '').filter((t) => t.length > 0);
  let text: string | null = null;
  if (texts.length > 0) {
    if (new Set(texts).size !== 1) return null;
    text = texts[0];
  } else {
    const fallback = result.primaryFigure?.interpretation?.trim() ?? '';
    text = fallback.length > 0 ? fallback : null;
  }
  if (!text) return null;
  if (repeatsHeadline(text, result, resolved)) return null;
  return text;
}

/** shortSummary stays on the card unless it would merely repeat the
 * headline (or the interpretation already shown). Outcome readings keep
 * their existing "Favourable — the verified methods agree." line. */
export function shouldShowShortSummary(result: ReadingResult, interpretation: string | null, status?: PrimaryStatus): boolean {
  const summary = result.shortSummary?.trim() ?? '';
  if (!summary) return false;
  const resolved = status ?? computePrimaryStatus(result);
  if (interpretation) {
    if (summary === interpretation) return false;
    if (repeatsHeadline(summary, result, resolved)) return false;
  }
  if (repeatsHeadline(summary, result, resolved)) return false;
  return true;
}

/** True when every method on the reading executed as a verified `uncertain`
 * result and none of them counted. That is source-silence for this chart
 * (the book defines the methods, but not an outcome here) — not a
 * technical failure, and not "not enough source information".
 *
 * Generic on result metadata: never keyed off a chapter or question id.
 * A needs_review / failed-to-compute method (status not verified, or
 * outcome null) keeps the existing insufficient presentation. */
export function isSourceSilentReading(result: ReadingResult): boolean {
  if (!result.isInsufficient) return false;
  const methods = result.methodResults;
  if (methods.length === 0) return false;
  if (methods.some((m) => m.counted)) return false;
  return methods.every((m) => m.status === 'verified' && m.outcome === 'uncertain');
}

/** One method line for a source-silent reading. Prefers the trigger the
 * method already named in its own interpretation (quoted), then the
 * method's existing interpretation, and never invents a negative answer. */
export function sourceSilentConditionLine(method: ReadingMethodRow): string {
  const quoted = method.interpretation?.match(/"([^"]+)"/);
  if (quoted?.[1]) return `${quoted[1]} — not present in this chart.`;
  const existing = method.interpretation?.trim();
  if (existing) return existing;
  if (method.outcomeLabel) return `${method.outcomeLabel} — not present in this chart.`;
  return 'The source does not define an outcome for this chart.';
}
