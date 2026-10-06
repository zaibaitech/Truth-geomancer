// INTERPRETATION BASIS — what a method actually reads off its resulting figure.
//
// A figure has several independent attributes (its good/middle-good/bad star
// quality, its element, its up/down direction). A given method rests its
// answer on ONE of them — or on its own explicit rule — and never on "the
// figure is bad, therefore the result is bad". Showing every attribute side by
// side as if each were a verdict made a result look contradictory (a "Bad"
// figure beside a favourable element result). The basis says which attribute
// is the one the method used, so the UI can show only that as the deciding
// factor and the rest as plain figure facts.
//
//   star_quality     the method asks whether the figure is good / middle-good /
//                    bad (optionally refined by upward/downward).
//   element          the method reads the figure's element, or an element's
//                    line state (opened/closed), or an element tally.
//   source_specific  the method applies its own explicit rule — a named figure,
//                    a list of figures, found-in-chart, up/down on its own,
//                    counts, positions — that is neither of the above.
//
// This is a LABEL on how a method already behaves. It changes no outcome, and
// it is not a scoring rule: in particular there is NO universal element
// ranking (different methods in the sources treat the same element in
// opposite ways). Pure and client-safe: no server imports.

export type InterpretationBasis = 'star_quality' | 'element' | 'source_specific';

export const INTERPRETATION_BASES: readonly InterpretationBasis[] = ['star_quality', 'element', 'source_specific'];

export const BASIS_LABEL: Record<InterpretationBasis, string> = {
  star_quality: 'Star quality',
  element: 'Element',
  source_specific: 'Method’s own rule',
};

/** The figure facts a UI may show, already as display text (null = unknown). */
export interface FigureFacts {
  fortune: string | null;
  direction: string | null;
  element: string | null;
}

export interface FigureAttributeDisplay {
  /** "Star quality" / "Element" / "Method’s own rule"; null when the basis is
   * unknown (legacy data), in which case every fact is shown as before. */
  basisLabel: string | null;
  /** The attribute(s) the method actually used — shown emphasised. */
  deciding: string[];
  /** Other facts about the figure — shown plainly, never as a verdict. */
  other: string[];
}

const compact = (values: Array<string | null>): string[] => values.filter((v): v is string => Boolean(v));

/**
 * Which figure facts are the deciding ones for a basis, and which are just
 * context. The classical good/bad word is shown ONLY when the method is a
 * star-quality method: for an element or own-rule method it is irrelevant to
 * the answer, and showing it next to the result is exactly what read as a
 * contradiction.
 */
export function describeFigureAttributes(basis: InterpretationBasis | null | undefined, facts: FigureFacts): FigureAttributeDisplay {
  switch (basis) {
    case 'star_quality':
      return { basisLabel: BASIS_LABEL.star_quality, deciding: compact([facts.fortune]), other: compact([facts.direction, facts.element]) };
    case 'element':
      return { basisLabel: BASIS_LABEL.element, deciding: compact([facts.element]), other: compact([facts.direction]) };
    case 'source_specific':
      return { basisLabel: BASIS_LABEL.source_specific, deciding: [], other: compact([facts.element, facts.direction]) };
    default:
      // Basis unknown: keep the long-standing display (all facts), unlabelled.
      return { basisLabel: null, deciding: [], other: compact([facts.fortune, facts.direction, facts.element]) };
  }
}
