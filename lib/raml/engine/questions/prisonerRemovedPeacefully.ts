// Source: Kanzul Mikban, Chapter 139 — "If the Prisoner Will Be Removed
// Peacefully" (id "if-the-prisoner-will-be-removed-peacefully"). One method
// (h1+h3), addressing only the UPWARD-direction branches (good-and-upward,
// bad-and-upward) — chapter 140, a few pages later, shares this exact same
// calculation but addresses the DOWNWARD-direction branches instead; the two
// chapters partition one underlying h1+h3 result by direction, so they are
// implemented as two separate questions (as titled) rather than merged, each
// only covering its own stated direction. Downward results, and middle-good,
// are not addressed here — left uncertain. resultKind 'outcome': explicitly
// framed as personal benefit/harm ("happily" vs. "sadness and stress").

import { ADD_MULTIPLE_HOUSES, CHECK_DIRECTION } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-the-prisoner-will-be-removed-peacefully';

const method1: MethodDefinition = {
  id: 'prisoner-removed-peacefully-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'After casting the chart, pick h1 and h3 and add them. If it is a good and upward star, he/she will be removed peacefully and happily. If it is a bad and upward star, it will take a longer time before they can remove him/her, with sadness and a lot of stress.',
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 3]);
    return { housesUsed: [1, 3], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    const direction = CHECK_DIRECTION(calc.resultFigure);
    if (fortune === 'good' && direction === 'upward') {
      return { outcome: 'favourable', label: 'Good and upward', interpretation: 'He/she will be removed peacefully and happily.' };
    }
    if (fortune === 'bad' && direction === 'upward') {
      return { outcome: 'unfavourable', label: 'Bad and upward', interpretation: 'It will take a longer time before they can remove him/her, with sadness and a lot of stress.' };
    }
    return { outcome: 'uncertain', label: 'Not upward, or middle-good', interpretation: 'This method only addresses good-and-upward or bad-and-upward — this is not addressed (see chapter 140 for downward results).' };
  },
};

export const prisonerRemovedPeacefullyQuestion: QuestionDefinition = {
  id: 'if-the-prisoner-will-be-removed-peacefully',
  title: 'Will the prisoner be removed peacefully?',
  categoryId: 'legal-conflict',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
