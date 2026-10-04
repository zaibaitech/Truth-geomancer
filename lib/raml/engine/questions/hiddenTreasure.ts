// Source: Kanzul Mikban, Chapter 132 — "If There's a Hidden Treasure (Gold/
// Money) in a Particular Place" (id "if-there-s-a-hidden-treasure-gold-money").
// Three methods.
//
// Methods 1 and 2 each name a trigger-figure list, restored from the
// author-confirmed final edition (kanzulFinalEditionFigures.ts): Method 1
// checks the h4+h6 sum against four figures; Method 2 looks for any of three
// figures anywhere "in your chart" (the source states no houses).
//
// Method 3: H1's "downward or stable star" idiom, both branches stated —
// the same full-binary direction reading as chapters 129/130 (downward and
// upward each independently satisfy their own branch regardless of
// stability; only a level H1 needs the unsourced stability axis), split
// into a direction sub-method (verified) and a stability sub-method
// (blocked), per the chapter 85/86 precedent.
// resultKind 'descriptive': an existence claim ("there is [treasure]" /
// "there is nothing there"), not a favourable/unfavourable outcome.

import { ADD_MULTIPLE_HOUSES, CHECK_DIRECTION, CHECK_HOUSE, MATCH_FIGURE } from '../operations';
import { CH132_M1_TREASURE, CH132_M2_TREASURE, idsOf } from '../kanzulFinalEditionFigures';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-there-s-a-hidden-treasure-gold-money';

const method1: MethodDefinition = {
  id: 'hidden-treasure-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Method 1: After casting the chart, pick h4 and h6 and add them. If it's one of the following stars, there is [treasure]; but if it's not, there is nothing there. The stars are as follows: Usman, Yussif, Sulemana, Iddris.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [4, 6]);
    return { housesUsed: [4, 6], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) =>
    idsOf(CH132_M1_TREASURE).some((id) => MATCH_FIGURE(calc.resultFigure, id))
      ? { outcome: 'descriptive', label: `H4+H6 = ${calc.resultFigure.figureName}`, interpretation: "There's something there.", descriptiveAnswer: 'treasure' }
      : { outcome: 'descriptive', label: `H4+H6 = ${calc.resultFigure.figureName}`, interpretation: "There's nothing there.", descriptiveAnswer: 'nothing' },
};

const method2: MethodDefinition = {
  id: 'hidden-treasure-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Method 2: Also, if you get Usman, Mahadi, or Nuhu in your chart, then there's something; but if it's not any of the above stars, then there's nothing there.",
  },
  calculate: (chart) => {
    // "in your chart": any of the three listed figures anywhere in the 16 houses.
    const hits = chart.houses.filter((h) => idsOf(CH132_M2_TREASURE).includes(h.figureId));
    const ref = hits[0] ?? chart.houses[0];
    const resultFigure = {
      figureId: ref.figureId,
      figureName: ref.figureName,
      classicalName: ref.classicalName,
      dotPattern: ref.dotPattern,
      element: ref.element,
      qualities: ref.qualities,
      sourceHouses: hits.length ? hits.map((h) => h.houseNumber) : [ref.houseNumber],
    };
    return {
      housesUsed: hits.map((h) => h.houseNumber),
      steps: hits.length ? hits.map((h) => `H${h.houseNumber} = ${h.figureName} (a listed figure)`) : ['None of the three listed figures is in the chart.'],
      resultFigure,
    };
  },
  evaluate: (calc) =>
    calc.housesUsed.length > 0
      ? { outcome: 'descriptive', label: 'Listed figure in the chart', interpretation: "There's something there.", descriptiveAnswer: 'treasure' }
      : { outcome: 'descriptive', label: 'No listed figure in the chart', interpretation: "There's nothing there.", descriptiveAnswer: 'nothing' },
};

const QUOTE_M3 = "Method 3: Also, if your h1 is a downward star or a stable star, it means there's something; but if it is not, there's nothing.";

const method3a: MethodDefinition = {
  id: 'hidden-treasure-method-3-direction',
  label: 'Method 3 (direction)',
  status: 'verified',
  source: { book: 'kanzul-mikban', chapterId: CHAPTER_ID, quote: QUOTE_M3 },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 1);
    return { housesUsed: [1], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const direction = CHECK_DIRECTION(calc.resultFigure);
    if (direction === 'downward') {
      return { outcome: 'descriptive', label: 'H1 downward', interpretation: "There's something there.", descriptiveAnswer: 'treasure' };
    }
    if (direction === 'upward') {
      return { outcome: 'descriptive', label: 'H1 upward', interpretation: "There's nothing there.", descriptiveAnswer: 'nothing' };
    }
    return { outcome: 'uncertain', label: 'H1 level', interpretation: 'H1 is neither upward nor downward — direction alone cannot resolve this (stability could still decide it, but is unsourced).' };
  },
};

const method3b: MethodDefinition = {
  id: 'hidden-treasure-method-3-stability',
  label: 'Method 3 (stability)',
  status: 'needs_review',
  reviewReasonCode: 'stability_classification_unsourced',
  reviewNote: 'This alternate reading crosses on stability (stable -> something, unstable -> nothing) rather than direction — the `stability` axis has no sourced classification project-wide.',
  source: { book: 'kanzul-mikban', chapterId: CHAPTER_ID, quote: QUOTE_M3 },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 1);
    return { housesUsed: [1], steps: [trace.description], resultFigure: figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Stability not classified', interpretation: 'This project has no sourced stability classification for any figure.' }),
};

export const hiddenTreasureQuestion: QuestionDefinition = {
  id: 'if-there-s-a-hidden-treasure-gold-money',
  title: 'Is there hidden treasure in this place?',
  categoryId: 'lost-stolen',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1, method2, method3a, method3b],
};
