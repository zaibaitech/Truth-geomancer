// The Hatim (hatime) diagrams that accompany each of the sixteen "stars and
// their uses" entries in Chapter Four of "The Master of Geomancy, Volume 1".
// Every diagram is hand-drawn in the source: a 3x3 grid whose centre cell
// holds the word "Intentions" beneath a small geomantic figure, framed by
// eight bordering cells of hand-written marks.
//
// PROVENANCE OF THE BORDER VALUES
//
// The centre figure in every diagram is that star's own four-line pattern
// from content/stars.ts (verified by dot-count under magnification for
// Yussif, Adam and Umar in an earlier pass) — centerFigure is read off the
// star's own pattern, not re-guessed per diagram.
//
// Three bordering cells are identical across all sixteen diagrams and were
// verified first: top-left "٣" (3), top-right "١" (1), bottom-left "٢" (2).
// Four stars' variable cells (Yussif, Umar, Ayuba's topMiddle/middleLeft/
// bottomRight, plus Mahadi's topMiddle) were confirmed by high-magnification
// photo crops in an earlier pass. Every remaining border cell — including
// middleRight and bottomMiddle for all sixteen stars, which had previously
// resisted confident reading — was supplied directly by a manuscript reader
// who checked the original source (Prompt 23) and is recorded here exactly
// as given, with no recalculation, no Abjad substitution, and no smoothing
// of values that look numerically irregular (Ibrahim's 142/145/144, Ali's
// 322/325/324 and Usman's 108/102/105 do not fit a simple N-4/N-5/N-6
// descent, and are kept exactly as supplied). The N-4/N-5/N-6 relationship
// observed in some stars (see hatimPattern.ts) is a diagnostic check only —
// it is never used to generate or overwrite a stored value.

import { STARS, type Pattern } from '@/content/stars';

export type HatimCell =
  | { status: 'verified'; text: string }
  | { status: 'review'; note: string };

export interface HatimBorder {
  topLeft: HatimCell;
  topMiddle: HatimCell;
  topRight: HatimCell;
  middleLeft: HatimCell;
  middleRight: HatimCell;
  bottomLeft: HatimCell;
  bottomMiddle: HatimCell;
  bottomRight: HatimCell;
}

export interface HatimDefinition {
  starId: string;
  /** The star's own 4-line pattern, reused as the diagram's centre figure —
   * see the file header for why this is treated as a verified rule rather
   * than a per-diagram guess. */
  centerFigure: Pattern;
  centerLabel: 'Intentions';
  border: HatimBorder;
  /** True only when every one of the eight bordering cells is verified. */
  fullyVerified: boolean;
}

const ARABIC_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** Converts the manuscript's own Western/Maghrebi-tradition Arabic-Indic
 * numeral glyphs (٠-٩) to Latin digits, for the reader's optional "Latin"
 * or "Arabic + Latin" display mode (section 7). Non-digit characters (e.g.
 * a verified cell's text is always pure digits here) pass through
 * unchanged. This never replaces the stored glyph — see HatimDiagram.tsx,
 * which renders this alongside, not instead of, hatim.ts's own text. */
export function arabicIndicToLatin(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC_DIGITS.indexOf(d)));
}

function latinToArabicIndic(n: number): string {
  return String(n).replace(/\d/g, (d) => ARABIC_INDIC_DIGITS[Number(d)]);
}

/** A source-supplied numeric cell (section-9 explicit value, never a
 * formula output) — stored in the manuscript's own Arabic-Indic numerals. */
function verifiedNumber(n: number): HatimCell {
  return { status: 'verified', text: latinToArabicIndic(n) };
}

const FIXED_TOP_LEFT: HatimCell = verifiedNumber(3);
const FIXED_TOP_RIGHT: HatimCell = verifiedNumber(1);
const FIXED_BOTTOM_LEFT: HatimCell = verifiedNumber(2);
/** middleRight and bottomMiddle are the same two digits (5 and 4) across all
 * sixteen diagrams — supplied by the manuscript reader in Prompt 23 along
 * with every other previously-"under review" cell. */
const FIXED_MIDDLE_RIGHT: HatimCell = verifiedNumber(5);
const FIXED_BOTTOM_MIDDLE: HatimCell = verifiedNumber(4);

function star(id: string): Pattern {
  const s = STARS.find((x) => x.id === id);
  if (!s) throw new Error(`No star ${id} in content/stars.ts`);
  return s.pattern;
}

interface RawHatim {
  starId: string;
  /** [topMiddle, middleLeft, bottomRight] — the three per-star variable
   * cells, exactly as supplied by the manuscript reader (Prompt 23). Kept
   * as plain numbers here only so the table below reads compactly; every
   * value below is stored explicitly, never computed from another. */
  variable: [number, number, number];
}

// Every number below is an explicit source value supplied directly by a
// manuscript reader (Prompt 23) or, for Yussif/Umar/Ayuba/Mahadi's already-
// listed cells, confirmed in an earlier high-magnification pass. None is
// derived from another star, from Abjad, or from the N-4/N-5/N-6 pattern —
// see hatimPattern.ts, which tests that pattern against these values as a
// diagnostic and confirms it does NOT hold universally (Ibrahim
// 142/145/144, Ali 322/325/324 and Usman 108/102/105 do not fit a simple
// descent, and are kept exactly as supplied regardless).
const RAW_HATIMS: RawHatim[] = [
  { starId: 'yussif', variable: [211, 215, 209] },
  { starId: 'adam', variable: [62, 61, 60] }, // corrected from an initial 22/21/20 after a second manuscript check
  { starId: 'mahadi', variable: [33, 32, 31] },
  { starId: 'iddris', variable: [111, 110, 109] },
  { starId: 'ibrahim', variable: [142, 145, 144] },
  { starId: 'issah', variable: [125, 124, 123] },
  { starId: 'umar', variable: [202, 201, 200] },
  { starId: 'ayuba', variable: [308, 307, 306] },
  { starId: 'kalla-allahu', variable: [12, 15, 14] },
  { starId: 'sulemana', variable: [252, 251, 250] },
  { starId: 'ali', variable: [322, 325, 324] },
  { starId: 'nuhu', variable: [22, 21, 20] },
  { starId: 'hassan-hussein', variable: [84, 83, 82] },
  { starId: 'yunus', variable: [14, 13, 12] },
  { starId: 'usman', variable: [108, 102, 105] },
  { starId: 'musah', variable: [110, 109, 108] },
];

export const HATIM_DEFINITIONS: HatimDefinition[] = RAW_HATIMS.map(({ starId, variable }) => {
  const [topMiddle, middleLeft, bottomRight] = variable;
  const border: HatimBorder = {
    topLeft: FIXED_TOP_LEFT,
    topMiddle: verifiedNumber(topMiddle),
    topRight: FIXED_TOP_RIGHT,
    middleLeft: verifiedNumber(middleLeft),
    middleRight: FIXED_MIDDLE_RIGHT,
    bottomLeft: FIXED_BOTTOM_LEFT,
    bottomMiddle: FIXED_BOTTOM_MIDDLE,
    bottomRight: verifiedNumber(bottomRight),
  };
  return {
    starId,
    centerFigure: star(starId),
    centerLabel: 'Intentions',
    border,
    fullyVerified: Object.values(border).every((c) => c.status === 'verified'),
  };
});

export function getHatimByStarId(starId: string): HatimDefinition | undefined {
  return HATIM_DEFINITIONS.find((h) => h.starId === starId);
}

/** For a quick coverage tally: how many of the eight bordering cells across
 * all sixteen diagrams are verified vs. left for review. */
export function hatimCoverageTally(): { verifiedCells: number; reviewCells: number; totalCells: number } {
  let verifiedCells = 0;
  let reviewCells = 0;
  for (const def of HATIM_DEFINITIONS) {
    for (const cell of Object.values(def.border)) {
      if (cell.status === 'verified') verifiedCells += 1;
      else reviewCells += 1;
    }
  }
  return { verifiedCells, reviewCells, totalCells: verifiedCells + reviewCells };
}
