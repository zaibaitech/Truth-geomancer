// Source: Kanzul Mikban, Chapter 24 — "If You Will Be Safe Entering a
// Canoe, or Will Get Fish from Fishing" (id
// "if-you-will-be-safe-entering-a-canoe"). Two methods; Method 2 layers
// fortune on top of direction exactly as the source nests them, rather than
// collapsing to direction alone.

import { ADD_MULTIPLE_HOUSES, CHECK_DIRECTION } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-will-be-safe-entering-a-canoe';

const method1: MethodDefinition = {
  id: 'canoe-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'After drawing the chart, pick h10, h12, h14 and h15 and add them. If your result is a downward star, you may not return or come out of the water safely; but if it\'s an upward star, you will come out in peace.',
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [10, 12, 14, 15]);
    return { housesUsed: [10, 12, 14, 15], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const direction = CHECK_DIRECTION(calc.resultFigure);
    if (direction === 'upward') return { outcome: 'favourable', label: 'Upward star', interpretation: 'You will come out in peace.' };
    if (direction === 'downward') return { outcome: 'unfavourable', label: 'Downward star', interpretation: 'You may not return or come out of the water safely.' };
    return { outcome: 'uncertain', label: 'Level star', interpretation: 'This method only addresses a clearly upward or downward result.' };
  },
};

const method2: MethodDefinition = {
  id: 'canoe-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Pick h1, h5, h9 and h13 and add them. If it's a downward star, you or the whole people in the canoe are not safe and may not return. But if it's an upward star, you will be returned safely. Also, if it's a good and downward star, they will see all of you and bring you out of the water; but if it's a bad star, you won't even be seen. If it's a good and upward star, you will get more fish or money, and vice versa.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 5, 9, 13]);
    return { housesUsed: [1, 5, 9, 13], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const direction = CHECK_DIRECTION(calc.resultFigure);
    const fortune = calc.resultFigure.qualities.fortune.value;

    if (direction === 'upward') {
      if (fortune === 'good') return { outcome: 'favourable', label: 'Good, upward star', interpretation: 'You will be returned safely, and get more fish or money.' };
      if (fortune === 'bad') return { outcome: 'mixed', label: 'Bad, upward star', interpretation: 'You will be returned safely, but will not get more fish or money.' };
      return { outcome: 'favourable', label: 'Upward star', interpretation: 'You will be returned safely.' };
    }
    if (direction === 'downward') {
      if (fortune === 'good') return { outcome: 'mixed', label: 'Good, downward star', interpretation: 'You may not be safe, but they will see all of you and bring you out of the water.' };
      if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad, downward star', interpretation: "You or the whole people in the canoe are not safe and may not return — you won't even be seen." };
      return { outcome: 'unfavourable', label: 'Downward star', interpretation: 'You or the whole people in the canoe are not safe and may not return.' };
    }
    return { outcome: 'uncertain', label: 'Level star', interpretation: 'This method only addresses a clearly upward or downward result.' };
  },
};

export const safeInCanoeQuestion: QuestionDefinition = {
  id: 'if-you-will-be-safe-entering-a-canoe',
  title: 'Will I be safe entering a canoe, or get fish from fishing?',
  categoryId: 'travel-change',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
