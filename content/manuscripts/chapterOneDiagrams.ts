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

import { STARS, type Pattern } from "@/content/stars";

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
 * text layer (page 5); no remainder value is computed or asserted here,
 * since the source itself does not label one at this point in the text. */
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

/** The Bazdaaho formula's letter-to-value table (page 6), transcribed from
 * the PDF's own clean text layer. One character could not be identified
 * with confidence — the source prints it as "Ͻ", which does not match a
 * standard Arabic letterform in the extracted text; it is reproduced
 * exactly as printed rather than guessed at, per the arabicLetterNote. */
export interface BazdaahoLetterValue {
  arabic: string;
  value: number;
  /** Present only for the one character the extraction could not resolve
   * to a standard letterform with confidence. */
  note?: string;
}

export const BAZDAAHO_FORMULA_TABLE: BazdaahoLetterValue[] = [
  { arabic: "ب", value: 2 },
  { arabic: "ز", value: 7 },
  {
    arabic: "Ͻ",
    value: 4,
    note: "Printed exactly as it extracts from the source; this does not match a standard Arabic letterform, and none is substituted for it.",
  },
  { arabic: "Z", value: 8 },
];

export interface BazdaahoWorkedExample {
  label: string; // "Eg. 1." etc
  /** The letter-values added, e.g. [2,7,4,8] for Eg.1. */
  values: number[];
  /** The source's own reduction line, exactly as printed, e.g. "2+7+8 = 17 – 16=1". */
  workingLine: string;
  result: number;
}

// Eg. 1 sums all four letter-values (2+7+4+8=21-16=5) in the table above it,
// but the source's own worked line only adds three of them and reaches a
// different total (2+7+8=17-16=1) — reproduced exactly as printed rather
// than corrected or recomputed; see BAZDAAHO_EG1_NOTE.
export const BAZDAAHO_EG1_NOTE =
  "The source's own working line for Eg. 1 reads \"2+7+8 = 17 – 16 = 1, therefore it's 1\" — three of the four table values, not four. Reproduced exactly as printed; nothing here recomputes or corrects it.";

export const BAZDAAHO_WORKED_EXAMPLES: BazdaahoWorkedExample[] = [
  {
    label: "Eg. 1.",
    values: [2, 7, 8],
    workingLine: "2 + 7 + 8 = 17 – 16 = 1, therefore it’s 1",
    result: 1,
  },
  { label: "Eg. 2.", values: [2], workingLine: "= 2", result: 2 },
  {
    label: "Eg. 3.",
    values: [7, 4, 8],
    workingLine: "= 7 + 4 + 8 = 19 – 16 = 3",
    result: 3,
  },
  { label: "Eg. 4.", values: [4], workingLine: "= 4", result: 4 },
];
