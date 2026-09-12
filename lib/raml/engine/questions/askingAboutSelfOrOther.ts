// Source: Kanzul Mikban, Chapter 53 — "If a Querent Is Asking About Someone
// or About Him/Herself" (id "if-a-querent-is-asking-about-someone-or"). One
// method, fully computable via the resulting figure's direction. Level
// (neither clearly upward nor downward) is never addressed, so it is left
// uncertain rather than guessed. resultKind is 'descriptive': this is a
// factual answer, not a favourable/unfavourable value judgment.

import { ADD_MULTIPLE_HOUSES, CHECK_DIRECTION } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-a-querent-is-asking-about-someone-or';

const method1: MethodDefinition = {
  id: 'asking-about-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h1 and h7 and add them. If it's a downward star, he/she is asking about him/herself; but if it's an upward star, he/she is asking about someone else.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 7]);
    return { housesUsed: [1, 7], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const direction = CHECK_DIRECTION(calc.resultFigure);
    if (direction === 'downward') return { outcome: 'descriptive', label: 'Asking about self', interpretation: 'He/she is asking about him/herself.', descriptiveAnswer: 'self' };
    if (direction === 'upward') return { outcome: 'descriptive', label: 'Asking about someone else', interpretation: 'He/she is asking about someone else.', descriptiveAnswer: 'someone-else' };
    return { outcome: 'uncertain', label: 'Level star', interpretation: 'This method only addresses a clearly upward or downward result.' };
  },
};

export const askingAboutSelfOrOtherQuestion: QuestionDefinition = {
  id: 'if-a-querent-is-asking-about-someone-or',
  title: 'Am I asking about myself or someone else?',
  categoryId: 'fate-timing',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
