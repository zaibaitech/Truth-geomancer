// Source: Kanzul Mikban, Chapter 121 — "If You Will Get Knowledge or Not in
// Your Life" (id "if-you-will-get-knowledge-or-not-in"). One method: check
// H1; only if it is Adam or Ali does the source say anything at all, and
// even then only when that same figure is ALSO found repeated at H9 or H11
// (the "house-repeat lookup" shape already established at chapters 98/101/
// 105/126 — a positive trigger plus a repeat-location check). Neither "H1 is
// Adam/Ali but not repeated at H9/H11" nor "H1 is some other figure
// entirely" is addressed — left uncertain rather than assumed favourable or
// unfavourable. resultKind 'outcome': getting knowledge/wisdom is presented
// as a personal benefit, not a neutral fact.

import { CHECK_FIGURE_PRESENT_IN_CHART, CHECK_HOUSE, MATCH_FIGURE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-will-get-knowledge-or-not-in';

const method1: MethodDefinition = {
  id: 'get-knowledge-in-life-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'After casting the chart, check h1. If you get Adam, or Ali, found in h9 or h11, it means you will get knowledge and wisdom in future.',
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 1);
    return { housesUsed: [1], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const isTrigger = MATCH_FIGURE(calc.resultFigure, 'adam') || MATCH_FIGURE(calc.resultFigure, 'ali');
    if (!isTrigger) {
      return { outcome: 'uncertain', label: 'Neither Adam nor Ali at H1', interpretation: 'The source only defines this rule for Adam or Ali at H1 — this chart has neither.' };
    }
    const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern, [9, 11]);
    if (found) {
      return { outcome: 'favourable', label: 'Knowledge and wisdom ahead', interpretation: 'You will get knowledge and wisdom in future.' };
    }
    return { outcome: 'uncertain', label: 'Not repeated at H9/H11', interpretation: 'The source states the rule only for when the H1 figure is also found at H9 or H11 — this chart does not repeat it there.' };
  },
};

export const getKnowledgeInLifeQuestion: QuestionDefinition = {
  id: 'if-you-will-get-knowledge-or-not-in',
  title: 'Will I gain knowledge and wisdom in my life?',
  categoryId: 'fate-timing',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
