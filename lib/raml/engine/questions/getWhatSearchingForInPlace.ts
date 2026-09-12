// Source: Kanzul Mikban, Chapter 118 — "If You Will Get What You Are
// Searching For, in a Place (Itisal)" (id "if-you-will-get-what-you-are-
// searching"). Same shape as chapter 107 (Nazir): blocked at the first
// step, since Itisal's own dot-pattern is never defined anywhere in
// either manuscript.

import { CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-will-get-what-you-are-searching';

const method1: MethodDefinition = {
  id: 'get-what-searching-for-in-place-method-1',
  label: 'Method 1',
  status: 'uncertain',
  reviewReasonCode: 'constant_figure_undefined',
  reviewNote:
    "The calculation starts by adding the \"constant figure of Itisal\" to H1's own figure, but Itisal's dot-pattern is never defined anywhere in either manuscript.",
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'After casting the chart, pick the constant figure of Itisal and add it to any star found in house 1, and check if it is found in the chart. If it is, you will get it; but if it is not in the chart, you will not get it. If it is found in the first 4, second 4, third 4, or last 4 houses, it is the same explanation as above in (Nazir).',
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 1);
    return { housesUsed: [1], steps: [trace.description, "Itisal's own dot-pattern is undefined — the calculation cannot proceed past H1."], resultFigure: figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Itisal undefined', interpretation: 'The constant figure of Itisal is never defined in either manuscript.' }),
};

export const getWhatSearchingForInPlaceQuestion: QuestionDefinition = {
  id: 'if-you-will-get-what-you-are-searching',
  title: 'Will I get what I am searching for, in this place?',
  categoryId: 'lost-stolen',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
