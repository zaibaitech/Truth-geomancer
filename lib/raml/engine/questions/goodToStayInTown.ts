// Source: Kanzul Mikban, Chapter 22 — "If It's Good to Stay in a Town or
// Not" (id "if-it-s-good-to-stay-in-a-2"). Two methods.

import { CHECK_HOUSE, COUNT_FORTUNE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-it-s-good-to-stay-in-a-2';

const method1: MethodDefinition = {
  id: 'stay-town-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "After drawing the chart, check h4. If it's a good star, it's good to stay; but if it's a bad star, it's not safe for you.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 4);
    return { housesUsed: [4], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good star', interpretation: "It's good to stay." };
    if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad star', interpretation: "It's not safe for you." };
    return { outcome: 'uncertain', label: 'Middle-good star', interpretation: 'This method only addresses clearly good or bad results.' };
  },
};

const method2: MethodDefinition = {
  id: 'stay-town-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'After casting the chart, count all the good stars in the chart. If they are more than the bad stars, you can stay; but if they are not, don\'t stay.',
  },
  calculate: (chart) => {
    const tally = COUNT_FORTUNE(chart);
    const judge = CHECK_HOUSE(chart, 15).figure; // representative reference figure only — see goodToStayInHouse.ts's Method 3
    return {
      housesUsed: [],
      steps: [`Whole chart: ${tally.good} good vs. ${tally.bad} bad star(s) (${tally.middleGood} middle-good)`],
      resultFigure: judge,
    };
  },
  evaluate: (_calc, chart) => {
    const tally = COUNT_FORTUNE(chart);
    return tally.good > tally.bad
      ? { outcome: 'favourable', label: `${tally.good} good vs. ${tally.bad} bad`, interpretation: 'You can stay.' }
      : { outcome: 'unfavourable', label: `${tally.good} good vs. ${tally.bad} bad`, interpretation: "Don't stay." };
  },
};

export const goodToStayInTownQuestion: QuestionDefinition = {
  id: 'if-it-s-good-to-stay-in-a-2',
  title: 'Is it good to stay in this town?',
  categoryId: 'travel-change',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
