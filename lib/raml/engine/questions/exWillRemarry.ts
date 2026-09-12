// Source: Kanzul Mikban, Chapter 69 — "If Your Ex-Husband/Wife Will
// Re-Marry Again After the Divorce" (id "if-your-ex-husband-wife-will-re-marry").
// One method, fully computable — all 3 fortune branches (good/middle-good/
// bad) are addressed, so no gap is left uncertain.

import { ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-your-ex-husband-wife-will-re-marry';

const method1: MethodDefinition = {
  id: 'ex-remarry-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h5 and h7 and add them. If it's a good star, he/she is going to marry again. If it's a middle-good star, he/she will not marry but will only have relationships, or will be sleeping around. If it's a bad star, he/she will not marry, have relationships, or sleep around — she/he will just live his/her life without sex or love relationships.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [5, 7]);
    return { housesUsed: [5, 7], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good star', interpretation: 'He/she is going to marry again.' };
    if (fortune === 'middleGood') {
      return { outcome: 'mixed', label: 'Middle-good star', interpretation: 'He/she will not marry, but will only have relationships, or will be sleeping around.' };
    }
    return {
      outcome: 'unfavourable',
      label: 'Bad star',
      interpretation: "He/she will not marry, have relationships, or sleep around — she/he will just live his/her life without sex or love relationships.",
    };
  },
};

export const exWillRemarryQuestion: QuestionDefinition = {
  id: 'if-your-ex-husband-wife-will-re-marry',
  title: 'Will my ex re-marry after the divorce?',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
