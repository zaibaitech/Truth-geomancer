// Source: Kanzul Mikban, Chapter 8 — "If One Will Stay in a Particular
// Place or Not, and If It's Good or Not" (id
// "if-one-will-stay-in-a-particular-place"). The chapter's title itself
// poses two questions from one calculation — whether they stay, and
// whether staying is good — so the method's direction axis (the more
// concrete "will they stay" fact) drives the outcome, with its fortune
// axis folded in as a supporting note rather than a second gate.

import { ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-one-will-stay-in-a-particular-place';

const method1: MethodDefinition = {
  id: 'stay-in-place-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Pick h2 and h16 and add them. If it's a downward star, he/she will stay there forever; if it's an upward star, he/she will leave one day. If it's a good star, it's good to stay; if it's a bad star, it's not good.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [2, 16]);
    return { housesUsed: [2, 16], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const { direction, fortune } = calc.resultFigure.qualities;
    const note =
      fortune.value === 'good' ? " It's good to stay." : fortune.value === 'bad' ? " It's not good to stay." : '';

    if (direction.value === 'downward') {
      return { outcome: 'favourable', label: 'Downward', interpretation: `He/she will stay there forever.${note}` };
    }
    if (direction.value === 'upward') {
      return { outcome: 'unfavourable', label: 'Upward', interpretation: `He/she will leave one day.${note}` };
    }
    return {
      outcome: 'uncertain',
      label: "Level (no clear direction)",
      interpretation: `This figure's top and bottom lines match, so this method's stay/leave test doesn't resolve cleanly here.${note}`,
    };
  },
};

export const stayInPlaceQuestion: QuestionDefinition = {
  id: 'if-one-will-stay-in-a-particular-place',
  title: "Will they stay in a particular place, and is it good?",
  categoryId: 'travel-change',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
