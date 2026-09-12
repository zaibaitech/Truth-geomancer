// Source: Kanzul Mikban, Chapter 39 — "If Your Visitor, or the Person That
// Comes to You, Is a Good or Bad Person" (id
// "if-your-visitor-or-the-person-that-comes"). Two methods.

import { ADD_MULTIPLE_HOUSES, CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-your-visitor-or-the-person-that-comes';

const method1: MethodDefinition = {
  id: 'visitor-good-bad-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "After drawing the chart, check h1. If it's a good star, he/she is a good person; if it's a bad star, the person has bad intentions.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 1);
    return { housesUsed: [1], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good star', interpretation: 'He/she is a good person.' };
    if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad star', interpretation: 'The person has bad intentions.' };
    return { outcome: 'uncertain', label: 'Middle-good star', interpretation: 'This method only addresses clearly good or bad results.' };
  },
};

const method2: MethodDefinition = {
  id: 'visitor-good-bad-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Pick h9 and h12 and add them after drawing the chart. If it's a good star, the person is good; but if it's a bad star, he/she is having bad intentions towards you. If it's a middle-good star, he/she comes to test you, to know what to do, or he/she has no good or bad intentions towards you.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [9, 12]);
    return { housesUsed: [9, 12], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good star', interpretation: 'The person is good.' };
    if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad star', interpretation: 'He/she is having bad intentions towards you.' };
    return { outcome: 'mixed', label: 'Middle-good star', interpretation: 'He/she comes to test you, to know what to do, or has no good or bad intentions towards you.' };
  },
};

export const visitorGoodOrBadQuestion: QuestionDefinition = {
  id: 'if-your-visitor-or-the-person-that-comes',
  title: 'Is my visitor a good or bad person?',
  categoryId: 'fate-timing',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
