// Source: Kanzul Mikban, Chapter 54 — "Where Your Success Is, or Where You
// Will Make It in Life" (id "where-your-success-is-or-where-you-will"). One
// method, fully computable via the resulting figure's element — every one
// of the 4 elements maps to a named direction. resultKind is 'descriptive':
// a compass direction, same shape as chapter 36's locate-someone-or-
// something question (Prompt 4.5).

import { ADD_MULTIPLE_HOUSES, CHECK_ELEMENT } from '../operations';
import type { Element } from '@/content/stars';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'where-your-success-is-or-where-you-will';

const DIRECTION_LABEL: Record<Element, string> = {
  fire: 'Eastern',
  air: 'Western',
  water: 'Northern',
  sand: 'Southern',
};

const method1: MethodDefinition = {
  id: 'where-success-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h1, h7, h4 and h8 and add all of them. If you get fire stars, it means it's in the Eastern part of the world. If it's air stars, it means it's in the Western part of the world. If it's water stars, it means it's in the Northern part of the world. And if it's sand stars, it's in the Southern part.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 7, 4, 8]);
    return { housesUsed: [1, 7, 4, 8], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const { element } = CHECK_ELEMENT(calc.resultFigure);
    return {
      outcome: 'descriptive',
      label: `${DIRECTION_LABEL[element]} part of the world`,
      interpretation: `Your success is in the ${DIRECTION_LABEL[element].toLowerCase()} part of the world.`,
      descriptiveAnswer: element,
    };
  },
};

export const whereSuccessIsQuestion: QuestionDefinition = {
  id: 'where-your-success-is-or-where-you-will',
  title: 'Where will I find success in life?',
  categoryId: 'work-success',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
