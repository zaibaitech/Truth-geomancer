import { describe, expect, it } from "vitest";
import { STARS } from "@/content/stars";
import { addRows } from "@/lib/raml/casting";
import {
  ADDITION_SEQUENCE,
  BAZDAAHO_EG1_NOTE,
  BAZDAAHO_FORMULA_TABLE,
  BAZDAAHO_WORKED_EXAMPLES,
  CANCELLING_METHOD_EXAMPLES,
  CIRCLED_NUMBERS,
  COUNTING_DIRECTION_NOTE,
  COUNTING_METHOD_CLOSING,
  COUNTING_METHOD_EXAMPLES,
  PARITY_ADDITION_EXAMPLES,
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

    it("does not assert an invented per-line remainder value", () => {
      // Deliberately no numeric "result" field anywhere in this data --
      // the source does not label one for the Cancelling Method examples,
      // unlike the Counting Method's stated raw counts.
      for (const example of CANCELLING_METHOD_EXAMPLES) {
        expect(example).not.toHaveProperty("result");
        expect(example).not.toHaveProperty("reducedValue");
      }
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
    it("has exactly the four letter-values the source table prints", () => {
      expect(BAZDAAHO_FORMULA_TABLE).toHaveLength(4);
      expect(BAZDAAHO_FORMULA_TABLE.map((l) => l.value)).toEqual([2, 7, 4, 8]);
    });

    it("flags the one glyph the extraction could not resolve, rather than guessing at it", () => {
      const flagged = BAZDAAHO_FORMULA_TABLE.filter((l) => l.note);
      expect(flagged).toHaveLength(1);
      expect(flagged[0].arabic).toBe("Ͻ");
    });

    it("has exactly the four worked examples the source prints", () => {
      expect(BAZDAAHO_WORKED_EXAMPLES).toHaveLength(4);
    });

    it("reproduces Eg. 1's own working line exactly, without silently correcting its arithmetic", () => {
      const eg1 = BAZDAAHO_WORKED_EXAMPLES[0];
      // The table above lists 4 values (2,7,4,8) but Eg.1's own working
      // line only adds 3 of them (2+7+8=17-16=1) -- reproduced as printed.
      expect(eg1.values).toEqual([2, 7, 8]);
      expect(eg1.workingLine).toContain("2 + 7 + 8 = 17");
      expect(eg1.result).toBe(1);
      expect(BAZDAAHO_EG1_NOTE).toContain("three of the four table values");
    });
  });
});
