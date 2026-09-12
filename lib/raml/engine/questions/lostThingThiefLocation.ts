// Source: Kanzul Mikban, Chapter 31 — "About a Lost Thing / Stolen Things"
// (id "about-a-lost-thing-stolen-things"). One method, fully mechanical —
// a real, verified answer to TWO descriptive questions (the thief's gender,
// and which quarter of the chart — and so which rough distance — the
// result figure falls in), never a favourable/unfavourable one. See
// terrainType.ts: `status: 'verified'` with `outcome: 'descriptive'`
// (Prompt 4.5), not the earlier `needs_review` architectural workaround.

import { ADD_MULTIPLE_HOUSES, CHECK_ELEMENT, CHECK_FIGURE_PRESENT_IN_CHART } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'about-a-lost-thing-stolen-things';

const QUARTERS: { houses: number[]; key: string; label: string }[] = [
  { houses: [1, 2, 3, 4], key: 'same-house', label: 'in the same house as you (Mothers)' },
  { houses: [5, 6, 7, 8], key: 'same-area', label: 'in the same area as you (Daughters)' },
  { houses: [9, 10, 11, 12], key: 'same-town', label: 'in the same town as you (Nieces)' },
  { houses: [13, 14, 15, 16], key: 'far-away', label: 'not in the same town — gone far away (Witnesses/Judge/Reconciler)' },
];

const method1: MethodDefinition = {
  id: 'lost-thief-location-method-1',
  label: 'Method 1',
  status: 'verified',
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
    const locationKey = quarter ? quarter.key : 'not-found';
    return {
      outcome: 'descriptive',
      label: quarter ? `${gender === 'male' ? 'Male' : 'Female'}, ${quarter.key.replace('-', ' ')}` : gender === 'male' ? 'Male' : 'Female',
      interpretation: `The thief is ${gender} and is ${locationText}.`,
      descriptiveAnswer: `${gender}:${locationKey}`,
    };
  },
};

export const lostThingThiefLocationQuestion: QuestionDefinition = {
  id: 'about-a-lost-thing-stolen-things',
  title: 'Where is my lost or stolen thing, and who took it?',
  categoryId: 'lost-stolen',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
