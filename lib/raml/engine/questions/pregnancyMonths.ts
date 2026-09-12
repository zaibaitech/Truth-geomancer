// Source: Kanzul Mikban, Chapter 78 — "The Number of Months of a
// Pregnancy (How Old Is the Pregnancy)" (id
// "the-number-of-months-of-a-pregnancy-how"). One method: count every
// opened (single-dot) line across H1-H6, then reduce it into the range
// 1-9 by repeated subtraction of 9 — fully computable via the new
// COUNT_OPENED_LINES primitive (Prompt 7) and the existing CAST_OUT_BY
// (Prompt 5, generalized beyond chapter 56's own "cast out by 3s" to any
// modulus). resultKind is 'descriptive': a count, not a favourable/
// unfavourable value judgment.

import { CAST_OUT_BY, CHECK_HOUSE, COUNT_OPENED_LINES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'the-number-of-months-of-a-pregnancy-how';

const method1: MethodDefinition = {
  id: 'pregnancy-months-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, count all the single dots of the stars from h1 to h6. If it is more than 9, then subtract 9-9 from it until it is equal to 9 or less than 9. Whatever number you get, that's the number of months.",
  },
  calculate: (chart) => {
    const { count, trace } = COUNT_OPENED_LINES(chart, [1, 2, 3, 4, 5, 6]);
    const months = CAST_OUT_BY(count, 9);
    const judge = CHECK_HOUSE(chart, 15).figure; // representative reference figure only — see goodToStayInTown.ts's Method 2
    return { housesUsed: [1, 2, 3, 4, 5, 6], steps: [trace.description, `Cast out by 9s: ${count} -> ${months}`], resultFigure: judge };
  },
  evaluate: (_calc, chart) => {
    const { count } = COUNT_OPENED_LINES(chart, [1, 2, 3, 4, 5, 6]);
    const months = CAST_OUT_BY(count, 9);
    return {
      outcome: 'descriptive',
      label: `${months} month${months === 1 ? '' : 's'}`,
      interpretation: `Single dots from H1-H6: ${count}, cast out by 9s = ${months} — the pregnancy is ${months} month${months === 1 ? '' : 's'} old.`,
      descriptiveAnswer: String(months),
    };
  },
};

export const pregnancyMonthsQuestion: QuestionDefinition = {
  id: 'the-number-of-months-of-a-pregnancy-how',
  title: 'How many months old is this pregnancy?',
  categoryId: 'family-loved-ones',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
