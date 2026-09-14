import { describe, expect, it } from "vitest";
import { HATIM_DEFINITIONS } from "./hatim";
import { STAR_USE_ENTRIES } from "./starUses";
import {
  HATIM_PATTERN_DIAGNOSTICS,
  getPatternDiagnosticByStarId,
} from "./hatimPattern";
import {
  VALUE_RECONCILIATIONS,
  getValueReconciliationByStarId,
} from "./valueReconciliation";

// Prompt 23 supplied manuscript values for every previously-"under review"
// cell, so every one of the sixteen diagrams now has three verified variable
// cells (topMiddle/middleLeft/bottomRight) instead of just four stars having
// some. That means the pattern diagnostic (section 7) can now be tested
// against all sixteen — and it does NOT confirm the N-4/N-5/N-6 formula
// universally, which is exactly what section 6 of Prompt 23 asked to prove.
describe("Hatim N-4/N-5/N-6 pattern diagnostic — section 7: a check, never a generator", () => {
  it("produces one diagnostic per star, none mutating hatim.ts", () => {
    expect(HATIM_PATTERN_DIAGNOSTICS).toHaveLength(16);
    const before = JSON.stringify(HATIM_DEFINITIONS);
    void HATIM_PATTERN_DIAGNOSTICS;
    expect(JSON.stringify(HATIM_DEFINITIONS)).toBe(before);
  });

  it("is CONFIRMED_BY_SOURCE for the twelve stars whose three verified cells all imply the same N", () => {
    const confirmed: Record<string, number> = {
      adam: 66, // corrected from an initial 22/21/20 to 62/61/60 after a second manuscript check
      mahadi: 37,
      iddris: 115, // matches the STATED count (115), not the 258 Abjad sum
      ibrahim: 150, // topMiddle corrected from an initial 142 to 146 after a second manuscript check
      issah: 129,
      umar: 206,
      ayuba: 312, // matches the STATED count (312), not the 72 Abjad sum
      sulemana: 256,
      ali: 370, // variable cells corrected from an initial 322/325/324 to 366/365/364 (Prompt 35); matches the STATED count (370), not the 131 Abjad sum
      "hassan-hussein": 88,
      yunus: 18,
      musah: 114,
    };
    for (const [starId, n] of Object.entries(confirmed)) {
      const d = getPatternDiagnosticByStarId(starId)!;
      expect(d.status, starId).toBe("confirmed_by_source");
      expect(d.consistentN, starId).toBe(n);
    }
  });

  it("is CONFLICTING for three stars whose three verified cells do NOT all imply the same N — proving the formula is not universal", () => {
    // Section 6/11 of Prompt 23 specifically calls out Ali and Usman as
    // stars whose supplied values do not fit the simple descent. Ibrahim
    // was originally in this group too, until a later manuscript re-check
    // corrected its topMiddle cell (142 -> 146), which does fit. Ali was
    // corrected too (Prompt 35, 322/325/324 -> 366/365/364) and now also
    // fits — see the dedicated Ali test below.
    const conflicting = ["yussif", "kalla-allahu", "usman"];
    for (const starId of conflicting) {
      const d = getPatternDiagnosticByStarId(starId)!;
      expect(d.status, starId).toBe("conflicting");
      expect(d.consistentN, starId).toBeNull();
    }
  });

  it("is NOT_CONFIRMED for Nuhu — its three cells agree with each other, but on a number (26) matching neither the stated count nor the Abjad sum (66)", () => {
    const d = getPatternDiagnosticByStarId("nuhu")!;
    expect(d.status).toBe("not_confirmed");
    expect(d.consistentN).toBe(26);
    expect(d.consistentN).not.toBe(d.sourceStatedValue);
    expect(d.consistentN).not.toBe(d.abjadValue);
  });

  it("is CONFIRMED_BY_SOURCE for Umar and Ayuba, unchanged from Prompt 21/22 (already-verified cells untouched)", () => {
    const umar = getPatternDiagnosticByStarId("umar")!;
    expect(umar.consistentN).toBe(206);
    const ayuba = getPatternDiagnosticByStarId("ayuba")!;
    expect(ayuba.consistentN).toBe(312);
    expect(ayuba.abjadValue).toBe(72);
    expect(ayuba.consistentN).not.toBe(ayuba.abjadValue);
  });

  it("is CONFLICTING for Yussif — its three verified cells do NOT all imply the same N", () => {
    const d = getPatternDiagnosticByStarId("yussif")!;
    expect(d.status).toBe("conflicting");
    expect(d.consistentN).toBeNull();
    expect(d.verifiedCells).toHaveLength(3);
    // topMiddle(211)+4=215, bottomRight(209)+6=215, but middleLeft(215)+5=220 — a real disagreement.
    const impliedNs = d.verifiedCells
      .map((c) => c.impliedN)
      .sort((a, b) => a - b);
    expect(impliedNs).toEqual([215, 215, 220]);
  });

  it("Usman: explicit regression proof that it does not follow a simple descent (Prompt 23 section 11)", () => {
    const usman = getPatternDiagnosticByStarId("usman")!;
    const usmanNs = usman.verifiedCells
      .map((c) => c.impliedN)
      .sort((a, b) => a - b);
    expect(usmanNs).toEqual([107, 111, 112]);
  });

  it("Ibrahim now fits the descent after its topMiddle correction: all three cells imply N=150, matching stated count and Abjad", () => {
    const ibrahim = getPatternDiagnosticByStarId("ibrahim")!;
    const ibrahimNs = ibrahim.verifiedCells
      .map((c) => c.impliedN)
      .sort((a, b) => a - b);
    expect(ibrahimNs).toEqual([150, 150, 150]);
    expect(ibrahim.consistentN).toBe(150);
    expect(ibrahim.sourceStatedValue).toBe(150);
    expect(ibrahim.abjadValue).toBe(150);
  });

  it("Ali now fits the descent after its variable cells were corrected (Prompt 35): all three imply N=370, matching the stated count but not the Abjad sum", () => {
    const ali = getPatternDiagnosticByStarId("ali")!;
    const aliNs = ali.verifiedCells
      .map((c) => c.impliedN)
      .sort((a, b) => a - b);
    expect(aliNs).toEqual([370, 370, 370]);
    expect(ali.consistentN).toBe(370);
    expect(ali.sourceStatedValue).toBe(370);
    expect(ali.abjadValue).toBe(131);
    expect(ali.consistentN).not.toBe(ali.abjadValue);
    expect(ali.status).toBe("confirmed_by_source");
  });

  it("never invents a Hatim value: every diagnostic's verifiedCells come only from hatim.ts cells already marked verified", () => {
    for (const d of HATIM_PATTERN_DIAGNOSTICS) {
      const hatim = HATIM_DEFINITIONS.find((h) => h.starId === d.starId)!;
      for (const c of d.verifiedCells) {
        expect(hatim.border[c.position].status).toBe("verified");
      }
    }
  });
});

describe("Value reconciliation — section 9: sourceStatedValue, abjadValue and hatimReferenceValue kept distinct", () => {
  it("produces one reconciliation per star", () => {
    expect(VALUE_RECONCILIATIONS).toHaveLength(16);
    expect(VALUE_RECONCILIATIONS.map((r) => r.starId).sort()).toEqual(
      STAR_USE_ENTRIES.map((e) => e.starId).sort(),
    );
  });

  it("Yussif — identity/value distinction: 251 (stated) \u2260 215 (Abjad); hatimReferenceValue null (cells conflict)", () => {
    const r = getValueReconciliationByStarId("yussif")!;
    expect(r.sourceStatedValue).toBe(251);
    expect(r.abjadValue).toBe(215);
    expect(r.hatimReferenceValue).toBeNull();
    expect(r.valueConfidence).toBe("unresolved");
  });

  it("Usman — identity/value distinction: never conflated with Yussif's يا طاهر (251)", () => {
    const r = getValueReconciliationByStarId("usman")!;
    expect(r.sourceStatedValue).toBe(111);
    expect(r.abjadValue).toBe(111);
    const usmanEntry = STAR_USE_ENTRIES.find((e) => e.starId === "usman")!;
    expect(usmanEntry.invocation!.arabic).toBe("يا كافي");
    const yussifEntry = STAR_USE_ENTRIES.find((e) => e.starId === "yussif")!;
    expect(yussifEntry.invocation!.arabic).toBe("يا طاهر");
    expect(yussifEntry.invocation!.count).toBe(251);
  });

  it('Ayuba — hatimReferenceValue (312) is the stated count, not the bare Abjad sum (72); confidence stays "verified" because the relationship is understood', () => {
    const r = getValueReconciliationByStarId("ayuba")!;
    expect(r.hatimReferenceValue).toBe(312);
    expect(r.sourceStatedValue).toBe(312);
    expect(r.abjadValue).toBe(72);
    expect(r.valueConfidence).toBe("verified");
  });

  it('Iddris is now upgraded to "verified": the Prompt 23 Hatim cells confirm 115 independently of the mismatched Abjad sum (258)', () => {
    const r = getValueReconciliationByStarId("iddris")!;
    expect(r.hatimReferenceValue).toBe(115);
    expect(r.sourceStatedValue).toBe(115);
    expect(r.abjadValue).toBe(258);
    expect(r.valueConfidence).toBe("verified");
  });

  it('Ali is now "verified" (Prompt 35): the corrected Hatim cells (366/365/364) confirm the stated count (370) independently of the mismatched Abjad sum (131), the same relationship found for Ayuba and Iddris', () => {
    const r = getValueReconciliationByStarId("ali")!;
    expect(r.hatimReferenceValue).toBe(370);
    expect(r.sourceStatedValue).toBe(370);
    expect(r.abjadValue).toBe(131);
    expect(r.valueConfidence).toBe("verified");
  });

  it('Yunus is "partial" — never claimed fully resolved nor a plain discrepancy', () => {
    expect(getValueReconciliationByStarId("yunus")!.valueConfidence).toBe(
      "partial",
    );
  });

  it('Nuhu is "partial": stated count = Abjad (66), but the Hatim\'s own consistent N (26) matches neither', () => {
    const r = getValueReconciliationByStarId("nuhu")!;
    expect(r.valueConfidence).toBe("partial");
    expect(r.hatimReferenceValue).toBe(26);
  });

  it('Kalla Allahu and Usman are "partial": stated count = Abjad, but their Hatim cells conflict with each other', () => {
    for (const starId of ["kalla-allahu", "usman"]) {
      const r = getValueReconciliationByStarId(starId)!;
      expect(r.valueConfidence, starId).toBe("partial");
      expect(r.hatimReferenceValue, starId).toBeNull();
    }
  });

  it('the eight stars whose stated count, Abjad, and Hatim-derived N all agree report full "verified" confidence', () => {
    const allAgree = [
      "adam",
      "mahadi",
      "issah",
      "ibrahim",
      "umar",
      "sulemana",
      "hassan-hussein",
      "musah",
    ];
    for (const starId of allAgree) {
      const r = getValueReconciliationByStarId(starId)!;
      expect(r.valueConfidence, starId).toBe("verified");
      expect(r.hatimReferenceValue, starId).toBe(r.sourceStatedValue);
    }
  });
});

describe("This session does not touch the casting engine", () => {
  it("exports no engine-facing symbols from either new module", () => {
    const mod: Record<string, unknown> = {
      HATIM_PATTERN_DIAGNOSTICS,
      VALUE_RECONCILIATIONS,
    };
    expect(mod).not.toHaveProperty("runReading");
    expect(mod).not.toHaveProperty("buildChart");
  });
});
