// Presentation-layer note for a star's Divine Name recitation count, shown
// to ordinary readers of the "stars and their uses" chapter. This is
// deliberately the ONLY thing the reader sees about the invocation's
// numeric value: the manuscript's own stated count, with a plain caption.
//
// It takes ONLY that count as input -- never the Abjad computation, never
// the Hatim N-4/N-5/N-6 diagnostic -- so it is structurally incapable of
// producing a "source value != computed Abjad" warning or exposing the
// development-time reconciliation commentary those separate modules exist
// to record. abjad.ts, hatimPattern.ts and valueReconciliation.ts are
// unmodified and still hold that diagnostic data for developers/source
// auditors; this file never imports or reads any of them.

export interface DivineNameSourceLine {
  hasSourceValue: boolean;
  sourceValue: number | null;
  caption: string;
}

const NOT_SPECIFIED_CAPTION =
  "Source value not specified in the available manuscript material.";
const STATED_COUNT_CAPTION = "Manuscript-stated recitation count.";

/** Display logic (source-reconciliation cleanup): if a manuscript-stated
 * recitation count exists, show it plainly; otherwise say so plainly. Never
 * compares against a computed value, and never warns merely because one
 * exists. */
export function divineNameSourceLine(
  invocation: { count: number } | null,
): DivineNameSourceLine {
  if (invocation === null) {
    return {
      hasSourceValue: false,
      sourceValue: null,
      caption: NOT_SPECIFIED_CAPTION,
    };
  }
  return {
    hasSourceValue: true,
    sourceValue: invocation.count,
    caption: STATED_COUNT_CAPTION,
  };
}
