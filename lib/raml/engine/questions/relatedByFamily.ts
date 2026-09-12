// Source: Kanzul Mikban, Chapter 63 — "If the Lady or Man You Are Going to
// Marry Is Related to You by Family" (id "if-the-lady-or-man-you-are-going").
// One method: does H7's own figure REPEAT elsewhere in the chart, and in
// which quarter? Not a direct fit for the shared FIND_FIGURE_QUARTER
// operation (Prompt 6) — that helper doesn't exclude the house being
// checked from its own quarter's search, so H7 would trivially "match
// itself" inside the Daughters quarter (H5-8) every single time. Composed
// directly from CHECK_FIGURE_PRESENT_IN_CHART with an explicit
// H7-excluded subset for that one quarter instead. resultKind is
// 'descriptive': a relationship-distance category, not a favourable/
// unfavourable value judgment.

import { CHECK_FIGURE_PRESENT_IN_CHART, CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-the-lady-or-man-you-are-going';

const QUARTERS: { houses: number[]; key: string; label: string }[] = [
  { houses: [1, 2, 3, 4], key: 'close-family', label: 'a close family member' },
  { houses: [5, 6, 8], key: 'extended-family', label: 'an extended family member' }, // H7 excluded — checking whether it REPEATS, not itself
  { houses: [9, 10, 11, 12], key: 'area-member', label: "an area member, or someone from a friend's family" },
  { houses: [13, 14, 15, 16], key: 'not-related', label: 'not related to you in any way, or not even your tribe' },
];

const method1: MethodDefinition = {
  id: 'related-by-family-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, check h7. If it repeats in the first 4 houses (1–4), it means a close family member. If it's in the second 4 (5–8), it means an extended family member. If it's in the third 4 (9–12), it means an area member, or someone from a friend's family. If it's in the last 4 (13–16), it means she/he is not related to you in any way, or not even your tribe. If it's not found in the chart, it means he/she is not a [fellow] citizen.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 7);
    return { housesUsed: [7], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const quarter = QUARTERS.find((q) => CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern, q.houses).found);
    if (!quarter) {
      return {
        outcome: 'descriptive',
        label: 'Not a fellow citizen',
        interpretation: "H7's figure doesn't repeat anywhere else in the chart — he/she is not a fellow citizen.",
        descriptiveAnswer: 'not-a-citizen',
      };
    }
    return {
      outcome: 'descriptive',
      label: quarter.key.replace(/-/g, ' '),
      interpretation: `He/she is ${quarter.label}.`,
      descriptiveAnswer: quarter.key,
    };
  },
};

export const relatedByFamilyQuestion: QuestionDefinition = {
  id: 'if-the-lady-or-man-you-are-going',
  title: 'Are they related to me by family?',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
