// Source: Kanzul Mikban, Chapter 140 — "How Long the Prisoner Will Stay in
// Prison/Cells" (id "how-long-the-prisoner-will-stay-in-prison"). One method
// (h1+h3, the SAME calculation as chapter 139), addressing only the
// DOWNWARD-direction branches — see prisonerRemovedPeacefully.ts's header
// comment for why these two chapters are kept as separate questions rather
// than merged. Upward results, and middle-good, are not addressed here —
// left uncertain. resultKind 'outcome': explicitly framed as personal
// benefit/harm ("a while" vs. "life imprisonment... difficult").

import { ADD_MULTIPLE_HOUSES, CHECK_DIRECTION } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'how-long-the-prisoner-will-stay-in-prison';

const method1: MethodDefinition = {
  id: 'how-long-prisoner-stay-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h1 and h3 and add them. If it's a good and downward star, he/she will stay in the cells for a while before they remove him/her. If it's a bad and downward star, he/she is going for life imprisonment — it will be difficult to get him/her out of the prison.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 3]);
    return { housesUsed: [1, 3], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    const direction = CHECK_DIRECTION(calc.resultFigure);
    if (fortune === 'good' && direction === 'downward') {
      return { outcome: 'mixed', label: 'Good and downward', interpretation: 'He/she will stay in the cells for a while before they remove him/her.' };
    }
    if (fortune === 'bad' && direction === 'downward') {
      return { outcome: 'unfavourable', label: 'Bad and downward', interpretation: "He/she is going for life imprisonment — it will be difficult to get him/her out of the prison." };
    }
    return { outcome: 'uncertain', label: 'Not downward, or middle-good', interpretation: 'This method only addresses good-and-downward or bad-and-downward — this is not addressed (see chapter 139 for upward results).' };
  },
};

export const howLongPrisonerStayQuestion: QuestionDefinition = {
  id: 'how-long-the-prisoner-will-stay-in-prison',
  title: 'How long will the prisoner stay in prison?',
  categoryId: 'legal-conflict',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
