// Source: Kanzul Mikban, sub-chapter between 21 and 22 — "If It's Good to
// Stay in a Particular House" (id "if-it-s-good-to-stay-in-a"; the source
// PDF gives this one no chapter number, but content/intentions.ts already
// registers it as its own selectable question, distinct from chapter 22's
// "town" question below). Three independent methods.

import { CHECK_HOUSE, COUNT_DIRECTION, EXTRACT_ELEMENT, ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-it-s-good-to-stay-in-a';

const method1: MethodDefinition = {
  id: 'stay-house-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, pick sand element of h4, h8, h14 and h16 and form a star. If it's a good star, it's good to stay; but if it's a bad star, please leave the house.",
  },
  calculate: (chart) => {
    const { figure, trace } = EXTRACT_ELEMENT(chart, [4, 8, 14, 16], 'sand');
    return { housesUsed: [4, 8, 14, 16], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good star', interpretation: "It's good to stay." };
    if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad star', interpretation: 'Please leave the house.' };
    return { outcome: 'uncertain', label: 'Middle-good star', interpretation: 'This method only addresses clearly good or bad results.' };
  },
};

const method2: MethodDefinition = {
  id: 'stay-house-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, pick h8, h9, h2 and h6 and add them. If it's a good star, it's good to stay; but if it's a bad star, please run for your dear life.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [8, 9, 2, 6]);
    return { housesUsed: [8, 9, 2, 6], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good star', interpretation: "It's good to stay." };
    if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad star', interpretation: 'Please run for your dear life.' };
    return { outcome: 'uncertain', label: 'Middle-good star', interpretation: 'This method only addresses clearly good or bad results.' };
  },
};

const method3: MethodDefinition = {
  id: 'stay-house-method-3',
  label: 'Method 3',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, check if the downward stars are more than the upward stars — then you can stay; but if they are not, it's not good for you to stay.",
  },
  calculate: (chart) => {
    const tally = COUNT_DIRECTION(chart);
    // No single result figure exists for a whole-chart tally — the Judge
    // (H15) is shown only as a representative reference figure, matching
    // the audit-trail shape every other method has; it plays no part in
    // the actual downward-vs-upward count above.
    const judge = CHECK_HOUSE(chart, 15).figure;
    return {
      housesUsed: [],
      steps: [`Whole chart: ${tally.downward} downward vs. ${tally.upward} upward star(s)`],
      resultFigure: judge,
    };
  },
  evaluate: (_calc, chart) => {
    const tally = COUNT_DIRECTION(chart);
    return tally.downward > tally.upward
      ? { outcome: 'favourable', label: `${tally.downward} downward vs. ${tally.upward} upward`, interpretation: 'You can stay.' }
      : { outcome: 'unfavourable', label: `${tally.downward} downward vs. ${tally.upward} upward`, interpretation: "It's not good for you to stay." };
  },
};

export const goodToStayInHouseQuestion: QuestionDefinition = {
  id: 'if-it-s-good-to-stay-in-a',
  title: "Is it good to stay in this house?",
  categoryId: 'travel-change',
  chapterId: CHAPTER_ID,
  methods: [method1, method2, method3],
};
