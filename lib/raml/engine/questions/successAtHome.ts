// Source: Kanzul Mikban, Chapter 11 — "If You Want to Know If You Will Be
// Successful in Life, at Home, or Have to Travel Away from Home"
// (id "if-you-want-to-know-if-you-will-2").

import { ADD_MULTIPLE_HOUSES, CHECK_ELEMENT } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-want-to-know-if-you-will-2';
const HOUSES = [1, 2, 7, 8];

const method1: MethodDefinition = {
  id: 'success-at-home-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Pick (h1 and h2) then (h7 and h8) and add them. If it's a downward star, you will be successful at home; but if it's an upward star, you have to run from home.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, HOUSES);
    return { housesUsed: HOUSES, steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const direction = calc.resultFigure.qualities.direction.value;
    if (direction === 'downward') return { outcome: 'favourable', label: 'Downward', interpretation: 'You will be successful at home.' };
    if (direction === 'upward') return { outcome: 'unfavourable', label: 'Upward', interpretation: 'You have to run from home.' };
    return { outcome: 'uncertain', label: 'Level (no clear direction)', interpretation: "This figure's top and bottom lines match, so this method's test doesn't resolve cleanly here." };
  },
};

const method2: MethodDefinition = {
  id: 'success-at-home-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'Pick the same stars above and add them. If it\'s water or sand star, stay at home; if it\'s fire or air, run from home.',
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, HOUSES);
    return { housesUsed: HOUSES, steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const element = CHECK_ELEMENT(calc.resultFigure).element;
    return element === 'water' || element === 'sand'
      ? { outcome: 'favourable', label: `${element} figure`, interpretation: 'Stay at home.' }
      : { outcome: 'unfavourable', label: `${element} figure`, interpretation: 'Run from home.' };
  },
};

export const successAtHomeQuestion: QuestionDefinition = {
  id: 'if-you-want-to-know-if-you-will-2',
  title: 'Will I succeed at home, or do I need to travel away?',
  categoryId: 'travel-change',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
