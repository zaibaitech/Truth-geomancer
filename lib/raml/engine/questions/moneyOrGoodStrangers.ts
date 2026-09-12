// Source: Kanzul Mikban, Chapter 28 — "If You Will Get Money or Good
// Strangers That Same Day or Not" (id
// "if-you-will-get-money-or-good-strangers"). One method, scoped to the
// clearly-stated primary rule only: found in the chart -> favourable. The
// source's own "not found" branch is never actually stated, so it is left
// `uncertain` rather than assumed. The chapter goes on to describe visitor
// type/timing refinements by element and direction (and even a
// "water-element, closed -> you won't get anything" carve-out layered on
// top of the primary rule) — deliberately not encoded here: it isn't its
// own independent favourable/unfavourable determination, it's descriptive
// elaboration on an already-favourable branch, and the closed-water carve-
// out isn't clearly reconciled with the primary rule textually. Per section
// 18, this stays scoped to what the source actually and unambiguously
// resolves.

import { ADD_FIGURE_TO_HOUSE, CHECK_FIGURE_PRESENT_IN_CHART, EXTRACT_ELEMENT } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-will-get-money-or-good-strangers';

const method1: MethodDefinition = {
  id: 'money-strangers-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'After drawing the chart, pick the water element of h5, h7, h11 and h14 and form a star. Add it to h7 and check if it\'s found in the chart — it means you will get money or very good visitors that day.',
  },
  calculate: (chart) => {
    const step1 = EXTRACT_ELEMENT(chart, [5, 7, 11, 14], 'water');
    const step2 = ADD_FIGURE_TO_HOUSE(chart, step1.figure, 7);
    return { housesUsed: [5, 7, 11, 14, 7], steps: [step1.trace.description, step2.trace.description], resultFigure: step2.figure };
  },
  evaluate: (calc, chart) => {
    const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern);
    if (found) {
      return { outcome: 'favourable', label: 'Found in the chart', interpretation: 'You will get money or very good visitors that day.' };
    }
    return {
      outcome: 'uncertain',
      label: 'Not found in the chart',
      interpretation: 'The source only defines the "found" branch — a not-found result is not addressed.',
    };
  },
};

export const moneyOrGoodStrangersQuestion: QuestionDefinition = {
  id: 'if-you-will-get-money-or-good-strangers',
  title: 'Will I get money or good strangers today?',
  categoryId: 'money-possessions',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
