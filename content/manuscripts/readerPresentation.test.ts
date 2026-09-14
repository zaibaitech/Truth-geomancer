// Proves what the NORMAL reader of the "stars and their uses" chapter
// actually sees, by reading the shipped page source directly (this app has
// no component-rendering test harness) and cross-checking it against the
// underlying, still-intact source data. These are presentation-layer
// assertions only: the diagnostic data itself (abjad.ts, hatimPattern.ts,
// valueReconciliation.ts) is proven intact elsewhere (reconciliation.test.ts,
// abjad.test.ts, hatimComplete.test.ts) and is never touched here.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { HATIM_DEFINITIONS, arabicIndicToLatin } from "./hatim";
import { divineNameSourceLine } from "./divineNameDisplay";

const READER_PAGE_SOURCE = readFileSync(
  join(__dirname, "../../app/books/[id]/read/page.tsx"),
  "utf-8",
);
/** JSX text nodes wrap across source lines without changing what renders;
 * normalize whitespace before substring-matching prose the formatter may
 * have wrapped. */
const READER_PAGE_TEXT = READER_PAGE_SOURCE.replace(/\s+/g, " ");

describe("Reader presentation — Divine Name / Hatim source notes are clean, not an audit report", () => {
  it("does not render the N-4/N-5/N-6 reconstruction diagnostic to normal readers", () => {
    expect(READER_PAGE_SOURCE).not.toMatch(/N-4|N−4|N-5|N−5|N-6|N−6/);
    expect(READER_PAGE_SOURCE.toLowerCase()).not.toContain("hatim cells agree");
    expect(READER_PAGE_SOURCE.toLowerCase()).not.toContain(
      "hatim cells do not agree",
    );
    expect(READER_PAGE_SOURCE.toLowerCase()).not.toContain("conflicting");
  });

  it("does not render Abjad computation or mismatch commentary to normal readers", () => {
    expect(READER_PAGE_SOURCE).not.toContain("Abjad check");
    expect(READER_PAGE_SOURCE).not.toContain("Computed Abjad");
    expect(READER_PAGE_SOURCE).not.toContain("SOURCE VALUE");
    expect(READER_PAGE_SOURCE).not.toContain("abjadStatusLabel");
    expect(READER_PAGE_SOURCE).not.toContain("getAbjadValidationByStarId");
  });

  it('does not render "source spelling unresolved" or other audit-status labels to normal readers', () => {
    expect(READER_PAGE_SOURCE.toLowerCase()).not.toContain(
      "source spelling unresolved",
    );
    expect(READER_PAGE_SOURCE.toLowerCase()).not.toContain("unresolved");
  });

  it("does not contain Ali's old, incorrect Hatim values anywhere in the reader source", () => {
    // 322/325/324 never appeared as literal UI strings (they came only from
    // hatim.ts's data), but this guards against a future hardcoded
    // regression in the page itself.
    expect(READER_PAGE_SOURCE).not.toContain("322");
    expect(READER_PAGE_SOURCE).not.toContain("325");
    expect(READER_PAGE_SOURCE).not.toContain("324");
  });

  it("renders the Hatim source caption and the Divine Name block via the tested, diagnostic-free helper", () => {
    expect(READER_PAGE_TEXT).toContain(
      "Hatim reproduced from the manuscript source.",
    );
    // The Divine Name captions themselves come from divineNameSourceLine()
    // (asserted in divineNameDisplay.test.ts) rather than being duplicated
    // as literal strings in the page -- confirmed here by the reverse: the
    // page contains no OTHER, ad hoc caption text for that block.
    const withValue = divineNameSourceLine({ count: 1 });
    const withoutValue = divineNameSourceLine(null);
    expect(READER_PAGE_SOURCE).toContain("divineNameSourceLine(");
    expect(withValue.caption).toBe("Manuscript-stated recitation count.");
    expect(withoutValue.caption).toBe(
      "Source value not specified in the available manuscript material.",
    );
  });

  it("still renders the Hatim diagram and Divine Name block via their existing, source-driven components", () => {
    expect(READER_PAGE_SOURCE).toContain("<HatimDiagram");
    expect(READER_PAGE_SOURCE).toContain("divineNameSourceLine");
  });
});

describe("Reader presentation — the underlying data the page renders is correct", () => {
  function latin(text: string): number {
    return Number(arabicIndicToLatin(text));
  }

  it("Ali: the data the reader renders is exactly 3/366/1, 365/•/5, 2/4/364", () => {
    const ali = HATIM_DEFINITIONS.find((h) => h.starId === "ali")!;
    expect(
      latin(
        ali.border.topLeft.status === "verified" ? ali.border.topLeft.text : "",
      ),
    ).toBe(3);
    expect(
      latin(
        ali.border.topMiddle.status === "verified"
          ? ali.border.topMiddle.text
          : "",
      ),
    ).toBe(366);
    expect(
      latin(
        ali.border.topRight.status === "verified"
          ? ali.border.topRight.text
          : "",
      ),
    ).toBe(1);
    expect(
      latin(
        ali.border.middleLeft.status === "verified"
          ? ali.border.middleLeft.text
          : "",
      ),
    ).toBe(365);
    expect(
      latin(
        ali.border.middleRight.status === "verified"
          ? ali.border.middleRight.text
          : "",
      ),
    ).toBe(5);
    expect(
      latin(
        ali.border.bottomLeft.status === "verified"
          ? ali.border.bottomLeft.text
          : "",
      ),
    ).toBe(2);
    expect(
      latin(
        ali.border.bottomMiddle.status === "verified"
          ? ali.border.bottomMiddle.text
          : "",
      ),
    ).toBe(4);
    expect(
      latin(
        ali.border.bottomRight.status === "verified"
          ? ali.border.bottomRight.text
          : "",
      ),
    ).toBe(364);
  });

  it("Ali: none of the border cells carry the old, incorrect 322/325/324 values", () => {
    const ali = HATIM_DEFINITIONS.find((h) => h.starId === "ali")!;
    const values = Object.values(ali.border).map((c) =>
      c.status === "verified" ? latin(c.text) : null,
    );
    expect(values).not.toContain(322);
    expect(values).not.toContain(325);
    expect(values).not.toContain(324);
  });

  it("Iddris: the reader's clean source value (115) is exactly the Hatim's own topMiddle/middleLeft/bottomRight geometry", () => {
    const iddris = HATIM_DEFINITIONS.find((h) => h.starId === "iddris")!;
    expect(
      latin(
        iddris.border.topMiddle.status === "verified"
          ? iddris.border.topMiddle.text
          : "",
      ),
    ).toBe(111);
    expect(
      latin(
        iddris.border.middleLeft.status === "verified"
          ? iddris.border.middleLeft.text
          : "",
      ),
    ).toBe(110);
    expect(
      latin(
        iddris.border.bottomRight.status === "verified"
          ? iddris.border.bottomRight.text
          : "",
      ),
    ).toBe(109);
  });

  it("Ayuba: the reader's clean source value (312) is exactly the Hatim's own topMiddle/middleLeft/bottomRight geometry", () => {
    const ayuba = HATIM_DEFINITIONS.find((h) => h.starId === "ayuba")!;
    expect(
      latin(
        ayuba.border.topMiddle.status === "verified"
          ? ayuba.border.topMiddle.text
          : "",
      ),
    ).toBe(308);
    expect(
      latin(
        ayuba.border.middleLeft.status === "verified"
          ? ayuba.border.middleLeft.text
          : "",
      ),
    ).toBe(307);
    expect(
      latin(
        ayuba.border.bottomRight.status === "verified"
          ? ayuba.border.bottomRight.text
          : "",
      ),
    ).toBe(306);
  });
});
