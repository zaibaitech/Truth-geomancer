// Source: Kanzul Mikban, Chapter 146 — "If You Will Own a House in Your
// Life" (id "if-you-will-own-a-house-in-your"). One method (H1+H4+H11+H15),
// full 3-way fortune coverage. resultKind 'outcome': explicitly framed as
// personal benefit/harm.

import { ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-will-own-a-house-in-your';

const method1: MethodDefinition = {
  id: 'own-house-in-life-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, pick h1 and h4, then h11 and h15, and add them all. If it's a good star, you will own a house in your life. If it's a bad star, you will never own a house. If it's a middle-good star, you will own a house with prayers and sacrifices.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 4, 11, 15]);
    return { housesUsed: [1, 4, 11, 15], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good', interpretation: 'You will own a house in your life.' };
    if (fortune === 'middleGood') return { outcome: 'mixed', label: 'Middle-good', interpretation: 'You will own a house with prayers and sacrifices.' };
    return { outcome: 'unfavourable', label: 'Bad', interpretation: 'You will never own a house.' };
  },
};

export const ownHouseInLifeQuestion: QuestionDefinition = {
  id: 'if-you-will-own-a-house-in-your',
  title: 'Will I own a house in my life?',
  categoryId: 'work-success',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
