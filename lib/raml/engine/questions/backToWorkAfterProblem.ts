// Source: Kanzul Mikban, Chapter 150 — "If You Will Get Back to Work After
// Getting a Problem in the Workplace" (id "if-you-will-get-back-to-work-after").
// One method (H1+H6+H10, a three-way sum via ADD_MULTIPLE_HOUSES), full
// 3-way fortune coverage. resultKind 'outcome': explicitly framed as
// personal benefit/harm.

import { ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-will-get-back-to-work-after';

const method1: MethodDefinition = {
  id: 'back-to-work-after-problem-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Pick h1 and h6 and add them to h10. If it's a good star, you will. If it's a bad star, you will not. If it's a middle-good star, with prayer you will get your place back.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 6, 10]);
    return { housesUsed: [1, 6, 10], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good', interpretation: 'You will get back to work.' };
    if (fortune === 'middleGood') return { outcome: 'mixed', label: 'Middle-good', interpretation: 'With prayer you will get your place back.' };
    return { outcome: 'unfavourable', label: 'Bad', interpretation: 'You will not get back to work.' };
  },
};

export const backToWorkAfterProblemQuestion: QuestionDefinition = {
  id: 'if-you-will-get-back-to-work-after',
  title: 'Will I get back to work after this workplace problem?',
  categoryId: 'work-success',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
