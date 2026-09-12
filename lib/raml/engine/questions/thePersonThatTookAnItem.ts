// Source: Kanzul Mikban, Chapter 41 — "The Person That Took an Item / Stole
// Something" (id "the-person-that-took-an-item-stole-something"). Two
// methods answering two different sub-questions: Method 1 asks WHO (a
// male/female star classification the source never defines FOR THIS
// chapter, and which this project's general FigureQualities.gender axis is
// always needs_review for — see types.ts — so it's withheld rather than
// guessed); Method 2 asks whether the item is RECOVERABLE, and is fully
// computable for 3 of its 4 good/bad x upward/downward combinations (the
// bad-and-upward case is never addressed by the source).

import { ADD_MULTIPLE_HOUSES, CHECK_DIRECTION, CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'the-person-that-took-an-item-stole-something';

const method1: MethodDefinition = {
  id: 'item-taker-method-1',
  label: 'Method 1',
  status: 'needs_review',
  reviewNote:
    'The verdict hinges on classifying H1 as a "male star" or "female star" — this specific chapter never defines which figures are male vs. female (unlike chapter 31, which explicitly redefines gender via element for its own rule), and this project\'s general figure-gender axis is intentionally left unsourced project-wide (see FigureQualities.gender in types.ts). Withheld rather than guessed.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "After drawing the chart, check h1. If it's a male star, then it's a man that stole it; if it's a female star, it's a lady that took it.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 1);
    return { housesUsed: [1], steps: [trace.description], resultFigure: figure };
  },
  evaluate: () => ({
    outcome: 'uncertain',
    label: 'Star gender not defined',
    interpretation: 'This method cannot currently be verified — see the review note.',
  }),
};

const method2: MethodDefinition = {
  id: 'item-taker-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Pick h6 and h8 and add them. If it's a good and downward star, the thing is still in town and can still be found. If it's a good and upward star, it's out of town and might be difficult to get it back, though you may hear about it. If it's a bad and downward star, you will not see it again though it's in town.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [6, 8]);
    return { housesUsed: [6, 8], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    const direction = CHECK_DIRECTION(calc.resultFigure);
    if (fortune === 'good' && direction === 'downward') {
      return { outcome: 'favourable', label: 'Good and downward', interpretation: "The thing is still in town and can still be found." };
    }
    if (fortune === 'good' && direction === 'upward') {
      return { outcome: 'mixed', label: 'Good and upward', interpretation: "It's out of town and might be difficult to get it back, though you may hear about it." };
    }
    if (fortune === 'bad' && direction === 'downward') {
      return { outcome: 'unfavourable', label: 'Bad and downward', interpretation: "You will not see it again, though it's in town." };
    }
    return {
      outcome: 'uncertain',
      label: fortune === 'bad' ? 'Bad and upward' : 'Middle-good',
      interpretation: 'This method only addresses good-and-downward, good-and-upward, and bad-and-downward results.',
    };
  },
};

export const thePersonThatTookAnItemQuestion: QuestionDefinition = {
  id: 'the-person-that-took-an-item-stole-something',
  title: 'Who took it, and will I get it back?',
  categoryId: 'lost-stolen',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
