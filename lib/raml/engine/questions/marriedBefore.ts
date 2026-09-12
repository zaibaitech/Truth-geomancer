// Source: Kanzul Mikban, Chapter 66 — "If Someone Has Married Before, or If
// He/She Is Married" (id "if-someone-has-married-before-or-if-he"). One
// method, fully computable via the resulting figure's direction.
// resultKind is 'descriptive': whether someone has ever been married is a
// factual yes/no answer, not a favourable/unfavourable value judgment the
// source never makes — same reasoning as chapters 47/58 (Prompt 5) and the
// chapter 21 fix (Prompt 6).

import { CHECK_HOUSE, CHECK_DIRECTION } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-someone-has-married-before-or-if-he';

const method1: MethodDefinition = {
  id: 'married-before-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Check house 10 after drawing the chart. If it's a downward star, he/she is married or has married before; but if it's an upward star, she/he is not.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 10);
    return { housesUsed: [10], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const direction = CHECK_DIRECTION(calc.resultFigure);
    if (direction === 'downward') return { outcome: 'descriptive', label: 'Married', interpretation: 'He/she is married or has married before.', descriptiveAnswer: 'married' };
    if (direction === 'upward') return { outcome: 'descriptive', label: 'Not married', interpretation: 'She/he is not.', descriptiveAnswer: 'not-married' };
    return { outcome: 'uncertain', label: 'Level star', interpretation: 'This method only addresses a clearly upward or downward result.' };
  },
};

export const marriedBeforeQuestion: QuestionDefinition = {
  id: 'if-someone-has-married-before-or-if-he',
  title: 'Has this person married before, or are they married now?',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
