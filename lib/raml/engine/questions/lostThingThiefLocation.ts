// Source: Kanzul Mikban, Chapter 31 — "About a Lost Thing / Stolen Things"
// (id "about-a-lost-thing-stolen-things"). One method, fully mechanical —
// but it answers TWO descriptive questions (the thief's gender, and which
// quarter of the chart — and so which rough distance — the result figure
// falls in), never a favourable/unfavourable one. Same architectural gap as
// chapter 23's terrain reading: `needs_review`, not because anything is
// missing, but because this engine's outcome vocabulary has no honest way
// to represent a purely descriptive answer.

import { ADD_MULTIPLE_HOUSES, CHECK_ELEMENT, CHECK_FIGURE_PRESENT_IN_CHART } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'about-a-lost-thing-stolen-things';

const QUARTERS: { houses: number[]; label: string }[] = [
  { houses: [1, 2, 3, 4], label: 'in the same house as you (Mothers)' },
  { houses: [5, 6, 7, 8], label: 'in the same area as you (Daughters)' },
  { houses: [9, 10, 11, 12], label: 'in the same town as you (Nieces)' },
  { houses: [13, 14, 15, 16], label: 'not in the same town — gone far away (Witnesses/Judge/Reconciler)' },
];

const method1: MethodDefinition = {
  id: 'lost-thief-location-method-1',
  label: 'Method 1',
  status: 'needs_review',
  reviewNote:
    "This method answers descriptive questions (the thief's gender, and which quarter of the chart the result falls in) rather than a favourable/unfavourable one. The current engine has no MethodOutcome for a purely descriptive result, so no verdict is asserted — the calculation itself is fully computed and shown below.",
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h4 and h5 and add them. If you get fire or air star, it means the thief is a male; but if it's water or sand star, it means the thief is female. If the star is found in the first 4 houses (mothers' houses), it means the thief is in the same house with you. If it's found in the second 4 houses (children's houses), it means the thief is in the same area with you. If it's found in the third 4 houses (Al-fafidat), it means the thief is in the same town with you. If the star is found in the last 4 houses (Sumurakat), it means the thief is not in the same town with you — he/she is gone far away.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [4, 5]);
    return { housesUsed: [4, 5], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const { element } = CHECK_ELEMENT(calc.resultFigure);
    const gender = element === 'fire' || element === 'air' ? 'male' : 'female';
    const quarter = QUARTERS.find((q) => CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern, q.houses).found);
    const locationText = quarter ? quarter.label : 'not found anywhere in the chart — location not addressed by the source';
    return { outcome: 'uncertain', label: `${element} figure`, interpretation: `The thief is ${gender} and is ${locationText}.` };
  },
};

export const lostThingThiefLocationQuestion: QuestionDefinition = {
  id: 'about-a-lost-thing-stolen-things',
  title: 'Where is my lost or stolen thing, and who took it?',
  categoryId: 'lost-stolen',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
