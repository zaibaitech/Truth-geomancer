// Source: Kanzul Mikban, Chapter 123 — "If Something Will Burn" (id
// "if-something-will-burn"). One method: check the FIRE line of h5, h6, h8
// and h9 individually (not summed into one figure — this is a per-house
// line-state check across four specific houses, the same shape as chapter
// 78's dot count but restricted to one named element and a positive-trigger
// verdict rather than a count). Only the "all four opened" case is
// addressed; any other combination is left uncertain. There is no single
// "result figure" for this method — H5's own figure is kept as a
// representative reference only, matching the chapter 120 Method 1
// precedent (enemiesHowMany.ts). resultKind 'outcome': something burning is
// framed as bad news for the querent, not a neutral fact.

import { CHECK_HOUSE, CHECK_LINE_STATE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-something-will-burn';
const HOUSES = [5, 6, 8, 9];

const method1: MethodDefinition = {
  id: 'something-will-burn-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'After drawing the chart, check the fire elements of h5, h6, h8 and h9. If they are all opened, then something will burn, or it has already burnt.',
  },
  calculate: (chart) => {
    const figures = HOUSES.map((n) => CHECK_HOUSE(chart, n));
    return {
      housesUsed: HOUSES,
      steps: figures.map((f, i) => `H${HOUSES[i]} fire line: ${CHECK_LINE_STATE(f.figure, 'fire')}`),
      resultFigure: figures[0].figure, // representative reference only — no single result figure
    };
  },
  evaluate: (_calc, chart) => {
    const allOpened = HOUSES.every((n) => CHECK_LINE_STATE(CHECK_HOUSE(chart, n).figure, 'fire') === 'opened');
    if (allOpened) {
      return { outcome: 'unfavourable', label: 'All four fire lines opened', interpretation: 'Something will burn, or it has already burnt.' };
    }
    return { outcome: 'uncertain', label: 'Not all fire lines opened', interpretation: 'The source only addresses the case where all four fire lines are opened — this is not addressed.' };
  },
};

export const somethingWillBurnQuestion: QuestionDefinition = {
  id: 'if-something-will-burn',
  title: 'Will something burn?',
  categoryId: 'fate-timing',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
