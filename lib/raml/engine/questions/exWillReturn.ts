// Source: Kanzul Mikban, Chapter 76 — "If Your Ex-Husband, Wife,
// Girlfriend, or Boyfriend Will Return or Not" (id
// "if-your-ex-husband-wife-girlfriend-or-boyfriend"). Two methods, each
// checking several SEPARATE houses' own water-line states individually
// (not combined via addition) — composed directly from the existing
// CHECK_HOUSE + CHECK_LINE_STATE primitives; no new operation needed for
// a one-off "are these N houses all opened" check.

import { CHECK_HOUSE, CHECK_LINE_STATE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-your-ex-husband-wife-girlfriend-or-boyfriend';

const method1: MethodDefinition = {
  id: 'ex-return-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'After casting the chart, check the water element of h8, h9, h11 and h15. If all are active, then she/he will return.',
  },
  calculate: (chart) => {
    const houses = [8, 9, 11, 15].map((n) => CHECK_HOUSE(chart, n));
    return {
      housesUsed: [8, 9, 11, 15],
      steps: houses.map((h) => h.trace.description),
      resultFigure: houses[0].figure,
    };
  },
  evaluate: (_calc, chart) => {
    const figures = [8, 9, 11, 15].map((n) => CHECK_HOUSE(chart, n).figure);
    const allOpened = figures.every((f) => CHECK_LINE_STATE(f, 'water') === 'opened');
    return allOpened
      ? { outcome: 'favourable', label: 'All water lines opened', interpretation: 'She/he will return.' }
      : { outcome: 'uncertain', label: 'Not all water lines opened', interpretation: 'The source only defines the "all opened" trigger — this is not addressed.' };
  },
};

const method2: MethodDefinition = {
  id: 'ex-return-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'Check the water element of h5, h6 and h7. If they are all active, then she/he will return back to you; but if they are closed, he/she will not.',
  },
  calculate: (chart) => {
    const houses = [5, 6, 7].map((n) => CHECK_HOUSE(chart, n));
    return {
      housesUsed: [5, 6, 7],
      steps: houses.map((h) => h.trace.description),
      resultFigure: houses[0].figure,
    };
  },
  evaluate: (_calc, chart) => {
    const figures = [5, 6, 7].map((n) => CHECK_HOUSE(chart, n).figure);
    const states = figures.map((f) => CHECK_LINE_STATE(f, 'water'));
    if (states.every((s) => s === 'opened')) {
      return { outcome: 'favourable', label: 'All water lines opened', interpretation: 'She/he will return back to you.' };
    }
    if (states.every((s) => s === 'closed')) {
      return { outcome: 'unfavourable', label: 'All water lines closed', interpretation: 'He/she will not.' };
    }
    return { outcome: 'uncertain', label: 'Water lines mixed', interpretation: 'This method only addresses all-opened or all-closed results — this chart is mixed.' };
  },
};

export const exWillReturnQuestion: QuestionDefinition = {
  id: 'if-your-ex-husband-wife-girlfriend-or-boyfriend',
  title: 'Will my ex come back to me?',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
