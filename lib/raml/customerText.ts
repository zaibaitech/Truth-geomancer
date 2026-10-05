// Customer-facing wording for the Kanzul Mikban reader and readings.
//
// The stored chapter text and the engine's method notes carry transcription
// and review markers that were written for the project, not for readers:
// "[figures omitted — symbols not preserved in this transcription]",
// "[text continues onto the next page, not yet transcribed]", and review notes
// that explain WHY a method is withheld in development terms. They stay in the
// source and audit files. This module is the one place that turns them into
// what a customer sees: the marker disappears, and where something is genuinely
// missing the customer gets one short, neutral line.
//
// Presentation only — nothing here changes what the engine computes. Legitimate
// edition wording about the manuscript itself (e.g. "unclear in the original",
// the edition's note that the dot-figures were reconstructed from photographs)
// is NOT touched.

/** The one neutral limitation message. */
export const SOURCE_INCOMPLETE_NOTICE = 'Source information incomplete for this method.';

// Bracketed markers that are internal transcription status, nothing else.
const INTERNAL_MARKER =
  /\s*\[(?:Note: )?(?:figures omitted[^\]]*|text continues onto the next page, not yet transcribed|talismanic diagram in the original — not reproduced here; see original scan)\]/g;

export interface CleanedSourceText {
  text: string;
  /** True when an internal marker was removed — i.e. something is missing. */
  removedMarker: boolean;
}

/** Remove internal markers from a piece of source text and tidy the gap. */
export function cleanSourceText(text: string): CleanedSourceText {
  const stripped = text.replace(INTERNAL_MARKER, '');
  if (stripped === text) return { text, removedMarker: false };
  const tidy = stripped
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/\(\s*\)/g, '')
    .trim();
  return { text: tidy, removedMarker: true };
}

/** Shown when the book DESCRIBES a method completely but it cannot be run as an
 * automatic reading (overlapping outcomes, no way to apply it mechanically). The
 * book's own text is shown in full; only the automatic reading is withheld. */
export const AUTOMATIC_READING_UNAVAILABLE_NOTICE = "This method is described in the source, but it can't be applied as an automatic reading.";

// Reasons where the authoritative source itself does not give what the method needs.
const SOURCE_LACKS = new Set([
  'gender_classification_unsourced',
  'stability_classification_unsourced',
  'day_night_classification_unsourced',
  'temporal_classification_unsourced',
  'constant_figure_undefined',
  'interpretation_not_stated',
  'source_incomplete',
  'figures_omitted_by_transcription',
]);

/** The customer-facing line for a withheld method, by the engine's reason code:
 * "Source information incomplete" ONLY where the source genuinely lacks the
 * information; a method the source fully describes but that cannot be applied
 * mechanically says so instead. */
export function noticeForReasonCode(code: string | null | undefined): string {
  if (!code || SOURCE_LACKS.has(code)) return SOURCE_INCOMPLETE_NOTICE;
  return AUTOMATIC_READING_UNAVAILABLE_NOTICE;
}

/** A withheld method's note as a customer sees it. The stored note explains the
 * decision in development terms; the customer gets the neutral line. */
export function customerReviewNote(note: string | null, code?: string | null): string | null {
  return note ? noticeForReasonCode(code) : note;
}

interface MethodRowLike {
  reviewNote: string | null;
  sourceQuote: string;
}

/** Make a reading's method row customer-safe. Generic so it can be applied to
 * the engine's row without this module depending on the engine's types. */
export function customerSafeRow<T extends MethodRowLike>(row: T, code?: string | null): T {
  return { ...row, reviewNote: customerReviewNote(row.reviewNote, code), sourceQuote: cleanSourceText(row.sourceQuote).text };
}

/** Rewrite the engine's full interpretation sentence, which embeds a single
 * withheld method's note in parentheses. `pairs` are [storedNote, customerNotice]. */
export function customerSafeInterpretation(text: string, pairs: [string | null, string][]): string {
  let out = text;
  for (const [note, notice] of pairs) if (note) out = out.split(`(${note})`).join(`(${notice})`);
  return out.split('(not yet verified)').join(`(${SOURCE_INCOMPLETE_NOTICE})`);
}
