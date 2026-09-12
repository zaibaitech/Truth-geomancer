// Source: Kanzul Mikban, Chapter 72 — "If a Lady or Man Has Feelings for
// You or Not" (id "if-a-lady-or-man-has-feelings-for"). One method, fully
// computable — all 3 fortune branches (good/middle-good/bad) are
// addressed, so no gap is left uncertain.

import { ADD_FIGURE_TO_HOUSE, ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-a-lady-or-man-has-feelings-for';

const method1: MethodDefinition = {
  id: 'feelings-for-you-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h7 and h11 and add them. Then add the results to h5 and check: if it's a good star, there is feeling. If it's a bad star, there are no feelings at all. But if it's a middle-good star, it means there will be feelings in future.",
  },
  calculate: (chart) => {
    const step1 = ADD_MULTIPLE_HOUSES(chart, [7, 11]);
    const step2 = ADD_FIGURE_TO_HOUSE(chart, step1.figure, 5);
    return { housesUsed: [7, 11, 5], steps: [step1.trace.description, step2.trace.description], resultFigure: step2.figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good star', interpretation: 'There is feeling.' };
    if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad star', interpretation: 'There are no feelings at all.' };
    return { outcome: 'mixed', label: 'Middle-good star', interpretation: 'There will be feelings in future.' };
  },
};

export const feelingsForYouQuestion: QuestionDefinition = {
  id: 'if-a-lady-or-man-has-feelings-for',
  title: 'Do they have feelings for me?',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
