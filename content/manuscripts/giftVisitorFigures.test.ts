import { describe, expect, it } from "vitest";
import { STARS } from "@/content/stars";
import { KM_CHAPTERS } from "@/lib/server/content/kanzulMikban";
import {
  GIFT_VISITOR_FIGURES,
  findGiftVisitorFigureByPattern,
  getGiftVisitorFigurePattern,
  getGiftVisitorFigureStarId,
  parseGiftVisitorParagraph,
} from "@/content/manuscripts/giftVisitorFigures";

// The expected mapping, written independently in this test file (not a
// copy-paste of the implementation) so a mistake in the data file's own
// table would still be caught here — same discipline as
// dreamInterpretations.test.ts's own EXPECTED table.
const EXPECTED: Record<
  number,
  { starId: string; pattern: [number, number, number, number] }
> = {
  1: { starId: "ibrahim", pattern: [1, 1, 1, 1] },
  2: { starId: "iddris", pattern: [2, 2, 1, 2] },
  3: { starId: "issah", pattern: [1, 2, 1, 2] },
  4: { starId: "hassan-hussein", pattern: [1, 1, 1, 2] },
  5: { starId: "ali", pattern: [2, 1, 1, 2] },
  6: { starId: "nuhu", pattern: [2, 2, 1, 1] },
  7: { starId: "mahadi", pattern: [2, 1, 1, 1] },
  8: { starId: "yunus", pattern: [1, 2, 1, 1] },
};

const CH1 = KM_CHAPTERS.find(
  (c) => c.id === "continued-from-chapter-twenty-eight",
);
const CH2 = KM_CHAPTERS.find(
  (c) => c.id === "reading-the-gift-visitor-figures-end-of-chapter",
);

describe("Gift/Visitor Figures (Chapter 28 continuation) figure restoration", () => {
  it("both source entries exist in KM_CHAPTERS, unnumbered", () => {
    expect(CH1).toBeDefined();
    expect(CH1!.number).toBeNull();
    expect(CH2).toBeDefined();
    expect(CH2!.number).toBeNull();
  });

  it("1. has exactly eight recovered figures", () => {
    expect(GIFT_VISITOR_FIGURES).toHaveLength(8);
  });

  it("gives every entry a non-null, four-row, valid-dot geomantic figure", () => {
    for (let n = 1; n <= 8; n++) {
      const pattern = getGiftVisitorFigurePattern(n);
      expect(pattern).toBeDefined();
      expect(pattern).toHaveLength(4);
      for (const row of pattern) expect([1, 2]).toContain(row);
    }
  });

  it("2/3. matches every entry to its expected canonical star, by exact pattern, with no rotation or inversion applied", () => {
    for (let n = 1; n <= 8; n++) {
      const expected = EXPECTED[n];
      expect(getGiftVisitorFigureStarId(n)).toBe(expected.starId);
      expect(getGiftVisitorFigurePattern(n)).toEqual(expected.pattern);
      // Cross-check against the existing canonical STARS array itself.
      const star = STARS.find((s) => s.id === expected.starId);
      expect(star).toBeDefined();
      expect(star!.pattern).toEqual(expected.pattern);
    }
  });

  it("no duplicate mapping — all eight entries name eight distinct stars", () => {
    const ids = GIFT_VISITOR_FIGURES.map((f) => f.starId);
    expect(new Set(ids).size).toBe(8);
  });

  it("the eight NOT recovered figures are exactly the remaining eight canonical stars", () => {
    const recovered = new Set(GIFT_VISITOR_FIGURES.map((f) => f.starId));
    const notRecovered = STARS.filter((s) => !recovered.has(s.id)).map((s) => s.id);
    expect(notRecovered.sort()).toEqual(
      ["adam", "ayuba", "kalla-allahu", "musah", "sulemana", "umar", "usman", "yussif"].sort(),
    );
  });

  it("preserves source order 1-8 exactly", () => {
    expect(GIFT_VISITOR_FIGURES.map((f) => f.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("findGiftVisitorFigureByPattern round-trips every recovered pattern to its own number, and returns null for a pattern not among the eight", () => {
    for (let n = 1; n <= 8; n++) {
      expect(findGiftVisitorFigureByPattern(getGiftVisitorFigurePattern(n))).toBe(n);
    }
    // Musah [2,2,2,2] was recovered under the pre-Prompt-50 mapping but is
    // one of the eight NOT recovered under the corrected one (see this
    // file's header comment) — a direct regression check on the correction.
    expect(findGiftVisitorFigureByPattern([2, 2, 2, 2])).toBeNull();
  });

  describe("existing interpretation text is unchanged by this restoration", () => {
    it("finds exactly six occurrences across continued-from-chapter-twenty-eight's own two paragraphs, numbered 1-6", () => {
      // Paragraph 0 contributes #1-5, paragraph 1 contributes just #6 — the
      // running count is re-derived exactly as the reader component does,
      // rather than hard-coded twice.
      let running = 1;
      const numbered = CH1!.paragraphs.flatMap((p) => {
        const { items } = parseGiftVisitorParagraph(p, running);
        running += items.length;
        return items;
      });
      expect(numbered.map((it) => it.number)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("finds exactly two occurrences in reading-the-gift-visitor-figures-end-of-chapter, numbered 7-8", () => {
      const { items } = parseGiftVisitorParagraph(CH2!.paragraphs[0], 7);
      expect(items.map((it) => it.number)).toEqual([7, 8]);
    });

    it("reconstructs each paragraph's full text from lead + markerText + rest, byte for byte after whitespace normalization", () => {
      const normalize = (s: string) => s.replace(/\s+/g, " ").trim();
      let running = 1;
      for (const paragraph of CH1!.paragraphs) {
        const { lead, items } = parseGiftVisitorParagraph(paragraph, running);
        running += items.length;
        const rebuilt = [lead, ...items.map((it) => `${it.markerText}${it.rest}`)].filter(Boolean).join(" ");
        expect(normalize(rebuilt)).toBe(normalize(paragraph));
      }
      const { lead: lead2, items: items2 } = parseGiftVisitorParagraph(CH2!.paragraphs[0], 7);
      const rebuilt2 = [lead2, ...items2.map((it) => `${it.markerText}${it.rest}`)].filter(Boolean).join(" ");
      expect(normalize(rebuilt2)).toBe(normalize(CH2!.paragraphs[0]));
    });

    it("entry #6 spans the manuscript's own page break — its sentence starts in continued-from-chapter-twenty-eight and finishes, unmarked, at the very start of reading-the-gift-visitor-figures-end-of-chapter", () => {
      const { items } = parseGiftVisitorParagraph(CH1!.paragraphs[1], 6);
      expect(items[0].rest).toContain(
        "not yet transcribed",
      );
      const { lead } = parseGiftVisitorParagraph(CH2!.paragraphs[0], 7);
      expect(lead).toContain("through her you will be successful");
      // No figure is attached to this continuation text — it is ordinary
      // lead prose, never mistaken for a ninth marked occurrence.
      expect(lead.startsWith("If you get")).toBe(false);
    });

    it('never alters the "[text continues onto the next page, not yet transcribed]" transcriber note', () => {
      const fullText = CH1!.paragraphs.join(" ");
      expect(fullText).toContain(
        "[text continues onto the next page, not yet transcribed]",
      );
    });
  });
});
