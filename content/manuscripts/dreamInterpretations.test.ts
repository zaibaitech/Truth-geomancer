import { describe, expect, it } from "vitest";
import { STARS } from "@/content/stars";
import { KM_CHAPTERS } from "@/lib/server/content/kanzulMikban";
import {
  DREAM_INTERPRETATION_FIGURES,
  getDreamInterpretationPattern,
  getDreamInterpretationStarId,
  parseDreamParagraph,
} from "@/content/manuscripts/dreamInterpretations";

// The expected mapping, transcribed independently in this test file from
// the same source-page identification process documented in
// dreamInterpretations.ts -- this is a second, hand-written assertion of
// the mapping, not a copy-paste of the implementation, so a accidental
// mistake in the data file's own table would still be caught here.
const EXPECTED: Record<
  number,
  { starId: string; pattern: [number, number, number, number] }
> = {
  1: { starId: "yussif", pattern: [1, 1, 2, 1] },
  2: { starId: "adam", pattern: [1, 2, 2, 2] },
  3: { starId: "mahadi", pattern: [2, 1, 1, 1] },
  4: { starId: "yussif", pattern: [1, 1, 2, 1] },
  5: { starId: "ibrahim", pattern: [1, 1, 1, 1] },
  6: { starId: "issah", pattern: [1, 2, 1, 2] },
  7: { starId: "iddris", pattern: [2, 2, 1, 2] },
  8: { starId: "ayuba", pattern: [2, 2, 2, 1] },
  9: { starId: "kalla-allahu", pattern: [1, 1, 2, 2] },
  10: { starId: "sulemana", pattern: [1, 2, 2, 1] },
  11: { starId: "ali", pattern: [2, 1, 1, 2] },
  12: { starId: "nuhu", pattern: [2, 2, 1, 1] },
  13: { starId: "hassan-hussein", pattern: [1, 1, 1, 2] },
  14: { starId: "yunus", pattern: [1, 2, 1, 1] },
  15: { starId: "usman", pattern: [2, 1, 2, 1] },
  16: { starId: "musah", pattern: [2, 2, 2, 2] },
};

const CH151 = KM_CHAPTERS.find(
  (c) => c.id === "dreams-and-their-interpretations",
);

describe("Chapter 151 -- Dreams and Their Interpretations (figure restoration)", () => {
  it("exists in KM_CHAPTERS as chapter 151", () => {
    expect(CH151).toBeDefined();
    expect(CH151!.number).toBe(151);
  });

  it("A. has exactly sixteen interpretations", () => {
    expect(DREAM_INTERPRETATION_FIGURES).toHaveLength(16);
  });

  it("B. gives every interpretation a non-null geomantic figure", () => {
    for (let n = 1; n <= 16; n++) {
      const pattern = getDreamInterpretationPattern(n);
      expect(pattern).toBeDefined();
      expect(pattern).not.toBeNull();
    }
  });

  it("C. gives every figure exactly four rows", () => {
    for (let n = 1; n <= 16; n++) {
      expect(getDreamInterpretationPattern(n)).toHaveLength(4);
    }
  });

  it("D. gives every row exactly one or two dots", () => {
    for (let n = 1; n <= 16; n++) {
      for (const row of getDreamInterpretationPattern(n)) {
        expect([1, 2]).toContain(row);
      }
    }
  });

  it("E. matches every interpretation to its expected canonical star, by exact four-row pattern", () => {
    for (let n = 1; n <= 16; n++) {
      const expected = EXPECTED[n];
      expect(getDreamInterpretationStarId(n)).toBe(expected.starId);
      expect(getDreamInterpretationPattern(n)).toEqual(expected.pattern);
      // Cross-check against the existing canonical STARS array itself,
      // not just against this test's own EXPECTED table.
      const star = STARS.find((s) => s.id === expected.starId);
      expect(star).toBeDefined();
      expect(star!.pattern).toEqual(expected.pattern);
    }
  });

  it("does not invent a mapping for a star the source figures don't use, and correctly reuses one star's figure twice where the source does", () => {
    // Confirmed by independent pixel-level re-inspection (not a misread):
    // #1 and #4 print the identical Yussif figure, and Umar's figure
    // never appears among these sixteen entries.
    expect(getDreamInterpretationStarId(1)).toBe("yussif");
    expect(getDreamInterpretationStarId(4)).toBe("yussif");
    const usedStarIds = DREAM_INTERPRETATION_FIGURES.map((f) => f.starId);
    expect(usedStarIds).not.toContain("umar");
  });

  it("F. preserves interpretation order 1-16, matching the source's own numbering", () => {
    expect(DREAM_INTERPRETATION_FIGURES.map((f) => f.number)).toEqual(
      Array.from({ length: 16 }, (_, i) => i + 1),
    );
  });

  describe("G. existing interpretation text is unchanged", () => {
    it("finds all sixteen \"If it's\" markers across the chapter's own paragraphs, in order", () => {
      const allItems = CH151!.paragraphs.flatMap(
        (p) => parseDreamParagraph(p).items,
      );
      expect(allItems.map((i) => i.number)).toEqual(
        Array.from({ length: 16 }, (_, i) => i + 1),
      );
    });

    it("reconstructs each paragraph's full text from lead + markerText + rest, byte for byte after whitespace normalization", () => {
      const normalize = (s: string) => s.replace(/\s+/g, " ").trim();
      for (const paragraph of CH151!.paragraphs) {
        const { lead, items } = parseDreamParagraph(paragraph);
        const rebuilt = [
          lead,
          ...items.map((it) => `${it.markerText}${it.rest}`),
        ]
          .filter(Boolean)
          .join(" ");
        expect(normalize(rebuilt)).toBe(normalize(paragraph));
      }
    });

    it('never alters the sadaka instructions or the "[unclear in the original]" note', () => {
      const fullText = CH151!.paragraphs.join(" ");
      expect(fullText).toContain("Do the sadaka");
      expect(fullText).toContain("[unclear in the original]");
      expect(fullText).toContain(
        "Massan (21) [quantity/term unclear in the original]",
      );
    });

    it("preserves the chapter's own intro sentence about the first 4 stars (Umuhat)", () => {
      const { lead } = parseDreamParagraph(CH151!.paragraphs[0]);
      expect(lead).toBe(
        "If you want to know the meaning of a dream, make only the first 4 stars (Umuhat) and pair them.",
      );
    });
  });
});
