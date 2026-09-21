// Chapter 151 of Kanzul Mikban, "Dreams and Their Interpretations"
// (manuscript pages 112-116), teaches sixteen dream meanings, each keyed
// to a small four-row geomantic figure printed after that entry's own
// "If it's" / "If it's:". The app's chapter text (content/manuscripts/
// kanzul-mikban.ts) reproduces the prose exactly, but those sixteen
// figures are drawn as small embedded raster images in the source PDF,
// not as extractable text — the PDF's own text layer drops them
// entirely, which is why the rendered chapter showed "If it's," with
// nothing between the words and the comma. This file restores them.
//
// HOW EACH FIGURE WAS IDENTIFIED
//
// Each of the sixteen embedded images was located by its own exact
// bounding box in the source PDF (via each entry's image placement
// rectangle, not by guessing screen position or assuming any order), then
// rendered at high resolution and read as a four-row dot pattern. The
// pixel-level read was cross-checked programmatically (connected-component
// blob detection clustered into rows) rather than by eye alone, so every
// entry below is a confirmed pattern, not a guess. Every resulting
// four-row pattern was then matched against the existing, already-
// canonical STARS array in content/stars.ts by exact pattern equality —
// this file defines no figure of its own, only a name for the row-count
// pattern already extracted, and a lookup into STARS for its drawing data.
//
// CHAPTER 151 FIGURE MAPPING (manuscript pages 112-116)
//
// #1  -> Yussif            [1,1,2,1]   page 112
// #2  -> Adam               [1,2,2,2]  page 112
// #3  -> Mahadi             [2,1,1,1]  page 113
// #4  -> Yussif             [1,1,2,1]  page 113
// #5  -> Ibrahim            [1,1,1,1]  page 113
// #6  -> Issah              [1,2,1,2]  page 113
// #7  -> Iddris             [2,2,1,2]  page 114
// #8  -> Ayuba              [2,2,2,1]  page 114
// #9  -> Kalla Allahu       [1,1,2,2]  page 114
// #10 -> Sulemana           [1,2,2,1]  page 114
// #11 -> Ali                [2,1,1,2]  page 115
// #12 -> Nuhu               [2,2,1,1]  page 115
// #13 -> Hassan & Hussein   [1,1,1,2]  page 115
// #14 -> Yunus              [1,2,1,1]  page 115
// #15 -> Usman              [2,1,2,1]  page 116
// #16 -> Musah              [2,2,2,2]  page 116
//
// Two things about this mapping are source characteristics, not
// transcription errors, and are called out explicitly rather than quietly
// "fixed": #1 and #4 print the identical figure (Yussif, [1,1,2,1]) — the
// pixel read for #4 was independently re-verified (both by eye and by the
// same blob-detection method) and is not a misread of #1's figure bleeding
// into the wrong entry. Correspondingly, Umar's figure ([2,1,2,2]) does not
// appear anywhere among these sixteen entries — the source's sixteen
// dream-figures are not a one-to-one relabelling of the sixteen Bazdaaho
// stars, and none is invented here to force that shape.

import { STARS, type Pattern } from "@/content/stars";

export interface DreamInterpretationFigure {
  /** The source's own interpretation number, 1-16. */
  number: number;
  /** content/stars.ts id for the star whose figure this entry prints. */
  starId: string;
}

export const DREAM_INTERPRETATION_FIGURES: DreamInterpretationFigure[] = [
  { number: 1, starId: "yussif" },
  { number: 2, starId: "adam" },
  { number: 3, starId: "mahadi" },
  { number: 4, starId: "yussif" },
  { number: 5, starId: "ibrahim" },
  { number: 6, starId: "issah" },
  { number: 7, starId: "iddris" },
  { number: 8, starId: "ayuba" },
  { number: 9, starId: "kalla-allahu" },
  { number: 10, starId: "sulemana" },
  { number: 11, starId: "ali" },
  { number: 12, starId: "nuhu" },
  { number: 13, starId: "hassan-hussein" },
  { number: 14, starId: "yunus" },
  { number: 15, starId: "usman" },
  { number: 16, starId: "musah" },
];

function findEntry(number: number): DreamInterpretationFigure {
  const entry = DREAM_INTERPRETATION_FIGURES.find((f) => f.number === number);
  if (!entry) {
    throw new Error(
      `No Chapter 151 figure mapping for interpretation #${number}`,
    );
  }
  return entry;
}

/** The star id Chapter 151's interpretation #`number` prints its figure
 * for — internal/source metadata only (used for accessibility labelling
 * and this file's own regression tests), never shown as visible text in
 * the chapter itself. */
export function getDreamInterpretationStarId(number: number): string {
  return findEntry(number).starId;
}

/** The already-canonical STARS pattern for interpretation #`number`'s
 * figure — looked up, never recomputed or redefined here. */
export function getDreamInterpretationPattern(number: number): Pattern {
  const { starId } = findEntry(number);
  const star = STARS.find((s) => s.id === starId);
  if (!star) throw new Error(`No star ${starId} in content/stars.ts`);
  return star.pattern;
}

/** Given a four-row figure, the interpretation number(s) whose printed
 * figure matches it exactly — the "match it against the 16 source
 * figures" half of the chapter's own method. The pairing that produces
 * that figure from four Umuhat is implemented in
 * lib/raml/engine/questions/dreamsAndInterpretations.ts (author-clarified
 * procedure, not manuscript text). Usually a single entry; entries #1 and
 * #4 share the Yussif pattern, so a pattern match against that figure
 * returns both. */
export function findDreamInterpretationsByPattern(pattern: Pattern): number[] {
  return DREAM_INTERPRETATION_FIGURES.filter((entry) => {
    const star = STARS.find((s) => s.id === entry.starId);
    return star !== undefined && star.pattern.every((row, i) => row === pattern[i]);
  }).map((entry) => entry.number);
}

// ----------------------------------------------------------------------
// Splitting the chapter's own paragraph text around each "If it's" marker
// so a figure can be inserted exactly where the source places it, without
// rewriting a single word of content/manuscripts/kanzul-mikban.ts's own
// paragraphs. This is pure text-splitting on the paragraph strings that
// already exist there — no wording is added, removed, or reworded.

export interface DreamInterpretationItem {
  /** The source's own interpretation number, read off its own marker. */
  number: number;
  /** The exact original substring "N. If it's" or "N. If it's:" — printed
   * as-is, immediately followed by the figure. */
  markerText: string;
  /** Everything from immediately after markerText up to (not including)
   * the next marker, or the end of the paragraph — starts with the
   * source's own comma, e.g. ", it means enmity but long life. ..." */
  rest: string;
}

export interface ParsedDreamParagraph {
  /** Any text before the first marker in this paragraph (e.g. the
   * chapter's own intro sentence in its first paragraph) — '' if the
   * paragraph starts directly at a marker. */
  lead: string;
  items: DreamInterpretationItem[];
}

const MARKER_RE = /(\d+)\.\s+If it's:?/g;

/** Splits one of Chapter 151's existing paragraph strings at each of its
 * own "N. If it's[:]" markers. Every character of the input is accounted
 * for across `lead` and the items' `markerText` + `rest` — nothing is
 * dropped, added, or reworded, only located. */
export function parseDreamParagraph(paragraph: string): ParsedDreamParagraph {
  const matches = Array.from(paragraph.matchAll(MARKER_RE));
  if (matches.length === 0) return { lead: paragraph, items: [] };

  const firstIndex = matches[0].index ?? 0;
  const lead = paragraph.slice(0, firstIndex).trim();

  const items: DreamInterpretationItem[] = matches.map((m, i) => {
    const start = m.index ?? 0;
    const markerEnd = start + m[0].length;
    const nextStart =
      i + 1 < matches.length
        ? (matches[i + 1].index ?? paragraph.length)
        : paragraph.length;
    return {
      number: Number(m[1]),
      markerText: m[0],
      rest: paragraph.slice(markerEnd, nextStart).trim(),
    };
  });

  return { lead, items };
}
