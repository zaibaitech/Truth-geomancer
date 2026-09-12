// Source: Kanzul Mikban, Chapter 29 — "If You Will Be Successful Where You
// Are Going" (id "if-you-will-be-successful-where-you-are"). One method,
// fully computable via the water line's own opened/closed state (the
// trailing figure-name list in the source is just an illustrative,
// redundant enumeration of which figures satisfy that condition — the line
// state itself is what actually decides it, per the manuscript's own
// opened/closed definition, and needs no figure list to compute).

import { ADD_MULTIPLE_HOUSES, CHECK_LINE_STATE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-will-be-successful-where-you-are';

const method1: MethodDefinition = {
  id: 'success-where-going-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, pick h3, h7, h11 and h15 and add them. If the element of the star you got is opened (single dot), then you will be successful in the place where you want to go; but if it's closed, it won't work.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [3, 7, 11, 15]);
    return { housesUsed: [3, 7, 11, 15], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const opened = CHECK_LINE_STATE(calc.resultFigure, 'water') === 'opened';
    return opened
      ? { outcome: 'favourable', label: 'Water line opened', interpretation: 'You will be successful in the place where you want to go.' }
      : { outcome: 'unfavourable', label: 'Water line closed', interpretation: "It won't work." };
  },
};

export const successWhereGoingQuestion: QuestionDefinition = {
  id: 'if-you-will-be-successful-where-you-are',
  title: 'Will I be successful where I am going?',
  categoryId: 'work-success',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
