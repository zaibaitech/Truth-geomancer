// Source: Kanzul Mikban, Chapter 60 — "If She/He Loves You or Not" (id
// "if-she-he-loves-you-or-not"). Two methods, both fully computable — every
// fortune/direction combination the source names is addressed. Middle-good
// ("double dating/cheating") is kept as `mixed` rather than flattened into
// unfavourable, matching this engine's existing convention for a real,
// distinct caveat (some love present alongside infidelity) rather than "no
// love at all" (bad -> unfavourable).

import { ADD_MULTIPLE_HOUSES, CHECK_DIRECTION, CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-she-he-loves-you-or-not';

const method1: MethodDefinition = {
  id: 'does-love-you-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h1 and h5 and add them. If it's a good and downward star, then he/she really loves you very much. If it's a good and upward star, it means he/she does, but not much, or there might be a divorce or separation in future. If it's a middle-good star, it means there's double dating or cheating. If it's a bad star, it means she/he doesn't love you at all.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 5]);
    return { housesUsed: [1, 5], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    const direction = CHECK_DIRECTION(calc.resultFigure);
    if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad star', interpretation: "She/he doesn't love you at all." };
    if (fortune === 'middleGood') return { outcome: 'mixed', label: 'Middle-good star', interpretation: "There's double dating or cheating." };
    if (fortune === 'good' && direction === 'downward') return { outcome: 'favourable', label: 'Good and downward', interpretation: 'He/she really loves you very much.' };
    if (fortune === 'good' && direction === 'upward') return { outcome: 'mixed', label: 'Good and upward', interpretation: 'He/she does love you, but not much, or there might be a divorce or separation in future.' };
    return { outcome: 'uncertain', label: 'Good, level', interpretation: 'This method only addresses a clearly upward or downward result for a good star.' };
  },
};

const method2: MethodDefinition = {
  id: 'does-love-you-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, check h7. If it's a good star, he/she loves you. If it's a middle-good star, he/she is double dating. And if it's a bad star, he/she does not love you.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 7);
    return { housesUsed: [7], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good star', interpretation: 'He/she loves you.' };
    if (fortune === 'middleGood') return { outcome: 'mixed', label: 'Middle-good star', interpretation: 'He/she is double dating.' };
    return { outcome: 'unfavourable', label: 'Bad star', interpretation: 'He/she does not love you.' };
  },
};

export const doesLoveYouQuestion: QuestionDefinition = {
  id: 'if-she-he-loves-you-or-not',
  title: 'Does he/she love me?',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
