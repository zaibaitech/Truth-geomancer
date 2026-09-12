// Source: Kanzul Mikban, Chapter 105 — "Which Part of the Body Is Paining
// the Sick Person" (id "which-part-of-the-body-is-paining-the"). One
// method: extract each of the 4 elements from the SAME fixed house set
// (h3, h7, h10, h15) — one new synthetic figure per element, all four
// drawn from the identical houses (unlike the ch.62/67/74/96 "quartet"
// mechanic, which extracts one element from four DIFFERENT quartets) —
// sum all four via ADD_FIGURES, then search the whole chart for which
// house the result matches, and look that house number up in Chapter
// 106's own body-part table (explicitly cross-referenced by this
// chapter's own text: "see Chapter One Hundred and Six, below").
//
// Chapter 106 itself ("Parts of the Human Body and the Stars Representing
// Them") is a plain reference table, not a chart-verdict question — it
// has no calculation of its own, just a house-number -> body-part
// mapping — so it is not registered as its own QuestionDefinition,
// exactly like content/classicalAttributes.ts is not; its 16 entries are
// reproduced here as the lookup this chapter's own cross-reference
// points to. If the result matches zero or more than one house, the
// source doesn't say which to prefer — left `uncertain`, matching the
// chapter 98 "causes of death" precedent for the same shape of ambiguity.
// resultKind 'descriptive': identifying a body part is a factual answer.

import { ADD_FIGURES, CHECK_HOUSE, EXTRACT_ELEMENT } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'which-part-of-the-body-is-paining-the';

// Chapter 106's own table, verbatim house-number order.
const BODY_PARTS: Record<number, string> = {
  1: 'Head',
  2: 'Neck',
  3: 'Chest',
  4: 'Right side',
  5: 'Left side',
  6: 'Right hand',
  7: 'Left hand',
  8: 'Ribs',
  9: 'Backbone (back)',
  10: 'Right thigh',
  11: 'Left thigh',
  12: 'Right leg',
  13: 'Left leg',
  14: 'Navel',
  15: 'Manhood',
  16: 'Womanhood',
};

const method1: MethodDefinition = {
  id: 'body-part-in-pain-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'After drawing the chart, pick the fire element of h3, h7, h10 and h15 and form a star. Then pick the air element of h3, h7, h10 and h15 and form a star. Then pick the water element of h3, h7, h10 and h15 and form a star. Then pick the sand element of h3, h7, h10 and h15 and form a star. Then add all 4 stars and check where you can locate it among the parts of the human body (see Chapter One Hundred and Six, below).',
  },
  calculate: (chart) => {
    const fire = EXTRACT_ELEMENT(chart, [3, 7, 10, 15], 'fire');
    const air = EXTRACT_ELEMENT(chart, [3, 7, 10, 15], 'air');
    const water = EXTRACT_ELEMENT(chart, [3, 7, 10, 15], 'water');
    const sand = EXTRACT_ELEMENT(chart, [3, 7, 10, 15], 'sand');
    const { figure, trace } = ADD_FIGURES([fire.figure, air.figure, water.figure, sand.figure]);
    // ADD_FIGURES unions each input's own sourceHouses without deduping —
    // fine when four different quartets are summed (ch.62/67/74/91/96),
    // but here all four EXTRACT_ELEMENT calls read the SAME 4 houses, so
    // the union would repeat [3,7,10,15] four times over. Overridden to
    // the true, deduplicated house set; the dot-pattern arithmetic itself
    // (and so the resulting figure/answer) is completely unaffected.
    const resultFigure = { ...figure, sourceHouses: [3, 7, 10, 15] };
    return {
      housesUsed: [3, 7, 10, 15],
      steps: [fire.trace.description, air.trace.description, water.trace.description, sand.trace.description, trace.description],
      resultFigure,
    };
  },
  evaluate: (calc, chart) => {
    const target = calc.resultFigure.dotPattern.join(',');
    const matches: number[] = [];
    for (let n = 1; n <= 16; n++) {
      if (CHECK_HOUSE(chart, n).figure.dotPattern.join(',') === target) matches.push(n);
    }
    if (matches.length !== 1) {
      return {
        outcome: 'uncertain',
        label: matches.length === 0 ? 'Not found in the chart' : `Found at ${matches.length} houses`,
        interpretation: 'The source assumes a single matching house — this chart does not produce exactly one.',
      };
    }
    const part = BODY_PARTS[matches[0]];
    return { outcome: 'descriptive', label: part, interpretation: `Found at H${matches[0]}: ${part}.`, descriptiveAnswer: part.toLowerCase().replace(/[^a-z]+/g, '-') };
  },
};

export const bodyPartInPainQuestion: QuestionDefinition = {
  id: 'which-part-of-the-body-is-paining-the',
  title: 'Which part of the body is in pain?',
  categoryId: 'health-hardships',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
