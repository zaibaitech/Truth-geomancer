// Source: Kanzul Mikban, Chapter 31 — "About a Lost Thing / Stolen Things"
// (id "about-a-lost-thing-stolen-things"). One method, fully mechanical —
// a real, verified answer to TWO descriptive questions (the thief's gender,
// and which quarter of the chart — and so which rough distance — the
// result figure falls in), never a favourable/unfavourable one. See
// terrainType.ts: `status: 'verified'` with `outcome: 'descriptive'`
// (Prompt 4.5), not the earlier `needs_review` architectural workaround.
//
// Prompt 6 audit: the "which quarter of the chart" search previously
// hand-rolled its own QUARTERS array — the identical mechanic to chapters
// 35 and 55's own methods, now extracted to the shared FIND_FIGURE_QUARTER
// operation. This chapter keeps its own quarter->key/label mapping (the
// wording here differs from ch.55's), only the SEARCH itself is shared.

import { ADD_MULTIPLE_HOUSES, CHECK_ELEMENT, FIND_FIGURE_QUARTER, type ChartQuarter } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'about-a-lost-thing-stolen-things';

const QUARTER_LABEL: Record<ChartQuarter, { key: string; label: string }> = {
  mothers: { key: 'same-house', label: 'in the same house as you (Mothers)' },
  daughters: { key: 'same-area', label: 'in the same area as you (Daughters)' },
  nieces: { key: 'same-town', label: 'in the same town as you (Nieces)' },
  witnesses: { key: 'far-away', label: 'not in the same town — gone far away (Witnesses/Judge/Reconciler)' },
};

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
    const { quarter } = FIND_FIGURE_QUARTER(chart, calc.resultFigure.dotPattern);
    const found = quarter ? QUARTER_LABEL[quarter] : null;
    const locationText = found ? found.label : 'not found anywhere in the chart — location not addressed by the source';
    const locationKey = found ? found.key : 'not-found';
    return {
      outcome: 'descriptive',
      label: found ? `${gender === 'male' ? 'Male' : 'Female'}, ${found.key.replace('-', ' ')}` : gender === 'male' ? 'Male' : 'Female',
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
