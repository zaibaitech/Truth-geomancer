// The instructional diagrams for Chapter One, "How to Draw a Chart in
// Geomancy" (source pages 4-6), restored alongside the chapter's existing
// prose in content/manuscripts/master-of-geomancy-vol1.ts. This file
// supplies the worked examples and diagrams the source teaches the methods
// with — nothing here replaces or edits the chapter's own prose body.
//
// HOW THE COUNTING METHOD'S DOT FIGURES WERE VERIFIED
//
// The source's counting-method examples label each circled line with a raw
// tally (e.g. "① = 10 ="), followed by a hand-drawn dot figure. Cropping and
// magnifying those figures and counting dots row by row gave, for all six
// labelled examples on the page (10, 12, 14, 18-16=2, 13, 15 — the other two,
// 18-16=2 and 19-16=3, repeat and confirm the same rule): the figure drawn
// for the reduced count N is exactly the four-line pattern already stored as
// STARS.find(s => s.number === N).pattern — i.e. the manuscript's own
// Bazdaaho numbering (Yussif=1 ... Musah=16). Six for six matched exactly
// (10->Sulemana[1,2,2,1], 12->Nuhu[2,2,1,1], 14->Yunus[1,2,1,1],
// 18-16=2->Adam[1,2,2,2], 13->Hassan & Hussein[1,1,1,2], 15->Usman[2,1,2,1]).
// That match is treated as a verified rule below — the figures are derived
// from the existing, already-tested STARS array, not re-guessed or hand
// coded a second time. Those six names are internal/source metadata only
// (used for the diagram's aria-labels and its own regression tests) — the
// visible Chapter 1 demonstration below shows the source's own circled line
// numbers and its "4 3 2 1" result order, never a star's personal name, per
// the source-fidelity correction in Prompt 28.
//
// The source draws each example's raw count as a literal row of dots that a
// reader can count — not merely a numeral. COUNTING_METHOD_EXAMPLES'
// rawCount field is that literal dot count (18 and 19 before the source's
// own stated subtract-16 reduction, exactly as drawn); the diagram renders
// that many marks. Nothing here reduces or re-derives rawCount — it is
// transcribed directly from the source's own arithmetic line for each entry.
//
// The Cancelling Method's four worked examples, by contrast, are typeset
// tally marks (not hand-drawn), extracted cleanly from the PDF's own text
// layer — reproduced verbatim below as CANCELLING_METHOD_EXAMPLES. The
// source does not label these four examples with a stated numeric result
// the way it does for the Counting Method, so none is computed or asserted
// here; the tokens are shown exactly as printed, and no remainder value is
// invented for them. (The general parity rule the book gives afterward —
// "2+2=2, 1+2=1, 1+1=2" — already has its own place in the existing chapter
// body and in the protected engine's addRows(); it is not re-derived here.)

import { STARS, type DotRow, type Pattern } from "@/content/stars";
import {
  addPatterns,
  buildChart,
  deriveDaughters,
  type Chart,
} from "@/lib/raml/casting";

/** The circled line numbers the source prints beside each counting line
 * (①②③④), in drawing order. */
export type CircledNumber = "①" | "②" | "③" | "④";
export const CIRCLED_NUMBERS: readonly CircledNumber[] = ["①", "②", "③", "④"];

export interface CountingMethodLine {
  /** The source's own circled line number, in drawing order. */
  circledNumber: CircledNumber;
  /** The literal number of dots the source draws for this line, before any
   * reduction — this is what the rendered row of marks counts out. For a
   * line the source reduces (e.g. "18 - 16 = 2"), this is 18, not 2. */
  rawCount: number;
  /** The arithmetic exactly as the source prints it for this line, e.g.
   * "10" or "18 - 16 = 2". */
  arithmeticLabel: string;
  /** The value after the source's own stated reduction — used only to look
   * up the resulting star pattern, never recomputed here. */
  reducedValue: number;
}

export interface CountingMethodExample {
  label: string; // "e.g." as printed
  lines: CountingMethodLine[]; // four lines, in the source's own drawing order (1st to 4th)
  /** The source's own display order for the four resulting figures, drawn
   * on the right as a small result strip labelled "4 3 2 1" (the reverse of
   * drawing order) — each entry is a 1-based line number, e.g. [4,3,2,1]
   * means: show line 4's figure first, then line 3's, then line 2's, then
   * line 1's. Matches the source's own stated counting direction (starting
   * from the fourth line, right to left) rather than the drawing order. */
  resultOrder: [number, number, number, number];
}

export function starForCount(reducedValue: number): {
  name: string;
  pattern: Pattern;
} {
  const star = STARS.find((s) => s.number === reducedValue);
  if (!star)
    throw new Error(`No star numbered ${reducedValue} in content/stars.ts`);
  return { name: star.name, pattern: star.pattern };
}

// Both example sets from page 4 of the source, transcribed exactly —
// including the source's own reduction arithmetic and raw (pre-reduction)
// dot counts where it shows one.
export const COUNTING_METHOD_EXAMPLES: CountingMethodExample[] = [
  {
    label: "e.g.",
    lines: [
      {
        circledNumber: "①",
        rawCount: 10,
        arithmeticLabel: "10",
        reducedValue: 10,
      },
      {
        circledNumber: "②",
        rawCount: 12,
        arithmeticLabel: "12",
        reducedValue: 12,
      },
      {
        circledNumber: "③",
        rawCount: 14,
        arithmeticLabel: "14",
        reducedValue: 14,
      },
      {
        circledNumber: "④",
        rawCount: 18,
        arithmeticLabel: "18 - 16 = 2",
        reducedValue: 2,
      },
    ],
    resultOrder: [4, 3, 2, 1],
  },
  {
    label: "e.g.",
    lines: [
      {
        circledNumber: "①",
        rawCount: 13,
        arithmeticLabel: "13",
        reducedValue: 13,
      },
      {
        circledNumber: "②",
        rawCount: 15,
        arithmeticLabel: "15",
        reducedValue: 15,
      },
      {
        circledNumber: "③",
        rawCount: 18,
        arithmeticLabel: "18 - 16 = 2",
        reducedValue: 2,
      },
      {
        circledNumber: "④",
        rawCount: 19,
        arithmeticLabel: "19 - 16 = 3",
        reducedValue: 3,
      },
    ],
    resultOrder: [4, 3, 2, 1],
  },
];

/** The source's own instruction on counting direction, printed between the
 * two worked examples: counting starts at the fourth (bottom) line, reading
 * right to left — quoted verbatim, not paraphrased, and not extended beyond
 * what is quoted (the source page's own continuation past this point is not
 * independently verified here). */
export const COUNTING_DIRECTION_NOTE =
  "Starting counting from 4th line from your right to the left…";

/** The source's own closing line under the Counting Method's examples. */
export const COUNTING_METHOD_CLOSING =
  "This first 4 is called umuhat mother stars.";

/** One worked Cancelling Method example: four lines of typeset tally
 * tokens, exactly as the source prints them — a lone "|" for an uncancelled
 * mark, "||" for a cancelled pair. Transcribed verbatim from the PDF's own
 * text layer (page 5). Each example's four lines are the source's own
 * worked demonstration of one Mother Star (Eg. 1 -> Mother Star 1, Eg. 2 ->
 * Mother Star 2, and so on — "Repeat three more times for Mothers two,
 * three and four."); see cancelledLineMark below for how each line's
 * resulting mark is read off these same tokens. */
export interface CancellingMethodExample {
  label: string; // "Eg. 1." etc, as printed
  lines: string[][]; // four lines, each an ordered array of '|' | '||' tokens
}

export const CANCELLING_METHOD_EXAMPLES: CancellingMethodExample[] = [
  {
    label: "Eg. 1.",
    lines: [
      ["|", "||", "||", "||", "||", "||"],
      ["||", "||", "||", "||", "||", "||", "||", "||"],
      ["|", "||", "||", "||", "||", "||", "||", "||", "||"],
      ["|", "||", "||", "||", "||", "||", "||", "||", "||", "||", "||"],
    ],
  },
  {
    label: "Eg. 2.",
    lines: [
      ["|", "||", "||", "||", "||", "||"],
      ["||", "||", "||", "||", "||", "||", "||", "||"],
      ["|", "||", "||", "||", "||", "||", "||", "||", "||"],
      ["|", "||", "||", "||", "||", "||", "||", "||", "||", "||", "||"],
    ],
  },
  {
    label: "Eg. 3.",
    lines: [
      ["|", "||", "||", "||", "||", "||"],
      ["|", "||", "||", "||", "||", "||", "||"],
      ["|", "||", "||", "||", "||", "||", "||", "||"],
      ["|", "||", "||", "||", "||", "||", "||", "||", "||", "||"],
    ],
  },
  {
    label: "Eg. 4.",
    lines: [
      ["||", "||", "||", "||", "||"],
      ["||", "||", "||", "||", "||", "||", "||"],
      ["|", "||", "||", "||", "||", "||", "||", "||", "||"],
      ["|", "||", "||", "||", "||", "||", "||", "||", "||", "||"],
    ],
  },
];

/** The remaining dot(s) after cancelling one line's already-transcribed
 * tokens in pairs: a lone "|" survives uncancelled — an odd total, so the
 * line's mark is a single dot; when every token is "||" (an even total,
 * everything pairs off), the line's mark is two dots. This is the same
 * odd/even convention already stated in the chapter's own prose ("What is
 * left over — one dot, or two — becomes that line's mark") and cross-tested
 * elsewhere in this file against the protected engine's addRows() via
 * PARITY_ADDITION_EXAMPLES — applied here to the tokens already transcribed
 * above, not to any new source reading or a different formula. Every line
 * in every example carries at most one lone "|" token, so this is
 * unambiguous. */
export function cancelledLineMark(tokens: string[]): DotRow {
  return tokens.includes("|") ? 1 : 2;
}

/** One example's four lines, each reduced by cancelledLineMark and stacked
 * top-to-bottom — the example's own worked Mother Star. */
export function cancellingMotherPattern(
  example: CancellingMethodExample,
): Pattern {
  const [l1, l2, l3, l4] = example.lines.map(cancelledLineMark);
  return [l1, l2, l3, l4];
}

/** The four Mother Stars, one per worked example, in order. */
export const CANCELLING_METHOD_MOTHER_PATTERNS: [
  Pattern,
  Pattern,
  Pattern,
  Pattern,
] = CANCELLING_METHOD_EXAMPLES.map(cancellingMotherPattern) as [
  Pattern,
  Pattern,
  Pattern,
  Pattern,
];

/** The direction the source states cancellation proceeds in, for every
 * line: pairs are cancelled starting from the right-hand side, moving
 * left. Restated as a short caption for the diagram, not a new rule. */
export const CANCEL_DIRECTION_LABEL = "Cancel pairs from right → left";

/** The source's own line after the four Cancelling Method examples,
 * introducing the Banaat (Children stars) — quoted verbatim. */
export const CANCELLING_METHOD_CLOSING =
  "So we have 4 stars as the umuhat (Mother stars) as shown above, from there, use the first 4 stars to get the second 4 (Banaat - Children stars) in geomancy.";

/** The book's own parity rule for combining two lines into one, restated
 * here as data for the diagram. Matches the protected engine's addRows()
 * exactly (same parity -> double dot, different parity -> single dot) and
 * the existing chapter body's own paraphrase — this is not a new rule,
 * just the source's three worked instances of the one rule. */
export const PARITY_ADDITION_EXAMPLES: { a: 1 | 2; b: 1 | 2; result: 1 | 2 }[] =
  [
    { a: 2, b: 2, result: 2 },
    { a: 1, b: 2, result: 1 },
    { a: 1, b: 1, result: 2 },
  ];

/** The exact combination sequence the source states in "In adding stars:"
 * (page 5) for building the full sixteen-house chart from the four Mothers.
 * house numbers only — no specific figure values are asserted, since this
 * chapter is a structural/educational restatement of the already-existing,
 * unmodified chart-building sequence (buildChart in the protected engine),
 * not a re-derivation of it. */
export const ADDITION_SEQUENCE: { inputs: [number, number]; result: number }[] =
  [
    { inputs: [1, 2], result: 9 },
    { inputs: [3, 4], result: 10 },
    { inputs: [5, 6], result: 11 },
    { inputs: [7, 8], result: 12 },
    { inputs: [9, 10], result: 13 },
    { inputs: [11, 12], result: 14 },
    { inputs: [13, 14], result: 15 },
    { inputs: [15, 1], result: 16 },
  ];

// ----------------------------------------------------------------------
// The complete Chapter 1 chart, built from the four Mother patterns above
// using the SAME protected chart-building logic the live casting flow
// uses — buildChart / deriveDaughters / addPatterns, imported read-only
// from lib/raml/casting.ts and never reimplemented or modified here. This
// is a deliberate exception to this file's usual practice of keeping
// Chapter 1's educational data independent of the engine: this prompt
// explicitly asks for "the existing geomancy figure-combination logic" for
// the Mother -> Children -> H16 sequence and the complete chart, so the
// protected, already-tested functions are called directly rather than
// hand-duplicated a second time.

/** The four Daughters (Banaat), derived from the four Mother patterns by
 * reading across their corresponding lines — deriveDaughters is the same
 * function the live casting flow uses, called here read-only. */
export const CHAPTER_ONE_DAUGHTERS: Pattern[] = deriveDaughters(
  CANCELLING_METHOD_MOTHER_PATTERNS,
);

/** The full sixteen-house chart built from this chapter's own four worked
 * Mother Stars — buildChart, called read-only, exactly as the live casting
 * flow calls it. */
export const CHAPTER_ONE_CHART: Chart = buildChart(
  CANCELLING_METHOD_MOTHER_PATTERNS,
);

function houseByNumber(n: number): Pattern {
  const house = CHAPTER_ONE_CHART.houses.find((h) => h.n === n);
  if (!house) throw new Error(`No house ${n} in the Chapter 1 chart`);
  return house.pattern;
}

export interface ChartAdditionStep {
  inputs: [number, number];
  result: number;
  inputPatterns: [Pattern, Pattern];
  /** Recomputed here via addPatterns (the same function buildChart uses
   * internally) so the diagram can show real figures at each step; always
   * equal to houseByNumber(result) — see the cross-check in
   * chapterOneDiagrams.test.ts. */
  resultPattern: Pattern;
}

/** The "In adding stars" sequence (H1+H2->H9 ... H15+H1->H16), now carrying
 * each step's real input and result figures from this chapter's own chart,
 * not abstract placeholders. */
export const CHAPTER_ONE_ADDITION_STEPS: ChartAdditionStep[] =
  ADDITION_SEQUENCE.map((step) => {
    const a = houseByNumber(step.inputs[0]);
    const b = houseByNumber(step.inputs[1]);
    return {
      inputs: step.inputs,
      result: step.result,
      inputPatterns: [a, b],
      resultPattern: addPatterns(a, b),
    };
  });

export const COMPLETE_CHART_INTRO = "So we have the chat as follows:";

export interface ChartHouseGroup {
  label: string;
  houseNumbers: number[];
}

/** The chart's sixteen houses, grouped by the chapter's own terminology
 * (Umuhat/Mothers, Banaat/Daughters, Nieces, Witnesses, Judge, Reconciler
 * — all already used in the chapter's existing prose body, not new terms
 * introduced here) for the complete-chart diagram's labelling. */
export const CHART_HOUSE_GROUPS: ChartHouseGroup[] = [
  { label: "Mothers — Umuhat", houseNumbers: [1, 2, 3, 4] },
  { label: "Daughters — Banaat", houseNumbers: [5, 6, 7, 8] },
  { label: "Nieces", houseNumbers: [9, 10, 11, 12] },
  { label: "Witnesses", houseNumbers: [13, 14] },
  { label: "Judge", houseNumbers: [15] },
  { label: "Reconciler", houseNumbers: [16] },
];

/** The Bazdaaho formula's letter-to-value table (page 6): the source's own
 * four-letter correspondence, one letter per figure line, in line order.
 * This is a special Bazdaaho correspondence, not the standard modern Abjad
 * value for these letters — most notably Zāy here is 7, not its standard
 * Abjad value. rowLabel is the source's own "I"/"II" mark printed beside
 * each row — transcribed as given, not interpreted into a different
 * notation. lineLabel names which of the figure's four lines (and its
 * associated element) each letter corresponds to. */
export interface BazdaahoLetterValue {
  rowLabel: string;
  arabic: string;
  value: number;
  /** Which figure line this letter values, e.g. "Line 1 — Head / Fire". */
  lineLabel: string;
}

export const BAZDAAHO_FORMULA_TABLE: BazdaahoLetterValue[] = [
  { rowLabel: "I", arabic: "ب", value: 2, lineLabel: "Line 1 — Head / Fire" },
  { rowLabel: "I", arabic: "ز", value: 7, lineLabel: "Line 2 — Chest / Air" },
  {
    rowLabel: "II",
    arabic: "د",
    value: 4,
    lineLabel: "Line 3 — Waist / Water",
  },
  { rowLabel: "I", arabic: "هـ", value: 8, lineLabel: "Line 4 — Feet / Earth" },
];

/** The formula's per-line values in line order [Line1, Line2, Line3, Line4]
 * — the same four values as BAZDAAHO_FORMULA_TABLE, kept separately for the
 * general derivation rule below. */
export const BAZDAAHO_LINE_VALUES: [number, number, number, number] = [
  2, 7, 4, 8,
];

/** The general Bazdaaho derivation rule (page 6): for each of a figure's
 * four lines, a line with ONE dot contributes its BAZDAAHO_LINE_VALUES
 * value; a line with TWO dots contributes 0. Sum the active values; if the
 * total exceeds 16, the figure number is total − 16. Implements exactly
 * the source-stated rule — a raw sum of 0 (Musah, whose pattern is all
 * two-dot lines) is returned as 0, not silently mapped to 16, since the
 * source states the subtraction only for totals greater than 16. */
export function bazdaahoNumberFromPattern(pattern: Pattern): number {
  const total = pattern.reduce(
    (sum, dots, i) => sum + (dots === 1 ? BAZDAAHO_LINE_VALUES[i] : 0),
    0,
  );
  return total > 16 ? total - 16 : total;
}

export interface BazdaahoWorkedExample {
  label: string; // "Eg. 1." etc
  /** The letter-values added, e.g. [2,7,8] for Eg.1 (Line 3's two-dot
   * line contributes 0 and is omitted, per the general derivation rule). */
  values: number[];
  /** The source's own reduction line, exactly as printed, e.g. "2+7+8 = 17 – 16=1". */
  workingLine: string;
  /** The example's resulting value — also that star's own Bazdaaho number
   * (1-4 for these four examples), used only to look up its already-
   * canonical figure in STARS via starForBazdaahoResult, never recomputed. */
  result: number;
}

// Eg. 1's own printed working line adds only three of the four letter-
// values (2, 7, 8), omitting the Line-3 (Dal) value entirely -- this is
// the general derivation rule at work, not an omission: Eg.1's figure
// (Yussif) has two dots on its third line, so per the rule that line
// contributes 0 and drops out of the sum. See BAZDAAHO_EG1_NOTE.
export const BAZDAAHO_EG1_NOTE =
  "The source's own working line for Eg. 1 reads \"2 + 7 + 8 = 17 − 16 = 1, therefore it's 1\" — only three of the four letter-values appear because Eg. 1's figure has two dots on its third (Dal) line, which contributes 0 under the general rule: a two-dot line drops out of the sum rather than adding its value.";

export const BAZDAAHO_WORKED_EXAMPLES: BazdaahoWorkedExample[] = [
  {
    label: "Eg. 1.",
    values: [2, 7, 8],
    workingLine: "2 + 7 + 8 = 17 − 16 = 1, therefore it’s 1",
    result: 1,
  },
  { label: "Eg. 2.", values: [2], workingLine: "= 2", result: 2 },
  {
    label: "Eg. 3.",
    values: [7, 4, 8],
    workingLine: "= 7 + 4 + 8 = 19 − 16 = 3",
    result: 3,
  },
  { label: "Eg. 4.", values: [4], workingLine: "= 4", result: 4 },
];

/** The source's own transition sentence into the formula, quoted verbatim
 * (page 6): "It's a method of arranging the stars from Yussif to Musah as
 * shown below, introduced by Sheikh Abu Abdullah Azanati, using the
 * formula:" — the chapter's existing prose body already paraphrases this
 * elsewhere; this is the literal sentence as printed, placed directly
 * above the formula it introduces. */
export const BAZDAAHO_METHOD_INTRO =
  "It's a method of arranging the stars from Yussif to Musah as shown below, introduced by Sheikh Abu Abdullah Azanati, using the formula:";

/** Looks up a Bazdaaho worked example's resulting star — the example's
 * result value IS that star's own Bazdaaho number (STARS' existing
 * canonical numbering, Yussif=1 ... Musah=16), so this reuses STARS
 * directly rather than creating a second star-definition system. */
export function starForBazdaahoResult(result: number): {
  name: string;
  pattern: Pattern;
} {
  const star = STARS.find((s) => s.number === result);
  if (!star) throw new Error(`No star numbered ${result} in content/stars.ts`);
  return { name: star.name, pattern: star.pattern };
}

/** The complete Bazdaaho arrangement (page 6): all sixteen stars, laid out
 * exactly as the source's own three rows show them — star numbers only,
 * left-to-right in the source's own printed order (not renumbered
 * ascending). Each row's figures are looked up from the existing STARS
 * array by number, never a second star-definition. */
export interface BazdaahoArrangementGroup {
  label: string;
  starNumbers: number[];
}

export const BAZDAAHO_ARRANGEMENT: BazdaahoArrangementGroup[] = [
  { label: "Stars 1–8", starNumbers: [8, 7, 6, 5, 4, 3, 2, 1] },
  { label: "Stars 9–12", starNumbers: [12, 11, 10, 9] },
  { label: "Stars 13–16", starNumbers: [14, 15, 13, 16] },
];
