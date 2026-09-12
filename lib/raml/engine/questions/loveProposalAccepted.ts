// Source: Kanzul Mikban, Chapter 44 — "If a Lady or Man Will Accept Your
// Love Proposal or Not" (id "if-a-lady-or-man-will-accept-your"). One
// method, fully computable — both branches (present/absent in the chart)
// are explicitly addressed by the source, so no gap is left uncertain.

import { ADD_MULTIPLE_HOUSES, CHECK_FIGURE_PRESENT_IN_CHART } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-a-lady-or-man-will-accept-your';

const method1: MethodDefinition = {
  id: 'proposal-accepted-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h7, h9, h11 and h15 and add them. If it's found in the chart, then she will accept it, insha'Allah; but if it's not in the chart, you may not get him/her — it won't be accepted.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [7, 9, 11, 15]);
    return { housesUsed: [7, 9, 11, 15], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern);
    return found
      ? { outcome: 'favourable', label: 'Found in the chart', interpretation: "She/he will accept it, insha'Allah." }
      : { outcome: 'unfavourable', label: 'Not found in the chart', interpretation: "You may not get him/her — it won't be accepted." };
  },
};

export const loveProposalAcceptedQuestion: QuestionDefinition = {
  id: 'if-a-lady-or-man-will-accept-your',
  title: 'Will they accept my love proposal?',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
