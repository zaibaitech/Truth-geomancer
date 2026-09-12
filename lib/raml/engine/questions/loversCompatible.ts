// Source: Kanzul Mikban, Chapter 38 — "If Two Lovers Will Be Compatible for
// Marriage (Their Star Signs)" (id
// "if-two-lovers-will-be-compatible-for-marriage"). Two methods.

import { ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-two-lovers-will-be-compatible-for-marriage';

const method1: MethodDefinition = {
  id: 'lovers-compatible-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h4 and h15 and add them. If it's a good star, they will (be compatible); but if it's a bad star, they will not. If it's a middle-good star, there will be problems though it's not bad.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [4, 15]);
    return { housesUsed: [4, 15], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good star', interpretation: 'They will be compatible.' };
    if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad star', interpretation: 'They will not be compatible.' };
    return { outcome: 'mixed', label: 'Middle-good star', interpretation: "There will be problems, though it's not bad." };
  },
};

const method2: MethodDefinition = {
  id: 'lovers-compatible-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "After drawing the chart, pick h1 and h7 and add them. If it's a good star, it's good, and vice versa.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 7]);
    return { housesUsed: [1, 7], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good star', interpretation: "It's good." };
    if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad star', interpretation: "It's not good." };
    return { outcome: 'uncertain', label: 'Middle-good star', interpretation: 'This method only addresses clearly good or bad results.' };
  },
};

export const loversCompatibleQuestion: QuestionDefinition = {
  id: 'if-two-lovers-will-be-compatible-for-marriage',
  title: 'Will these two lovers be compatible for marriage?',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
