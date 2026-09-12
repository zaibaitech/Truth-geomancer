// Source: Kanzul Mikban, unnumbered fragment immediately after Chapter 66 —
// "Additional Method — If She/He Is Still in the Marriage or Not" (id
// "if-she-he-is-still-in-the-marriage"). One method, fully computable — a
// genuinely different real-world question from chapter 66 (has this person
// EVER married, vs. are they CURRENTLY still married), not a restatement
// of anything already registered, so it earns its own question despite
// carrying no chapter number (unlike, e.g., the "Consequence of
// Friendship" fragment in chapters 41-60, which was left unregistered
// only because it fell outside that stage's numbered scope — Prompt 7's
// own instructions extend to inspecting and, where warranted, registering
// unnumbered material within its range). resultKind is 'descriptive': a
// factual yes/no answer, not a favourable/unfavourable value judgment.

import { ADD_MULTIPLE_HOUSES, CHECK_FIGURE_PRESENT_IN_CHART } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-she-he-is-still-in-the-marriage';

const method1: MethodDefinition = {
  id: 'still-in-marriage-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h5, h9, h10 and h11 and add them all. If it's [found] in the chart, he/she is still in the marriage; if it's not in the chart, she/he is not in the marriage.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [5, 9, 10, 11]);
    return { housesUsed: [5, 9, 10, 11], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern);
    return found
      ? { outcome: 'descriptive', label: 'Still in the marriage', interpretation: 'He/she is still in the marriage.', descriptiveAnswer: 'still-in-marriage' }
      : { outcome: 'descriptive', label: 'Not in the marriage', interpretation: 'She/he is not in the marriage.', descriptiveAnswer: 'not-in-marriage' };
  },
};

export const stillInMarriageQuestion: QuestionDefinition = {
  id: 'if-she-he-is-still-in-the-marriage',
  title: 'Are they still in this marriage?',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
