// Source: Kanzul Mikban, Chapter 50 — "If You Will Get Gold in a Place
// Where You Are Working" (id "if-you-will-get-gold-in-a-place"). One
// method, fully computable — every one of the 4 elements is assigned to
// one of the two branches, so no gap is left uncertain.

import { ADD_MULTIPLE_HOUSES, CHECK_ELEMENT } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-will-get-gold-in-a-place';

const method1: MethodDefinition = {
  id: 'get-gold-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h1, h10, h11 and h14 and add them. If you get water or sand star, you will get gold there, insha'Allah. But if it's fire or air stars, you won't get anything.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 10, 11, 14]);
    return { housesUsed: [1, 10, 11, 14], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const { element } = CHECK_ELEMENT(calc.resultFigure);
    const gold = element === 'water' || element === 'sand';
    return gold
      ? { outcome: 'favourable', label: `${element === 'water' ? 'Water' : 'Sand'} star`, interpretation: "You will get gold there, insha'Allah." }
      : { outcome: 'unfavourable', label: `${element === 'fire' ? 'Fire' : 'Air'} star`, interpretation: "You won't get anything." };
  },
};

export const getGoldWhereWorkingQuestion: QuestionDefinition = {
  id: 'if-you-will-get-gold-in-a-place',
  title: 'Will I get gold where I am working?',
  categoryId: 'money-possessions',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
