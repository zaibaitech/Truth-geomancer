import { describe, expect, it } from "vitest";
import { divineNameSourceLine } from "./divineNameDisplay";

describe("divineNameSourceLine — user-facing Divine Name note", () => {
  it("shows the manuscript-stated count plainly when one exists", () => {
    const r = divineNameSourceLine({ count: 370 });
    expect(r.hasSourceValue).toBe(true);
    expect(r.sourceValue).toBe(370);
    expect(r.caption).toBe("Manuscript-stated recitation count.");
  });

  it("Iddris: 115 shown plainly, matching the manuscript-stated count", () => {
    const r = divineNameSourceLine({ count: 115 });
    expect(r.sourceValue).toBe(115);
    expect(r.caption).toBe("Manuscript-stated recitation count.");
  });

  it("Ayuba: 312 shown plainly, matching the manuscript-stated count", () => {
    const r = divineNameSourceLine({ count: 312 });
    expect(r.sourceValue).toBe(312);
    expect(r.caption).toBe("Manuscript-stated recitation count.");
  });

  it("says the value is not specified when no invocation exists, rather than warning", () => {
    const r = divineNameSourceLine(null);
    expect(r.hasSourceValue).toBe(false);
    expect(r.sourceValue).toBeNull();
    expect(r.caption).toBe(
      "Source value not specified in the available manuscript material.",
    );
  });

  it("takes only a recitation count -- structurally cannot compare against a computed Abjad value or warn on mismatch", () => {
    // The function's own parameter shape has no room for a second (Abjad)
    // number to compare against -- there is nothing here for a
    // "source value != computed Abjad" check to be built from.
    const r = divineNameSourceLine({ count: 131 });
    expect(r.sourceValue).toBe(131);
    expect(r.caption).not.toContain("Abjad");
    expect(r.caption).not.toContain("mismatch");
    expect(r.caption).not.toContain("discrepancy");
  });

  it("never mentions N-4/N-5/N-6, Hatim cell agreement, or spelling status in either caption", () => {
    const withValue = divineNameSourceLine({ count: 251 });
    const withoutValue = divineNameSourceLine(null);
    for (const caption of [withValue.caption, withoutValue.caption]) {
      expect(caption).not.toMatch(/N-4|N−4|Hatim|spelling|conflict|agree/i);
    }
  });
});
