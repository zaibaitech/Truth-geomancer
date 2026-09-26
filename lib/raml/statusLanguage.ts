// Product wording for engine states (Prompt 15, section 14).
//
// The engine's own vocabulary — `needs_review`, `uncertain`,
// `insufficient_data`, `sourceStatus` — is precise and stays exactly as it is
// in the engine. What a reader sees should say the same thing in ordinary
// words, without ever making a limit of the manuscript look like a fault in
// the app. Nothing here changes a status; it only translates one.
import type { RuleStatus } from './engine/types';

/** Short chip wording for a method's own status. */
export const METHOD_STATUS_LABEL: Record<RuleStatus, string> = {
  verified: 'Read from the source',
  needs_review: 'Source detail missing',
  uncertain: 'Not defined in the source',
};

/** One sentence saying what that status actually means for this reading. */
export const METHOD_STATUS_EXPLANATION: Record<RuleStatus, string> = {
  verified: 'This method is read straight from the manuscript and was used for your answer.',
  needs_review: 'This method needs information the surviving manuscript does not provide, so it was not used.',
  uncertain: 'The surviving source does not define what this method needs, so it was not used.',
};

/** The whole-reading states. */
export const INSUFFICIENT_HEADING = 'Not enough source information';
export const INSUFFICIENT_EXPLANATION =
  'There is not enough source-defined information to determine the answer.';

/** A verified method whose own outcome fell outside every branch its rule
 * defines — the calculation ran, the book simply never says what this result
 * means. */
export const OUTCOME_UNDEFINED_FOR_CHART = 'The surviving source does not define an outcome for this chart.';

/** All verified methods ran, each returned `uncertain`, and none counted —
 * every condition the source defines was checked against this chart and
 * none is present, which is not the same as a method failing to compute
 * (that case still uses INSUFFICIENT_HEADING), and not the same as the
 * source having no rule at all: the rule exists, is implemented, and was
 * evaluated — it simply didn't match this particular chart. The wording
 * below must never read as "the manuscript is incomplete" — only as "not
 * this chart." */
export const SOURCE_SILENT_HEADING = 'None of the source’s conditions are met';

export function sourceSilentExplanation(verifiedCount: number): string {
  if (verifiedCount <= 1) {
    return 'The verified condition the source defines was checked against this chart and is not present, so it gives no answer here.';
  }
  return `Each of the ${verifiedCount} verified conditions the source defines was checked against this chart, and none is present, so the source gives no answer here.`;
}

/** Source material that carries no complete automatic reading at all. */
export const NO_AUTOMATIC_READING_HEADING = 'No automatic reading for this one';
export const NO_AUTOMATIC_READING_EXPLANATION =
  'This source passage does not contain a complete automatic reading.';

/** How many of a reading's methods the manuscript fully supports, in words
 * rather than a raw `sourceStatus` value. */
export function methodTally(verified: number, total: number): string {
  if (total === 0) return 'No methods for this question.';
  if (verified === 0) return `None of the ${total} method${total === 1 ? '' : 's'} here can be read from the surviving source.`;
  if (verified === total) return `All ${total} method${total === 1 ? '' : 's'} read from the source.`;
  return `${verified} of ${total} methods read from the source.`;
}
