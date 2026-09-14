import { describe, expect, it } from "vitest";
import { STARS, type Pattern } from "@/content/stars";
import { addPatterns, addRows } from "@/lib/raml/casting";
import {
  ADDITION_SEQUENCE,
  BAZDAAHO_ALL_ACTIVE_VALIDATION,
  BAZDAAHO_ARRANGEMENT,
  BAZDAAHO_CALCULATION_RULE_NOTE,
  BAZDAAHO_EG1_NOTE,
  BAZDAAHO_FORMULA_TABLE,
  BAZDAAHO_LINE_VALUES,
  BAZDAAHO_METHOD_INTRO,
  BAZDAAHO_POSITION_16_NOTE,
  BAZDAAHO_POSITION_AUDIT,
  BAZDAAHO_SOURCE_RECONCILIATION_NOTES,
  BAZDAAHO_WORKED_EXAMPLES,
  bazdaahoNumberFromPattern,
  CANCEL_DIRECTION_LABEL,
  CANCELLING_METHOD_CLOSING,
  CANCELLING_METHOD_EXAMPLES,
  CANCELLING_METHOD_MOTHER_PATTERNS,
  CHAPTER_ONE_ADDITION_STEPS,
  CHAPTER_ONE_CHART,
  CHAPTER_ONE_DAUGHTERS,
  CHART_HOUSE_GROUPS,
  CIRCLED_NUMBERS,
  COMPLETE_CHART_INTRO,
  COUNTING_DIRECTION_NOTE,
  COUNTING_METHOD_CLOSING,
  COUNTING_METHOD_EXAMPLES,
  PARITY_ADDITION_EXAMPLES,
  cancelledLineMark,
  starForBazdaahoResult,
  starForCount,
} from "@/content/manuscripts/chapterOneDiagrams";

describe("Chapter One diagram data (source restoration, page 4-6)", () => {
  describe("Counting Method", () => {
    it("has exactly two worked examples, four lines each, as printed", () => {
      expect(COUNTING_METHOD_EXAMPLES).toHaveLength(2);
      for (const example of COUNTING_METHOD_EXAMPLES) {
        expect(example.lines).toHaveLength(4);
      }
    });

    it("labels every line with the source's own circled number, in drawing order", () => {
      for (const example of COUNTING_METHOD_EXAMPLES) {
        expect(example.lines.map((l) => l.circledNumber)).toEqual(
          CIRCLED_NUMBERS,
        );
      }
    });

    it("derives every worked line's star figure from the existing STARS array, not a new lookup table", () => {
      const allValues = COUNTING_METHOD_EXAMPLES.flatMap((e) =>
        e.lines.map((l) => l.reducedValue),
      );
      for (const value of allValues) {
        const { pattern } = starForCount(value);
        const star = STARS.find((s) => s.number === value);
        expect(star).toBeDefined();
        expect(pattern).toEqual(star!.pattern);
      }
    });

    it("matches the six source figures verified by magnified dot-count in Bazdaaho order", () => {
      // 10->Sulemana, 12->Nuhu, 14->Yunus, 18-16=2->Adam, 13->Hassan-Hussein, 15->Usman
      expect(starForCount(10).name).toBe("Sulemana");
      expect(starForCount(12).name).toBe("Nuhu");
      expect(starForCount(14).name).toBe("Yunus");
      expect(starForCount(2).name).toBe("Adam");
      expect(starForCount(13).name).toBe("Hassan & Hussein");
      expect(starForCount(15).name).toBe("Usman");
    });

    it("reduces the two 18/19 raw counts the same way the app's own reduceCount() would", () => {
      // 18 - 16 = 2, 19 - 16 = 3 -- the source's own stated arithmetic.
      const eighteenLine = COUNTING_METHOD_EXAMPLES[0].lines[3];
      const nineteenLine = COUNTING_METHOD_EXAMPLES[1].lines[3];
      expect(eighteenLine.arithmeticLabel).toBe("18 - 16 = 2");
      expect(eighteenLine.reducedValue).toBe(2);
      expect(nineteenLine.arithmeticLabel).toBe("19 - 16 = 3");
      expect(nineteenLine.reducedValue).toBe(3);
    });

    it("draws each line's literal raw count -- the count BEFORE reduction, not the reduced value", () => {
      // The source draws 18 and 19 dots, then reduces on the page; the
      // rendered row of marks must count out the drawn total, not the
      // post-reduction star number.
      const eighteenLine = COUNTING_METHOD_EXAMPLES[0].lines[3];
      const nineteenLine = COUNTING_METHOD_EXAMPLES[1].lines[3];
      expect(eighteenLine.rawCount).toBe(18);
      expect(eighteenLine.rawCount).not.toBe(eighteenLine.reducedValue);
      expect(nineteenLine.rawCount).toBe(19);
      expect(nineteenLine.rawCount).not.toBe(nineteenLine.reducedValue);
      // Unreduced lines draw exactly their stated count.
      expect(COUNTING_METHOD_EXAMPLES[0].lines[0].rawCount).toBe(10);
      expect(COUNTING_METHOD_EXAMPLES[0].lines[1].rawCount).toBe(12);
      expect(COUNTING_METHOD_EXAMPLES[0].lines[2].rawCount).toBe(14);
      expect(COUNTING_METHOD_EXAMPLES[1].lines[0].rawCount).toBe(13);
      expect(COUNTING_METHOD_EXAMPLES[1].lines[1].rawCount).toBe(15);
    });

    it('states the source\'s own "4 3 2 1" result order for both examples -- the reverse of drawing order', () => {
      for (const example of COUNTING_METHOD_EXAMPLES) {
        expect(example.resultOrder).toEqual([4, 3, 2, 1]);
      }
    });

    it("quotes the source's counting-direction instruction verbatim, without extending it", () => {
      expect(COUNTING_DIRECTION_NOTE).toBe(
        "Starting counting from 4th line from your right to the left…",
      );
    });

    it("reproduces the source's own closing line verbatim", () => {
      expect(COUNTING_METHOD_CLOSING).toBe(
        "This first 4 is called umuhat mother stars.",
      );
    });
  });

  describe("Cancelling Method", () => {
    it("has exactly four worked examples, four tally lines each, as printed", () => {
      expect(CANCELLING_METHOD_EXAMPLES).toHaveLength(4);
      for (const example of CANCELLING_METHOD_EXAMPLES) {
        expect(example.lines).toHaveLength(4);
      }
    });

    it("uses only the two tokens the source itself prints", () => {
      for (const example of CANCELLING_METHOD_EXAMPLES) {
        for (const line of example.lines) {
          for (const token of line) {
            expect(["|", "||"]).toContain(token);
          }
        }
      }
    });

    it("derives each line's mark purely from odd/even parity of its already-transcribed tokens", () => {
      // Total dots (sum of token lengths) odd -> 1 dot; even -> 2 dots.
      // This is the same parity rule stated in the source and cross-tested
      // elsewhere in this file against addRows() -- not a new formula, and
      // not a re-reading of the source (the tokens are unchanged).
      for (const example of CANCELLING_METHOD_EXAMPLES) {
        for (const line of example.lines) {
          const total = line.reduce((sum, t) => sum + t.length, 0);
          const expectedMark = total % 2 === 0 ? 2 : 1;
          expect(cancelledLineMark(line)).toBe(expectedMark);
        }
      }
    });

    it("represents cancellation direction as right-to-left, per the source's own instruction", () => {
      expect(CANCEL_DIRECTION_LABEL.toLowerCase()).toContain("right");
      expect(CANCEL_DIRECTION_LABEL.toLowerCase()).toContain("left");
      expect(CANCEL_DIRECTION_LABEL.toLowerCase()).toContain("pair");
    });

    it("does not invent a numeric field beyond what cancelledLineMark derives from the tokens", () => {
      // The example objects themselves still carry only their source-
      // transcribed label and tokens -- no stored "result"/"reducedValue"
      // field competes with or overrides the derived mark.
      for (const example of CANCELLING_METHOD_EXAMPLES) {
        expect(example).not.toHaveProperty("result");
        expect(example).not.toHaveProperty("reducedValue");
      }
    });

    it("produces exactly four Mother Stars, one per worked example, each a valid four-line pattern", () => {
      expect(CANCELLING_METHOD_MOTHER_PATTERNS).toHaveLength(4);
      CANCELLING_METHOD_EXAMPLES.forEach((example, i) => {
        const expected = example.lines.map(cancelledLineMark) as Pattern;
        expect(CANCELLING_METHOD_MOTHER_PATTERNS[i]).toEqual(expected);
        for (const dot of CANCELLING_METHOD_MOTHER_PATTERNS[i]) {
          expect([1, 2]).toContain(dot);
        }
      });
    });

    it("reproduces the source's own closing line verbatim, introducing the Banaat", () => {
      expect(CANCELLING_METHOD_CLOSING).toBe(
        "So we have 4 stars as the umuhat (Mother stars) as shown above, from there, use the first 4 stars to get the second 4 (Banaat - Children stars) in geomancy.",
      );
    });
  });

  describe("Mothers to the complete chart (H1-H16)", () => {
    it("builds the four Daughters by reading across the four Mothers' corresponding lines (deriveDaughters, not addition)", () => {
      expect(CHAPTER_ONE_DAUGHTERS).toHaveLength(4);
      for (let line = 0; line < 4; line++) {
        expect(CHAPTER_ONE_DAUGHTERS[line]).toEqual([
          CANCELLING_METHOD_MOTHER_PATTERNS[0][line],
          CANCELLING_METHOD_MOTHER_PATTERNS[1][line],
          CANCELLING_METHOD_MOTHER_PATTERNS[2][line],
          CANCELLING_METHOD_MOTHER_PATTERNS[3][line],
        ]);
      }
    });

    it("builds a full sixteen-house chart whose first eight houses are the Mothers then the Daughters", () => {
      expect(CHAPTER_ONE_CHART.houses).toHaveLength(16);
      expect(CHAPTER_ONE_CHART.houses.map((h) => h.n)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
      ]);
      for (let i = 0; i < 4; i++) {
        expect(CHAPTER_ONE_CHART.houses[i].pattern).toEqual(
          CANCELLING_METHOD_MOTHER_PATTERNS[i],
        );
      }
      for (let i = 0; i < 4; i++) {
        expect(CHAPTER_ONE_CHART.houses[i + 4].pattern).toEqual(
          CHAPTER_ONE_DAUGHTERS[i],
        );
      }
    });

    it("represents the full H9-H16 addition chain with real figures, each cross-checked against addPatterns()", () => {
      expect(CHAPTER_ONE_ADDITION_STEPS).toHaveLength(8);
      expect(CHAPTER_ONE_ADDITION_STEPS.map((s) => s.result)).toEqual([
        9, 10, 11, 12, 13, 14, 15, 16,
      ]);
      const houseByNumber = (n: number) =>
        CHAPTER_ONE_CHART.houses.find((h) => h.n === n)!.pattern;
      for (const step of CHAPTER_ONE_ADDITION_STEPS) {
        expect(step.inputPatterns[0]).toEqual(houseByNumber(step.inputs[0]));
        expect(step.inputPatterns[1]).toEqual(houseByNumber(step.inputs[1]));
        // resultPattern is recomputed via addPatterns (the same function
        // buildChart uses internally) -- it must agree with the chart's
        // own already-built house for that number.
        expect(step.resultPattern).toEqual(
          addPatterns(step.inputPatterns[0], step.inputPatterns[1]),
        );
        expect(step.resultPattern).toEqual(houseByNumber(step.result));
      }
    });

    it("gives the complete chart the source's own introductory line, quoted verbatim", () => {
      expect(COMPLETE_CHART_INTRO).toBe("So we have the chat as follows:");
    });

    it("groups every one of the sixteen houses exactly once, using the chapter's own terminology", () => {
      const allNumbers = CHART_HOUSE_GROUPS.flatMap((g) => g.houseNumbers);
      expect([...allNumbers].sort((a, b) => a - b)).toEqual(
        Array.from({ length: 16 }, (_, i) => i + 1),
      );
      const labels = CHART_HOUSE_GROUPS.map((g) => g.label);
      expect(labels.some((l) => l.includes("Mothers"))).toBe(true);
      expect(labels.some((l) => l.includes("Daughters"))).toBe(true);
    });
  });

  describe("Parity addition rule", () => {
    it("matches the protected engine's addRows() exactly, for all three worked instances", () => {
      expect(PARITY_ADDITION_EXAMPLES).toHaveLength(3);
      for (const { a, b, result } of PARITY_ADDITION_EXAMPLES) {
        expect(addRows(a, b)).toBe(result);
      }
    });
  });

  describe("Addition sequence (Mothers -> full chart)", () => {
    it("states all eight combination steps, house numbers only", () => {
      expect(ADDITION_SEQUENCE).toHaveLength(8);
      expect(ADDITION_SEQUENCE.map((s) => s.result)).toEqual([
        9, 10, 11, 12, 13, 14, 15, 16,
      ]);
    });

    it("builds Nieces from Mothers+Daughters, Witnesses from Nieces, then the Judge, then the Reconciler", () => {
      expect(ADDITION_SEQUENCE.slice(0, 4)).toEqual([
        { inputs: [1, 2], result: 9 },
        { inputs: [3, 4], result: 10 },
        { inputs: [5, 6], result: 11 },
        { inputs: [7, 8], result: 12 },
      ]);
      expect(ADDITION_SEQUENCE.slice(4, 6)).toEqual([
        { inputs: [9, 10], result: 13 },
        { inputs: [11, 12], result: 14 },
      ]);
      expect(ADDITION_SEQUENCE[6]).toEqual({ inputs: [13, 14], result: 15 });
      expect(ADDITION_SEQUENCE[7]).toEqual({ inputs: [15, 1], result: 16 });
    });
  });

  describe("Bazdaaho formula", () => {
    it("quotes the source's own transition sentence into the formula, verbatim", () => {
      expect(BAZDAAHO_METHOD_INTRO).toBe(
        "It's a method of arranging the stars from Yussif to Musah as shown below, introduced by Sheikh Abu Abdullah Azanati, using the formula:",
      );
    });

    it("has exactly the four letter-values the source table prints, each with its own row label", () => {
      expect(BAZDAAHO_FORMULA_TABLE).toHaveLength(4);
      expect(BAZDAAHO_FORMULA_TABLE.map((l) => l.value)).toEqual([2, 7, 4, 8]);
      expect(BAZDAAHO_FORMULA_TABLE.map((l) => l.rowLabel)).toEqual([
        "I",
        "I",
        "II",
        "I",
      ]);
    });

    it("uses Bāʾ, Zāy, Dāl and Ḥāʾ -- their own standard Abjad numeral values, not a modern substitution", () => {
      expect(BAZDAAHO_FORMULA_TABLE.map((l) => l.arabic)).toEqual([
        "ب",
        "ز",
        "د",
        "ح",
      ]);
      // Zāy is 7 here, matching its own standard Abjad value -- not Jīm
      // (ج), which this letter is sometimes mistaken for.
      const zay = BAZDAAHO_FORMULA_TABLE.find((l) => l.arabic === "ز");
      expect(zay?.value).toBe(7);
      expect(BAZDAAHO_FORMULA_TABLE.map((l) => l.arabic)).not.toContain("ج");
    });

    it("distinguishes the source's own literal printed glyph from the independently-verified letter, for the two rows where they differ", () => {
      const [line1, line2, line3, line4] = BAZDAAHO_FORMULA_TABLE;
      // Rows 1-2 print cleanly as Arabic in the source itself -- no
      // separate "as printed" glyph is needed for them.
      expect(line1.sourcePrintedAs).toBeUndefined();
      expect(line2.sourcePrintedAs).toBeUndefined();
      // Rows 3-4 do not print as clean Arabic script in the source; the
      // literal printed character is preserved here rather than hidden.
      expect(line3.sourcePrintedAs).toBe("Ↄ");
      expect(line4.sourcePrintedAs).toBe("Z");
    });

    it("labels each row with the figure line and element it corresponds to", () => {
      expect(BAZDAAHO_FORMULA_TABLE.map((l) => l.lineLabel)).toEqual([
        "Line 1 — Head / Fire",
        "Line 2 — Chest / Air",
        "Line 3 — Waist / Water",
        "Line 4 — Feet / Earth",
      ]);
    });

    it("has exactly the four worked examples the source prints", () => {
      expect(BAZDAAHO_WORKED_EXAMPLES).toHaveLength(4);
    });

    it("reproduces Eg. 1's own working line exactly: three values, its third (two-dot) line dropping out", () => {
      const eg1 = BAZDAAHO_WORKED_EXAMPLES[0];
      expect(eg1.values).toEqual([2, 7, 8]);
      expect(eg1.workingLine).toContain("2 + 7 + 8 = 17");
      expect(eg1.result).toBe(1);
      expect(BAZDAAHO_EG1_NOTE).toContain("two points");
      expect(BAZDAAHO_EG1_NOTE).toContain("contributes 0");
    });

    it("reproduces Eg. 3's own working line exactly", () => {
      const eg3 = BAZDAAHO_WORKED_EXAMPLES[2];
      expect(eg3.values).toEqual([7, 4, 8]);
      expect(eg3.workingLine).toContain("7 + 4 + 8 = 19");
      expect(eg3.result).toBe(3);
    });

    it("gives every worked example its actual resulting figure, looked up from the existing STARS array", () => {
      for (const example of BAZDAAHO_WORKED_EXAMPLES) {
        const { pattern } = starForBazdaahoResult(example.result);
        const star = STARS.find((s) => s.number === example.result);
        expect(star).toBeDefined();
        expect(pattern).toEqual(star!.pattern);
      }
      // The four examples' results are exactly stars 1-4, in order.
      expect(BAZDAAHO_WORKED_EXAMPLES.map((e) => e.result)).toEqual([
        1, 2, 3, 4,
      ]);
    });

    it("states the calculation rule plainly: only single-point lines contribute", () => {
      expect(BAZDAAHO_CALCULATION_RULE_NOTE).toContain("single-point");
      expect(BAZDAAHO_CALCULATION_RULE_NOTE).toContain("contributes 0");
      expect(BAZDAAHO_CALCULATION_RULE_NOTE).not.toContain(
        "does not match the sum",
      );
    });

    it("does not describe Eg. 1 as containing an arithmetic error", () => {
      expect(BAZDAAHO_EG1_NOTE).not.toContain("does not match");
      expect(BAZDAAHO_EG1_NOTE).not.toContain("error");
    });
  });

  describe("Bazdaaho general derivation rule", () => {
    it("holds the source's own four line-values in line order", () => {
      expect(BAZDAAHO_LINE_VALUES).toEqual([2, 7, 4, 8]);
    });

    it("derives the correct Bazdaaho number for every star numbered 1-15 from its own pattern", () => {
      for (const star of STARS) {
        if (star.number === 16) continue;
        expect(bazdaahoNumberFromPattern(star.pattern)).toBe(star.number);
      }
    });

    it("does not invent a >16 reduction for a raw sum of 0 (Musah, whose pattern is all two-dot lines)", () => {
      const musah = STARS.find((s) => s.name === "Musah");
      expect(musah).toBeDefined();
      expect(musah!.pattern).toEqual([2, 2, 2, 2]);
      // The source states the -16 reduction only for totals greater than
      // 16; a raw sum of 0 is not >16, so it is returned as-is rather than
      // silently mapped to 16.
      expect(bazdaahoNumberFromPattern(musah!.pattern)).toBe(0);
    });

    it("matches Eg. 1's own working line: Yussif's two-dot third line drops the Dal (4) term", () => {
      const yussif = STARS.find((s) => s.name === "Yussif");
      expect(yussif!.pattern).toEqual([1, 1, 2, 1]);
      expect(bazdaahoNumberFromPattern(yussif!.pattern)).toBe(1);
    });

    it("validates the all-active case (2+7+4+8=21-16=5), clearly marked as independent verification, not a source example", () => {
      expect(BAZDAAHO_ALL_ACTIVE_VALIDATION.values).toEqual([2, 7, 4, 8]);
      expect(BAZDAAHO_ALL_ACTIVE_VALIDATION.workingLine).toContain(
        "2 + 7 + 4 + 8 = 21",
      );
      expect(BAZDAAHO_ALL_ACTIVE_VALIDATION.result).toBe(5);
      const ibrahim = STARS.find((s) => s.name === "Ibrahim");
      expect(ibrahim!.pattern).toEqual([1, 1, 1, 1]);
      expect(bazdaahoNumberFromPattern(ibrahim!.pattern)).toBe(5);
      expect(ibrahim!.number).toBe(5);
    });

    it("does not print 21 as an error -- it is the expected total when all four lines are active", () => {
      expect(BAZDAAHO_ALL_ACTIVE_VALIDATION.workingLine).not.toContain("error");
    });

    it("documents Musah's position-16 placement as a source-stated convention, not a derived '0 means 16' rule", () => {
      expect(BAZDAAHO_POSITION_16_NOTE).toContain("0");
      expect(BAZDAAHO_POSITION_16_NOTE).not.toContain("0 means 16");
      expect(BAZDAAHO_POSITION_16_NOTE.toLowerCase()).toContain(
        "source's own arrangement",
      );
    });
  });

  describe("Full 16-figure Bazdaaho validation", () => {
    it("has exactly sixteen audited positions", () => {
      expect(BAZDAAHO_POSITION_AUDIT).toHaveLength(16);
    });

    it("accounts for every position 1-16 exactly once, with no duplicate and no missing position", () => {
      const positions = BAZDAAHO_POSITION_AUDIT.map((a) => a.position);
      expect([...positions].sort((a, b) => a - b)).toEqual(
        Array.from({ length: 16 }, (_, i) => i + 1),
      );
      expect(Array.from(new Set(positions))).toHaveLength(16);
    });

    it("gives every position a distinct four-line pattern -- no two positions share a pattern", () => {
      const patternKeys = BAZDAAHO_POSITION_AUDIT.map((a) =>
        a.pattern.join(""),
      );
      expect(Array.from(new Set(patternKeys))).toHaveLength(16);
    });

    it("matches every audited position to its existing canonical star in STARS by number and pattern -- no guessed mapping", () => {
      for (const entry of BAZDAAHO_POSITION_AUDIT) {
        const star = STARS.find((s) => s.number === entry.position);
        expect(star).toBeDefined();
        expect(star!.id).toBe(entry.starId);
        expect(star!.name).toBe(entry.starName);
        expect(star!.pattern).toEqual(entry.pattern);
      }
    });

    it("reduces every position's own active-value total to exactly its own position number, for positions 1-15", () => {
      for (const entry of BAZDAAHO_POSITION_AUDIT) {
        if (entry.position === 16) continue;
        expect(entry.reducedPosition).toBe(entry.position);
      }
    });

    it("applies the >16 reduction only where the raw total actually exceeds 16", () => {
      for (const entry of BAZDAAHO_POSITION_AUDIT) {
        const expectedReduced =
          entry.rawTotal > 16 ? entry.rawTotal - 16 : entry.rawTotal;
        expect(entry.reducedPosition).toBe(expectedReduced);
      }
    });

    it("gives position 16 (Musah) a raw total of 0, not derived from arithmetic to equal 16", () => {
      const musah = BAZDAAHO_POSITION_AUDIT.find((a) => a.position === 16)!;
      expect(musah.pattern).toEqual([2, 2, 2, 2]);
      expect(musah.activeValues).toEqual([]);
      expect(musah.rawTotal).toBe(0);
      expect(musah.reducedPosition).toBe(0);
    });

    it("matches every position to the expected star name 1-16, using only the existing canonical STARS identities", () => {
      const EXPECTED_NAMES: Record<number, string> = {
        1: "Yussif",
        2: "Adam",
        3: "Mahadi",
        4: "Iddris",
        5: "Ibrahim",
        6: "Issah",
        7: "Umar",
        8: "Ayuba",
        9: "Kalla Allahu",
        10: "Sulemana",
        11: "Ali",
        12: "Nuhu",
        13: "Hassan & Hussein",
        14: "Yunus",
        15: "Usman",
        16: "Musah",
      };
      for (const [position, name] of Object.entries(EXPECTED_NAMES)) {
        const entry = BAZDAAHO_POSITION_AUDIT.find(
          (a) => a.position === Number(position),
        );
        expect(entry).toBeDefined();
        expect(entry!.starName).toBe(name);
      }
    });

    describe("Position 11 (Ali) reconciliation", () => {
      it("uses the canonical Ali pattern [2,1,1,2], which calculates 7+4=11", () => {
        const ali = BAZDAAHO_POSITION_AUDIT.find((a) => a.position === 11)!;
        expect(ali.starName).toBe("Ali");
        expect(ali.pattern).toEqual([2, 1, 1, 2]);
        expect(ali.activeValues).toEqual([7, 4]);
        expect(ali.rawTotal).toBe(11);
        expect(ali.reducedPosition).toBe(11);
      });

      it("confirms the source-printed pattern [2,1,2,2] calculates to 7 and so must not be assigned to position 11", () => {
        expect(bazdaahoNumberFromPattern([2, 1, 2, 2])).toBe(7);
        const ali = BAZDAAHO_POSITION_AUDIT.find((a) => a.position === 11)!;
        expect(ali.pattern).not.toEqual([2, 1, 2, 2]);
      });

      it("leaves position 7 (Umar) on its own existing canonical figure, unaffected by the position-11 reconciliation", () => {
        const umar = BAZDAAHO_POSITION_AUDIT.find((a) => a.position === 7)!;
        expect(umar.starName).toBe("Umar");
        expect(umar.pattern).toEqual([2, 1, 2, 2]);
        expect(umar.rawTotal).toBe(7);
        expect(umar.reducedPosition).toBe(7);
      });

      it("records the reconciliation with careful, non-committal language, not a claimed proven error", () => {
        expect(BAZDAAHO_SOURCE_RECONCILIATION_NOTES.length).toBeGreaterThan(0);
        const reconciliation = BAZDAAHO_SOURCE_RECONCILIATION_NOTES.find(
          (r) => r.position === 11,
        );
        expect(reconciliation).toBeDefined();
        expect(reconciliation!.sourcePrintedPattern).toEqual([2, 1, 2, 2]);
        expect(reconciliation!.sourceCalculatedResult).toBe(7);
        expect(reconciliation!.canonicalPattern).toEqual([2, 1, 1, 2]);
        expect(reconciliation!.canonicalCalculatedResult).toBe(11);
        expect(reconciliation!.note).toContain("appears to print");
        expect(reconciliation!.note.toLowerCase()).not.toContain(
          "typographical error",
        );
        expect(reconciliation!.note.toLowerCase()).not.toContain(
          "proven error",
        );
      });
    });

    it("gives no two canonical stars the same Bazdaaho position -- a true one-to-one 1-16 arrangement", () => {
      const positions = BAZDAAHO_POSITION_AUDIT.map((a) => a.position);
      expect(new Set(positions).size).toBe(BAZDAAHO_POSITION_AUDIT.length);
      const starIds = BAZDAAHO_POSITION_AUDIT.map((a) => a.starId);
      expect(new Set(starIds).size).toBe(BAZDAAHO_POSITION_AUDIT.length);
    });
  });

  describe("Complete Bazdaaho arrangement (stars 1-16)", () => {
    it("preserves the source's own three printed rows and their exact left-to-right order", () => {
      expect(BAZDAAHO_ARRANGEMENT).toHaveLength(3);
      expect(BAZDAAHO_ARRANGEMENT[0].starNumbers).toEqual([
        8, 7, 6, 5, 4, 3, 2, 1,
      ]);
      expect(BAZDAAHO_ARRANGEMENT[1].starNumbers).toEqual([12, 11, 10, 9]);
      expect(BAZDAAHO_ARRANGEMENT[2].starNumbers).toEqual([14, 15, 13, 16]);
    });

    it("represents every one of the sixteen stars exactly once -- no duplicate, no omission", () => {
      const allNumbers = BAZDAAHO_ARRANGEMENT.flatMap((g) => g.starNumbers);
      expect(allNumbers).toHaveLength(16);
      expect(Array.from(new Set(allNumbers))).toHaveLength(16);
      expect([...allNumbers].sort((a, b) => a - b)).toEqual(
        Array.from({ length: 16 }, (_, i) => i + 1),
      );
    });

    it("gives every star in the arrangement its existing canonical figure from STARS -- no second star-definition", () => {
      for (const group of BAZDAAHO_ARRANGEMENT) {
        for (const n of group.starNumbers) {
          const star = STARS.find((s) => s.number === n);
          expect(star).toBeDefined();
          expect(star!.pattern).toHaveLength(4);
        }
      }
    });
  });
});
