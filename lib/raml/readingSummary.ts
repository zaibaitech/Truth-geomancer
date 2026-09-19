// The compact result summary (Prompt 15, sections 11-12).
//
// One small, honest précis of a finished reading — the same four things a
// user would screenshot or paste somewhere: what was asked, what came back,
// what it means in a sentence, and where it comes from. Every field is taken
// from the ReadingResult the engine already composed; nothing is re-judged,
// re-tallied, or softened here, and no certainty the engine did not state is
// added.
import type { ReadingResult } from './engine/reading';
import { primaryDisplayedInterpretation } from './resultPresentation';
import { INSUFFICIENT_HEADING } from './statusLanguage';

export interface ReadingSummary {
  /** The question, in the engine's own plain-language wording. */
  question: string;
  /** The headline state: a verdict, the descriptive answer, "Mixed /
   * Conflicting indications", or "Insufficient information". */
  status: string;
  /** The engine's own one-or-two sentence answer. */
  interpretation: string;
  /** e.g. "Kanzul Mikban, Chapter 19". */
  source: string;
  /** Present only when the methods genuinely disagree. */
  conflict: boolean;
}

export function summariseReading(result: ReadingResult): ReadingSummary {
  const status = result.isInsufficient
    ? 'Insufficient information'
    : result.conflictingIndicators
      ? 'Mixed / Conflicting indications'
      : result.resultKind === 'descriptive'
        ? (result.descriptiveAnswer ?? 'The methods give different answers')
        : result.outcomeLabel;

  return {
    question: result.question,
    status,
    interpretation: primaryDisplayedInterpretation(result) ?? result.shortSummary,
    source: result.sourceReferences.map((s) => s.label).join(' · '),
    conflict: result.conflictingIndicators,
  };
}

/** Plain text for the "Copy reading" action — the summary, plus the user's
 * own typed question when they entered one. Deliberately free of markup so
 * it pastes cleanly into a message or a note. */
export function readingToText(result: ReadingResult, userQuestion?: string): string {
  const summary = summariseReading(result);
  const lines = [summary.question, '', summary.status, '', summary.interpretation];
  if (userQuestion?.trim()) {
    lines.push('', `Asked: ${userQuestion.trim()}`);
  }
  if (summary.source) lines.push('', `Source: ${summary.source}`);
  if (result.isInsufficient) lines.push('', INSUFFICIENT_HEADING);
  return lines.join('\n');
}
