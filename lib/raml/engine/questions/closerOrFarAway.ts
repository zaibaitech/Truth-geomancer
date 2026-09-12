// Source: Kanzul Mikban, Chapter 49 — "If Something Is Closer to You or Far
// Away from You" (id "if-something-is-closer-to-you-or-far"). One method,
// fully computable via the resulting figure's element — every one of the
// 4 elements is assigned to one of the two branches, so no gap is left
// uncertain. resultKind is 'descriptive': proximity is a factual answer,
// not a favourable/unfavourable value judgment the source never makes.

import { ADD_MULTIPLE_HOUSES, CHECK_ELEMENT } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-something-is-closer-to-you-or-far';

const method1: MethodDefinition = {
  id: 'closer-or-far-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h5, h7, h11 and h13 and add them. If it's fire stars or water stars, it's closer to you; but if it's air stars or sand star, it's far away from you.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [5, 7, 11, 13]);
    return { housesUsed: [5, 7, 11, 13], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const { element } = CHECK_ELEMENT(calc.resultFigure);
    const closer = element === 'fire' || element === 'water';
    return closer
      ? { outcome: 'descriptive', label: 'Closer', interpretation: 'It is closer to you.', descriptiveAnswer: 'closer' }
      : { outcome: 'descriptive', label: 'Far away', interpretation: 'It is far away from you.', descriptiveAnswer: 'far-away' };
  },
};

export const closerOrFarAwayQuestion: QuestionDefinition = {
  id: 'if-something-is-closer-to-you-or-far',
  title: 'Is it closer to me or far away?',
  categoryId: 'fate-timing',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
