// Source: Kanzul Mikban, Chapter 91 — "If Something Is Present, Past, or
// Future" (id "if-something-is-present-past-or-future"). One method: the
// calculation is fully computable (three quartet sums via
// ADD_MULTIPLE_HOUSES, combined via the existing ADD_FIGURES primitive),
// but the verdict needs classifying the resulting figure as a "present,
// past, or future star" — a classification this project has never even
// declared a FigureQualities field for, let alone sourced. A full re-grep
// of both manuscripts (as required by Prompt 9 section 6, alongside the
// gender search) finds this exact phrase exactly once, here, with no
// definition anywhere. New `reviewReasonCode:
// 'temporal_classification_unsourced'` names this specific, novel gap.

import { ADD_FIGURES, ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-something-is-present-past-or-future';

const method1: MethodDefinition = {
  id: 'present-past-future-method-1',
  label: 'Method 1',
  status: 'needs_review',
  reviewReasonCode: 'temporal_classification_unsourced',
  reviewNote:
    'The verdict hinges on classifying the resulting figure as a "present, past, or future star" — this classification is never defined anywhere in either manuscript, and this project has no FigureQualities axis for it at all. A full re-search of both manuscripts finds this exact phrase used only this once.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, pick the present houses (h1, h4, h7, and h10) and add them. Then pick the past houses (h2, h5, h8, and h11) and add them. Then pick the houses of the future (h3, h6, h9, and h12) and add them. Then add all the results together and check if it's a present, past, or future star.",
  },
  calculate: (chart) => {
    const present = ADD_MULTIPLE_HOUSES(chart, [1, 4, 7, 10]);
    const past = ADD_MULTIPLE_HOUSES(chart, [2, 5, 8, 11]);
    const future = ADD_MULTIPLE_HOUSES(chart, [3, 6, 9, 12]);
    const { figure, trace } = ADD_FIGURES([present.figure, past.figure, future.figure]);
    return {
      housesUsed: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      steps: [present.trace.description, past.trace.description, future.trace.description, trace.description],
      resultFigure: figure,
    };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Present/past/future not classified', interpretation: 'This project has no sourced present/past/future classification for any figure.' }),
};

export const presentPastFutureQuestion: QuestionDefinition = {
  id: 'if-something-is-present-past-or-future',
  title: 'Is this about the present, the past, or the future?',
  categoryId: 'fate-timing',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
