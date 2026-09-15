import { describe, expect, it } from "vitest";
import {
  CHAPTERS,
  DEDICATION,
  DEDICATION_TITLE,
  INTRODUCTION,
  INTRODUCTION_TITLE,
} from "./masterOfGeomancy";

describe("Book opening: Dedication and Introduction (source restoration)", () => {
  it("keeps the Dedication and Introduction as data separate from CHAPTERS -- neither is a chapter", () => {
    expect(CHAPTERS.every((c) => c.id !== "dedication")).toBe(true);
    expect(CHAPTERS.every((c) => c.id !== "introduction")).toBe(true);
  });

  it('gives the Introduction its own source heading, not "Chapter 1"', () => {
    expect(INTRODUCTION_TITLE).toBe("What is Geomancy?");
    expect(INTRODUCTION_TITLE.toLowerCase()).not.toContain("chapter");
  });

  it("keeps Chapter 1 as the chart-drawing chapter, still first and still numbered 1", () => {
    expect(CHAPTERS[0].id).toBe("drawing-a-chart");
    expect(CHAPTERS[0].number).toBe(1);
    expect(CHAPTERS[0].title).toBe("How to Draw a Chart in Geomancy");
  });

  it("preserves the Introduction paragraphs unchanged (five paragraphs, same opening line)", () => {
    expect(INTRODUCTION).toHaveLength(5);
    expect(INTRODUCTION[0]).toContain("Geomancy");
  });

  it("gives the Dedication a title and preserves the source's named individuals", () => {
    expect(DEDICATION_TITLE).toBe("Dedication");
    expect(DEDICATION).toContain("Sheikh Alhaji Seidu Kassim Watara");
    expect(DEDICATION).toContain("Ustaz Adam Meffe Lajina");
    expect(DEDICATION).toContain("Jannatul Fridaus");
  });

  it("does not invent additional dedication text beyond the source's own two named parties", () => {
    // The dedication names exactly two parties: the sheikh/mentor, and the
    // parents -- no third name is introduced.
    const nameCount = (DEDICATION.match(/\(/g) || []).length;
    expect(nameCount).toBe(2);
  });

  it("gives the Counting Method's lead sentence the source's own literal wording, not an invented paraphrase", () => {
    const countingParagraph = CHAPTERS[0].body?.[1] ?? "";
    expect(countingParagraph).toContain(
      "You will make 4 straight lines with dots as shown below.",
    );
    // The earlier paraphrase about "striking the sand quickly, without
    // deliberately counting" is not present anywhere in this source page.
    expect(countingParagraph).not.toContain("striking the sand");
  });
});
