// Source: Kanzul Mikban, Chapter 99 — "If Someone or Something Good Will
// Come to You Today or Not" (id "if-someone-or-something-good-will-come-
// to"). One method, full good/middle-good/bad coverage. resultKind
// 'outcome'.

import { ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-someone-or-something-good-will-come-to';

const method1: MethodDefinition = {
  id: 'something-good-today-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h1 and h7 and add them. If it is a good star, be expecting positive results; but if it's not a good star, don't be expecting anything good that day. If it's a middle-good star, it means you may get something not very interesting, or with not much benefit.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 7]);
    return { housesUsed: [1, 7], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good star', interpretation: 'Be expecting positive results.' };
    if (fortune === 'middleGood') return { outcome: 'mixed', label: 'Middle-good star', interpretation: 'You may get something not very interesting, or with not much benefit.' };
    return { outcome: 'unfavourable', label: 'Not a good star', interpretation: "Don't be expecting anything good today." };
  },
};

export const somethingGoodTodayQuestion: QuestionDefinition = {
  id: 'if-someone-or-something-good-will-come-to',
  title: 'Will something good come to me today?',
  categoryId: 'fate-timing',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
