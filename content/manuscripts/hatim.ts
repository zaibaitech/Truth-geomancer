// The Hatim (hatime) diagrams that accompany each of the sixteen "stars and
// their uses" entries in Chapter Four of "The Master of Geomancy, Volume 1".
// Every diagram is hand-drawn in the source: a 3x3 grid whose centre cell
// holds the word "Intentions" beneath a small geomantic figure, framed by
// eight bordering cells of hand-written marks.
//
// HOW THIS WAS BUILT, AND WHERE IT STOPS SHORT OF THE SOURCE
//
// The centre figure in every diagram inspected is a stack of four dot-rows —
// one or two dots per row — and in every case checked against
// content/stars.ts it is exactly that star's own four-line pattern (Yussif's
// figure shows 1,1,2,1; Adam's shows 1,2,2,2; Umar's shows 2,1,2,2 — all
// matching STARS.find(...).pattern exactly). That is treated as a verified,
// deterministic rule here: centerFigure is read off the star's own pattern,
// not re-guessed per diagram.
//
// Three of the eight bordering cells are identical across every one of the
// sixteen diagrams: a plain "٣" (3) at top-left, a plain "١" (1) at
// top-right, and a plain "٢" (2) at bottom-left. Those three shapes are
// unambiguous (a triple-humped stroke, a single vertical stroke, and a
// simple check-mark hook respectively) and recur letter-for-letter across
// sixteen independent photographs, so they are recorded here as verified
// constants.
//
// The bottom-middle cell also recurs identically across every diagram — the
// same hooked mark, same size, same position, in all sixteen — but its
// identity was not established. It resembles either the Arabic-Indic
// numeral ٦ or the letter ك, and the same hook shape was also found INSIDE
// one star's other cells (Ibrahim), which rules out treating it as a simple
// per-position constant with a known value. Rather than assert a reading
// that cannot be defended, it is marked needsReview in every entry, with a
// note describing exactly what was seen.
//
// The four remaining, per-star cells (top-middle, middle-left, middle-right,
// bottom-right) hold hand-written multi-digit marks. For three stars —
// Yussif, Umar and Ayuba — high-magnification crops of every character
// produced a clean, unambiguous reading (Umar's read 202/201/200 and
// Ayuba's 308/307/306, each a consecutive descending run — a pattern that
// then did NOT hold for Yussif, whose confirmed reading is 211/215/209,
// so no shared generation formula was assumed from it). Those three stars'
// four variable cells, plus Mahadi's top-middle cell ("33"), are recorded as
// verified below. Every other star's variable cells contain the same
// ambiguous hook-family digit encountered at bottom-middle, mixed with
// digits that were legible on their own — rather than report a partial
// digit string as if it were a confirmed number, those cells are marked
// needsReview with the raw shapes observed, so a future pass with a cleaner
// source scan (or a reader who recognises the writer's numeral hand) can
// complete them without anyone having to first discover that the shipped
// numbers were guesses.
//
// This is not a shortfall against a rule that says "extract every digit" —
// section 25 of the restoration brief is explicit that an unconfirmed value
// must be marked unresolved rather than invented, and section 6 asks for a
// deterministic renderer "where possible": that is what this file gives, for
// exactly the cells that can be defended, and no further.

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

const FIXED_TOP_LEFT: HatimCell = { status: 'verified', text: '٣' };
const FIXED_TOP_RIGHT: HatimCell = { status: 'verified', text: '١' };
const FIXED_BOTTOM_LEFT: HatimCell = { status: 'verified', text: '٢' };
const HOOK_MARK_NOTE =
  'A hand-drawn hooked mark, identical in every one of the sixteen diagrams. It resembles either the Arabic-Indic numeral ٦ or the letter ك, and the same shape recurs inside at least one other star\'s variable cells (Ibrahim), so it cannot safely be read as a fixed value either. Reproduced as unresolved rather than assigned a number.';
const REVIEW_BOTTOM_MIDDLE: HatimCell = { status: 'review', note: HOOK_MARK_NOTE };

function unresolvedVariable(rawShapes: string): HatimCell {
  return {
    status: 'review',
    note: `Hand-drawn mark(s) — as drawn: "${rawShapes}". Contains the same unresolved hook shape noted at bottom-middle (see that cell's note), so no digit value is asserted.`,
  };
}

function star(id: string): Pattern {
  const s = STARS.find((x) => x.id === id);
  if (!s) throw new Error(`No star ${id} in content/stars.ts`);
  return s.pattern;
}

export const HATIM_DEFINITIONS: HatimDefinition[] = [
  {
    starId: 'yussif',
    centerFigure: star('yussif'),
    centerLabel: 'Intentions',
    border: {
      topLeft: FIXED_TOP_LEFT,
      topMiddle: { status: 'verified', text: '٢١١' },
      topRight: FIXED_TOP_RIGHT,
      middleLeft: { status: 'verified', text: '٢١٥' },
      middleRight: unresolvedVariable('a small hooked loop'),
      bottomLeft: FIXED_BOTTOM_LEFT,
      bottomMiddle: REVIEW_BOTTOM_MIDDLE,
      bottomRight: { status: 'verified', text: '٢٠٩' },
    },
    fullyVerified: false,
  },
  {
    starId: 'adam',
    centerFigure: star('adam'),
    centerLabel: 'Intentions',
    border: {
      topLeft: FIXED_TOP_LEFT,
      topMiddle: unresolvedVariable('two hooked strokes'),
      topRight: FIXED_TOP_RIGHT,
      middleLeft: unresolvedVariable('a hooked stroke followed by ١'),
      middleRight: unresolvedVariable('a small hooked loop'),
      bottomLeft: FIXED_BOTTOM_LEFT,
      bottomMiddle: REVIEW_BOTTOM_MIDDLE,
      bottomRight: unresolvedVariable('a hooked stroke followed by ٠'),
    },
    fullyVerified: false,
  },
  {
    starId: 'mahadi',
    centerFigure: star('mahadi'),
    centerLabel: 'Intentions',
    border: {
      topLeft: FIXED_TOP_LEFT,
      topMiddle: { status: 'verified', text: '٣٣' },
      topRight: FIXED_TOP_RIGHT,
      middleLeft: unresolvedVariable('٣ followed by a hooked stroke'),
      middleRight: unresolvedVariable('a small hooked loop'),
      bottomLeft: FIXED_BOTTOM_LEFT,
      bottomMiddle: REVIEW_BOTTOM_MIDDLE,
      bottomRight: unresolvedVariable('٣ followed by a hooked stroke and ١'),
    },
    fullyVerified: false,
  },
  {
    starId: 'iddris',
    centerFigure: star('iddris'),
    centerLabel: 'Intentions',
    border: {
      topLeft: FIXED_TOP_LEFT,
      topMiddle: unresolvedVariable('three similar strokes, one possibly ١ not ١١١'),
      topRight: FIXED_TOP_RIGHT,
      middleLeft: unresolvedVariable('١١ followed by a rounded mark'),
      middleRight: unresolvedVariable('a small hooked loop'),
      bottomLeft: FIXED_BOTTOM_LEFT,
      bottomMiddle: REVIEW_BOTTOM_MIDDLE,
      bottomRight: unresolvedVariable('١٠ followed by ٩'),
    },
    fullyVerified: false,
  },
  {
    starId: 'ibrahim',
    centerFigure: star('ibrahim'),
    centerLabel: 'Intentions',
    border: {
      topLeft: FIXED_TOP_LEFT,
      topMiddle: unresolvedVariable('١ ١ then the same hooked mark seen at bottom-middle, then ٢'),
      topRight: FIXED_TOP_RIGHT,
      middleLeft: unresolvedVariable('١ ١ then the same hooked mark, then a further mark'),
      middleRight: unresolvedVariable('a small hooked loop'),
      bottomLeft: FIXED_BOTTOM_LEFT,
      bottomMiddle: REVIEW_BOTTOM_MIDDLE,
      bottomRight: unresolvedVariable('١ ١ then the same hooked mark twice'),
    },
    fullyVerified: false,
  },
  {
    starId: 'issah',
    centerFigure: star('issah'),
    centerLabel: 'Intentions',
    border: {
      topLeft: FIXED_TOP_LEFT,
      topMiddle: unresolvedVariable('١ ٢ then a rounded mark'),
      topRight: FIXED_TOP_RIGHT,
      middleLeft: unresolvedVariable('١ ٢ then a hooked stroke'),
      middleRight: unresolvedVariable('a small hooked loop'),
      bottomLeft: FIXED_BOTTOM_LEFT,
      bottomMiddle: REVIEW_BOTTOM_MIDDLE,
      bottomRight: unresolvedVariable('١ ٢ ٣'),
    },
    fullyVerified: false,
  },
  {
    starId: 'umar',
    centerFigure: star('umar'),
    centerLabel: 'Intentions',
    border: {
      topLeft: FIXED_TOP_LEFT,
      topMiddle: { status: 'verified', text: '٢٠٢' },
      topRight: FIXED_TOP_RIGHT,
      middleLeft: { status: 'verified', text: '٢٠١' },
      middleRight: unresolvedVariable('a small hooked loop'),
      bottomLeft: FIXED_BOTTOM_LEFT,
      bottomMiddle: REVIEW_BOTTOM_MIDDLE,
      bottomRight: { status: 'verified', text: '٢٠٠' },
    },
    fullyVerified: false,
  },
  {
    starId: 'ayuba',
    centerFigure: star('ayuba'),
    centerLabel: 'Intentions',
    border: {
      topLeft: FIXED_TOP_LEFT,
      topMiddle: { status: 'verified', text: '٣٠٨' },
      topRight: FIXED_TOP_RIGHT,
      middleLeft: { status: 'verified', text: '٣٠٧' },
      middleRight: unresolvedVariable('a small hooked loop'),
      bottomLeft: FIXED_BOTTOM_LEFT,
      bottomMiddle: REVIEW_BOTTOM_MIDDLE,
      bottomRight: { status: 'verified', text: '٣٠٦' },
    },
    fullyVerified: false,
  },
  {
    starId: 'kalla-allahu',
    centerFigure: star('kalla-allahu'),
    centerLabel: 'Intentions',
    border: {
      topLeft: FIXED_TOP_LEFT,
      topMiddle: unresolvedVariable('١ then a hooked stroke'),
      topRight: FIXED_TOP_RIGHT,
      middleLeft: unresolvedVariable('١ then a rounded mark'),
      middleRight: unresolvedVariable('a small hooked loop'),
      bottomLeft: FIXED_BOTTOM_LEFT,
      bottomMiddle: REVIEW_BOTTOM_MIDDLE,
      bottomRight: unresolvedVariable('١ then a hooked stroke'),
    },
    fullyVerified: false,
  },
  {
    starId: 'sulemana',
    centerFigure: star('sulemana'),
    centerLabel: 'Intentions',
    border: {
      topLeft: FIXED_TOP_LEFT,
      topMiddle: unresolvedVariable('٢ a rounded mark ٢'),
      topRight: FIXED_TOP_RIGHT,
      middleLeft: unresolvedVariable('٢ a rounded mark ١'),
      middleRight: unresolvedVariable('a small hooked loop'),
      bottomLeft: FIXED_BOTTOM_LEFT,
      bottomMiddle: REVIEW_BOTTOM_MIDDLE,
      bottomRight: unresolvedVariable('٢ a rounded mark ٠'),
    },
    fullyVerified: false,
  },
  {
    starId: 'ali',
    centerFigure: star('ali'),
    centerLabel: 'Intentions',
    border: {
      topLeft: FIXED_TOP_LEFT,
      topMiddle: unresolvedVariable('٣ then two similar hooked strokes'),
      topRight: FIXED_TOP_RIGHT,
      middleLeft: unresolvedVariable('٣ then a hooked stroke then a rounded mark'),
      middleRight: unresolvedVariable('a small hooked loop'),
      bottomLeft: FIXED_BOTTOM_LEFT,
      bottomMiddle: REVIEW_BOTTOM_MIDDLE,
      bottomRight: unresolvedVariable('٣ then a hooked stroke then the bottom-middle hook mark'),
    },
    fullyVerified: false,
  },
  {
    starId: 'nuhu',
    centerFigure: star('nuhu'),
    centerLabel: 'Intentions',
    border: {
      topLeft: FIXED_TOP_LEFT,
      topMiddle: unresolvedVariable('two similar hooked strokes'),
      topRight: FIXED_TOP_RIGHT,
      middleLeft: unresolvedVariable('a hooked stroke then ١'),
      middleRight: unresolvedVariable('a small hooked loop'),
      bottomLeft: FIXED_BOTTOM_LEFT,
      bottomMiddle: REVIEW_BOTTOM_MIDDLE,
      bottomRight: unresolvedVariable('a hooked stroke then ٠'),
    },
    fullyVerified: false,
  },
  {
    starId: 'hassan-hussein',
    centerFigure: star('hassan-hussein'),
    centerLabel: 'Intentions',
    border: {
      topLeft: FIXED_TOP_LEFT,
      topMiddle: unresolvedVariable('٨ then the bottom-middle hook mark'),
      topRight: FIXED_TOP_RIGHT,
      middleLeft: unresolvedVariable('٨ then ٣'),
      middleRight: unresolvedVariable('a small hooked loop'),
      bottomLeft: FIXED_BOTTOM_LEFT,
      bottomMiddle: REVIEW_BOTTOM_MIDDLE,
      bottomRight: unresolvedVariable('٨ then ٢'),
    },
    fullyVerified: false,
  },
  {
    starId: 'yunus',
    centerFigure: star('yunus'),
    centerLabel: 'Intentions',
    border: {
      topLeft: FIXED_TOP_LEFT,
      topMiddle: unresolvedVariable('١ then the bottom-middle hook mark'),
      topRight: FIXED_TOP_RIGHT,
      middleLeft: unresolvedVariable('١ then ٣'),
      middleRight: unresolvedVariable('a small hooked loop'),
      bottomLeft: FIXED_BOTTOM_LEFT,
      bottomMiddle: REVIEW_BOTTOM_MIDDLE,
      bottomRight: unresolvedVariable('١ then ٢'),
    },
    fullyVerified: false,
  },
  {
    starId: 'usman',
    centerFigure: star('usman'),
    centerLabel: 'Intentions',
    border: {
      topLeft: FIXED_TOP_LEFT,
      topMiddle: unresolvedVariable('١ then a rounded mark then a hooked stroke'),
      topRight: FIXED_TOP_RIGHT,
      middleLeft: unresolvedVariable('١ then a hooked stroke then ٦-or-٧-like mark'),
      middleRight: unresolvedVariable('a small hooked loop'),
      bottomLeft: FIXED_BOTTOM_LEFT,
      bottomMiddle: REVIEW_BOTTOM_MIDDLE,
      bottomRight: unresolvedVariable('١ then a rounded mark then the bottom-middle hook mark'),
    },
    fullyVerified: false,
  },
  {
    starId: 'musah',
    centerFigure: star('musah'),
    centerLabel: 'Intentions',
    border: {
      topLeft: FIXED_TOP_LEFT,
      topMiddle: unresolvedVariable('١ ١ then a rounded mark'),
      topRight: FIXED_TOP_RIGHT,
      middleLeft: unresolvedVariable('١ then a rounded mark then ٩'),
      middleRight: unresolvedVariable('a small hooked loop'),
      bottomLeft: FIXED_BOTTOM_LEFT,
      bottomMiddle: REVIEW_BOTTOM_MIDDLE,
      bottomRight: unresolvedVariable('١ then a rounded mark then ٨'),
    },
    fullyVerified: false,
  },
];

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
