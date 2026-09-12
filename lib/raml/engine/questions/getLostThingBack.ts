// Source: Kanzul Mikban, Chapter 45 — "If You Will Get the Lost Thing Back"
// (id "if-you-will-get-the-lost-thing-back"). One method, a whole-chart
// element tally — fully computable via the existing COUNT_ELEMENTS
// primitive. The source is silent on an exact tie (water+air ==
// fire+sand), which is left uncertain rather than assumed either way.

import { CHECK_HOUSE, COUNT_ELEMENTS } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-will-get-the-lost-thing-back';

const method1: MethodDefinition = {
  id: 'get-lost-thing-back-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'After casting the chart, count all the (water and air elements) and (fire and sand elements). If water and air elements are more than the fire and sand elements, then you will get it back, and the vice versa.',
  },
  calculate: (chart) => {
    const tally = COUNT_ELEMENTS(chart);
    const waterAir = tally.water + tally.air;
    const fireSand = tally.fire + tally.sand;
    const judge = CHECK_HOUSE(chart, 15).figure; // representative reference figure only — see goodToStayInTown.ts's Method 2
    return {
      housesUsed: [],
      steps: [`Whole chart: water+air = ${waterAir}, fire+sand = ${fireSand}`],
      resultFigure: judge,
    };
  },
  evaluate: (_calc, chart) => {
    const tally = COUNT_ELEMENTS(chart);
    const waterAir = tally.water + tally.air;
    const fireSand = tally.fire + tally.sand;
    if (waterAir > fireSand) {
      return { outcome: 'favourable', label: `Water+Air ${waterAir} > Fire+Sand ${fireSand}`, interpretation: 'You will get it back.' };
    }
    if (fireSand > waterAir) {
      return { outcome: 'unfavourable', label: `Fire+Sand ${fireSand} > Water+Air ${waterAir}`, interpretation: 'You will not get it back.' };
    }
    return { outcome: 'uncertain', label: `Tied ${waterAir}-${fireSand}`, interpretation: 'The source only addresses a clear majority either way — this chart is exactly tied.' };
  },
};

export const getLostThingBackQuestion: QuestionDefinition = {
  id: 'if-you-will-get-the-lost-thing-back',
  title: 'Will I get the lost thing back?',
  categoryId: 'lost-stolen',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
