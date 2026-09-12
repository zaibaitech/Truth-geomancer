// Source: Kanzul Mikban, Chapter 75 — "If He/She Is a Womanizer or a
// Harlot" (id "if-he-she-is-a-womanizer-or-a"). One method, fully
// computable — both branches (matches one of the two named figures, or
// not) are addressed.

import { ADD_MULTIPLE_HOUSES, MATCH_FIGURE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-he-she-is-a-womanizer-or-a';

const method1: MethodDefinition = {
  id: 'womanizer-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h7 and h9 and add them. If the star is Kallah Allah or Yusuf, then he/she is sleeping around; but if it's not, she/he is not.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [7, 9]);
    return { housesUsed: [7, 9], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const matches = MATCH_FIGURE(calc.resultFigure, 'kalla-allahu') || MATCH_FIGURE(calc.resultFigure, 'yussif');
    return matches
      ? { outcome: 'unfavourable', label: 'Kalla Allahu or Yusuf', interpretation: 'He/she is sleeping around.' }
      : { outcome: 'favourable', label: 'Neither Kalla Allahu nor Yusuf', interpretation: 'She/he is not.' };
  },
};

export const womanizerQuestion: QuestionDefinition = {
  id: 'if-he-she-is-a-womanizer-or-a',
  title: 'Is he/she a womanizer or a harlot?',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
