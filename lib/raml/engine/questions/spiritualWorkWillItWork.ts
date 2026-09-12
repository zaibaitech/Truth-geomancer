// Source: Kanzul Mikban, Chapter 40 — "If Spiritual Work You Want to Do for
// Someone Will Work or Not" (id "if-spiritual-work-you-want-to-do-for").
// Two methods, both fully defined ternary branches — no `uncertain`
// fallback needed for either.

import { ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-spiritual-work-you-want-to-do-for';

const method1: MethodDefinition = {
  id: 'spiritual-work-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h1 and h5 and add them. If it's a good star, it will work very fast and easier. If it's middle-good star, it will take a long time to work. If it's a bad star, it won't work at all.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 5]);
    return { housesUsed: [1, 5], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good star', interpretation: 'It will work very fast and easier.' };
    if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad star', interpretation: "It won't work at all." };
    return { outcome: 'mixed', label: 'Middle-good star', interpretation: 'It will take a long time to work.' };
  },
};

const method2: MethodDefinition = {
  id: 'spiritual-work-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, pick h5 and h11 and add them. If it's a good star, it will work; if it's a bad star, it won't work; and if it's a middle-good star, it will be very long before it will work.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [5, 11]);
    return { housesUsed: [5, 11], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good star', interpretation: 'It will work.' };
    if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad star', interpretation: "It won't work." };
    return { outcome: 'mixed', label: 'Middle-good star', interpretation: 'It will be very long before it will work.' };
  },
};

export const spiritualWorkWillItWorkQuestion: QuestionDefinition = {
  id: 'if-spiritual-work-you-want-to-do-for',
  title: 'Will this spiritual work I want to do for someone work?',
  categoryId: 'fate-timing',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
