// Source: Kanzul Mikban, Chapter 57 — "When to Travel, Daytime or Night
// Time" (id "when-to-travel-daytime-or-night-time"). One method, fully
// computable — "pick h5 and h8, then h6 and h7, and add all" is the same
// SET of 4 houses combined together (geomantic addition is associative/
// commutative — see ADD_MULTIPLE_HOUSES's own doc comment), so this is one
// ADD_MULTIPLE_HOUSES([5,6,7,8]) call, not two separate additions. Every
// one of the 4 elements maps to one of the two branches. resultKind is
// 'descriptive': a timing preference, not a favourable/unfavourable value
// judgment.

import { ADD_MULTIPLE_HOUSES, CHECK_ELEMENT } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'when-to-travel-daytime-or-night-time';

const method1: MethodDefinition = {
  id: 'travel-time-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h5 and h8, then h6 and h7, and add all. If you get fire or air star, it means daytime is good. If you get water or sand star, it means night time is good for you to travel.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [5, 6, 7, 8]);
    return { housesUsed: [5, 6, 7, 8], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const { element } = CHECK_ELEMENT(calc.resultFigure);
    const daytime = element === 'fire' || element === 'air';
    return daytime
      ? { outcome: 'descriptive', label: 'Daytime', interpretation: 'Daytime is good for you to travel.', descriptiveAnswer: 'daytime' }
      : { outcome: 'descriptive', label: 'Night time', interpretation: 'Night time is good for you to travel.', descriptiveAnswer: 'night-time' };
  },
};

export const travelDaytimeOrNightQuestion: QuestionDefinition = {
  id: 'when-to-travel-daytime-or-night-time',
  title: 'Should I travel during the day or at night?',
  categoryId: 'travel-change',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
