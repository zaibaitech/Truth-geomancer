// "Reading the Gift/Visitor Figures" — the continuation of Kanzul Mikban
// Chapter 28 ("If You Will Get Money or Good Strangers That Same Day or
// Not") stored as two separate transcription entries, "continued-from-
// chapter-twenty-eight" and "reading-the-gift-visitor-figures-end-of-
// chapter" (lib/server/content/kanzulMikban.ts). Both entries' prose was
// already fully transcribed — every "If you get..." sentence is present —
// but the small four-row figure each sentence names ("If you get: [figure],
// it means...") was never recovered: the transcription's own bracketed note
// says so at every occurrence.
//
// HOW THIS FILE'S EIGHT FIGURES WERE VERIFIED
//
// This restoration was requested with eight ordered four-row patterns
// supplied directly by the product owner (from newly located manuscript
// photographs this session could not itself view — no image file for them
// was reachable in this environment; see the accompanying audit report).
// Because this project never accepts a figure claim on say-so alone, the
// patterns were checked two ways before being accepted here rather than
// by inspecting the photograph pixel-by-pixel as content/manuscripts/
// dreamInterpretations.ts's Chapter 151 restoration could:
//
//   1. Uniqueness and exactness — each of the eight patterns was checked
//      against the existing, already-canonical STARS array in content/
//      stars.ts for an EXACT match (no rotation, inversion, or other
//      transform applied to make a match work). All eight matched a
//      distinct star with no collisions.
//   2. Count and order — the two source paragraphs above contain exactly
//      eight unmarked "If you get..." placeholders, in a fixed reading
//      order (five in the first paragraph of "continued-from-chapter-
//      twenty-eight", one more in its second paragraph — split across the
//      manuscript's own page break — then two in "reading-the-gift-
//      visitor-figures-end-of-chapter"). Eight patterns supplied, in a
//      fixed order, for eight placeholders in a fixed order, is exactly
//      the shape source restoration should take.
//
// Both checks passed cleanly, which is real corroborating evidence — but
// it is NOT the same as this project independently reading the manuscript
// photograph itself, which is how every other figure restoration in this
// codebase (Chapter 151, the Chapter 1/Cancelling/Bazdaaho diagrams) was
// actually done. That distinction is recorded here rather than glossed
// over. Two wording points from the same newly-supplied evidence could
// NOT be corroborated this way and are deliberately left unresolved — see
// lib/raml/engine/questions/giftVisitorFigures.ts's own header comment.
//
// GIFT/VISITOR FIGURE MAPPING (source order, as supplied)
//
// #1 1111 -> Ibrahim          [1,1,1,1]
// #2 2222 -> Musah            [2,2,2,2]
// #3 1222 -> Adam             [1,2,2,2]
// #4 1112 -> Hassan & Hussein [1,1,1,2]
// #5 2122 -> Umar             [2,1,2,2]
// #6 2211 -> Nuhu             [2,2,1,1]
// #7 2121 -> Usman            [2,1,2,1]
// #8 1211 -> Yunus            [1,2,1,1]
//
// Not assigned an interpretation: the other eight of the sixteen canonical
// figures (Yussif, Mahadi, Issah, Ayuba, Kalla Allahu, Sulemana, Ali,
// Iddris) never appear among these eight recovered patterns. If a cast
// chart's Gift/Visitor calculation produces one of those eight, this file
// correctly reports no gift interpretation is available for it — see
// findGiftVisitorFigureByPattern's own doc comment. No meaning is invented
// for them.

import { STARS, type Pattern } from "@/content/stars";

export interface GiftVisitorFigure {
  /** This restoration's own source-order number, 1-8 — not a manuscript
   * page number (the source prints no numbers here; see this file's
   * header comment on how the order was established). */
  number: number;
  /** content/stars.ts id for the star whose figure this entry names. */
  starId: string;
}

export const GIFT_VISITOR_FIGURES: GiftVisitorFigure[] = [
  { number: 1, starId: "ibrahim" },
  { number: 2, starId: "musah" },
  { number: 3, starId: "adam" },
  { number: 4, starId: "hassan-hussein" },
  { number: 5, starId: "umar" },
  { number: 6, starId: "nuhu" },
  { number: 7, starId: "usman" },
  { number: 8, starId: "yunus" },
];

function findEntry(number: number): GiftVisitorFigure {
  const entry = GIFT_VISITOR_FIGURES.find((f) => f.number === number);
  if (!entry) {
    throw new Error(`No Gift/Visitor figure mapping for entry #${number}`);
  }
  return entry;
}

/** The star id this restoration's entry #`number` names — internal/source
 * metadata only (accessibility labelling, this file's own tests), never
 * shown as visible text on its own. */
export function getGiftVisitorFigureStarId(number: number): string {
  return findEntry(number).starId;
}

/** The already-canonical STARS pattern for entry #`number` — looked up,
 * never recomputed or redefined here. */
export function getGiftVisitorFigurePattern(number: number): Pattern {
  const { starId } = findEntry(number);
  const star = STARS.find((s) => s.id === starId);
  if (!star) throw new Error(`No star ${starId} in content/stars.ts`);
  return star.pattern;
}

/** Given a four-row figure, the entry number (1-8) whose recovered pattern
 * matches it exactly, or null when the figure is one of the eight NOT
 * among this restoration's recovered patterns (see this file's header
 * comment — that is a real, honestly-reported gap, not a bug). Unlike
 * Chapter 151's dream figures, these eight patterns map to eight distinct
 * stars with no duplicate, so at most one entry can ever match. */
export function findGiftVisitorFigureByPattern(pattern: Pattern): number | null {
  const entry = GIFT_VISITOR_FIGURES.find((f) => {
    const star = STARS.find((s) => s.id === f.starId);
    return star !== undefined && star.pattern.every((row, i) => row === pattern[i]);
  });
  return entry ? entry.number : null;
}

// ----------------------------------------------------------------------
// Splitting the two chapters' own paragraph text around each unmarked
// "If you get..." occurrence so a figure can be inserted exactly where
// the source leaves room for it, without rewriting a single word of
// lib/server/content/kanzulMikban.ts's own paragraphs. Same technique as
// content/manuscripts/dreamInterpretations.ts's parseDreamParagraph, with
// one difference the source itself requires: Chapter 151 numbers its own
// markers ("1. If it's", "2. If it's", ...), so that parser reads the
// number out of the text. This source prints no numbers at all — every
// occurrence just reads "If you get" (or, once, "If you use the method
// above and get") — so the reading-order number is supplied by the
// caller instead (`startNumber`), one running count across both chapter
// entries in the order this file's header comment establishes.

export interface GiftVisitorItem {
  /** This restoration's own reading-order number (see `startNumber`). */
  number: number;
  /** The exact original substring naming this occurrence, e.g. "If you
   * get" or "If you get:" or "If you use the method above and get" —
   * printed as-is, immediately followed by the figure. */
  markerText: string;
  /** Everything from immediately after markerText up to (not including)
   * the next marker, or the end of the paragraph. */
  rest: string;
}

export interface ParsedGiftVisitorParagraph {
  /** Any text before the first marker in this paragraph — for "reading-
   * the-gift-visitor-figures-end-of-chapter"'s own paragraph, this is the
   * tail end of entry #6's sentence, continued across the manuscript's
   * page break (see this file's header comment); it is rendered as
   * ordinary prose, not attached to a figure of its own, exactly as the
   * source gives no marker for it. '' if the paragraph starts directly
   * at a marker. */
  lead: string;
  items: GiftVisitorItem[];
}

const MARKER_RE = /If you use the method above and get|If you get:?/g;

/** Splits one of these two chapters' existing paragraph strings at each of
 * its own unmarked "If you get[:]" occurrences, numbering them startNumber,
 * startNumber+1, ... in order found. Every character of the input is
 * accounted for across `lead` and the items' `markerText` + `rest` —
 * nothing is dropped, added, or reworded, only located. */
export function parseGiftVisitorParagraph(
  paragraph: string,
  startNumber: number,
): ParsedGiftVisitorParagraph {
  const matches = Array.from(paragraph.matchAll(MARKER_RE));
  if (matches.length === 0) return { lead: paragraph, items: [] };

  const firstIndex = matches[0].index ?? 0;
  const lead = paragraph.slice(0, firstIndex).trim();

  const items: GiftVisitorItem[] = matches.map((m, i) => {
    const start = m.index ?? 0;
    const markerEnd = start + m[0].length;
    const nextStart =
      i + 1 < matches.length
        ? (matches[i + 1].index ?? paragraph.length)
        : paragraph.length;
    return {
      number: startNumber + i,
      markerText: m[0],
      rest: paragraph.slice(markerEnd, nextStart).trim(),
    };
  });

  return { lead, items };
}
