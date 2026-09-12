// Source: Kanzul Mikban, Chapter 145 — "If Someone Will Get a Particular
// Position or Chieftaincy Title" (id "if-someone-will-get-a-particular-position-or").
// One method (H1+H10+H11+H13), full 3-way fortune coverage — good,
// middle-good, and bad are all explicitly addressed, no gap. resultKind
// 'outcome': explicitly framed as personal benefit/harm.

import { ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-someone-will-get-a-particular-position-or';

const method1: MethodDefinition = {
  id: 'get-position-or-chieftaincy-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h1 and h10, then h11 and h13, and add them all. If it's a good star, he/she will get it. If it's a middle-good star, he/she may get it with prayers. If it's a bad star, he/she will never get it. Allah knows best.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 10, 11, 13]);
    return { housesUsed: [1, 10, 11, 13], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good', interpretation: 'He/she will get it.' };
    if (fortune === 'middleGood') return { outcome: 'mixed', label: 'Middle-good', interpretation: 'He/she may get it with prayers.' };
    return { outcome: 'unfavourable', label: 'Bad', interpretation: 'He/she will never get it.' };
  },
};

export const getPositionOrChieftaincyQuestion: QuestionDefinition = {
  id: 'if-someone-will-get-a-particular-position-or',
  title: 'Will I get a particular position or chieftaincy title?',
  categoryId: 'work-success',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
