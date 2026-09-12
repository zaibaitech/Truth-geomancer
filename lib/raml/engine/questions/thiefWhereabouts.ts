// Source: Kanzul Mikban, Chapter 55 — "The Whereabouts of a Thief or
// Robbers" (id "the-whereabouts-of-a-thief-or-robbers"). One method, fully
// computable — the same "which quarter of the 16 houses" shape chapter 31's
// lost-thing question already uses (lostThingThiefLocation.ts), applied to
// a different calculation and a genuinely different chapter/question. Not
// merged with chapter 31 — same 1:1 chapter-to-question convention used
// throughout this engine. resultKind is 'descriptive': a location, not a
// favourable/unfavourable value judgment.

import { ADD_FIGURE_TO_HOUSE, ADD_MULTIPLE_HOUSES, CHECK_FIGURE_PRESENT_IN_CHART } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'the-whereabouts-of-a-thief-or-robbers';

const QUARTERS: { houses: number[]; key: string; label: string }[] = [
  { houses: [1, 2, 3, 4], key: 'same-house', label: 'in the same house or compound with you' },
  { houses: [5, 6, 7, 8], key: 'same-area', label: 'in the same area with you' },
  { houses: [9, 10, 11, 12], key: 'same-town', label: 'in the same town with you' },
  { houses: [13, 14, 15, 16], key: 'out-of-town', label: 'out of town' },
];

const method1: MethodDefinition = {
  id: 'thief-whereabouts-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h1 and h12 and add them. Then add the result to h13 and check where you can locate the star in the chart. If it's found in the first 4 houses, it means the thief is in the same house or compound with you. If it's found in the second 4 houses, it means he/she is in the same area with you. If it's found in the third 4 houses, it means he/she is in the same town with you. And if it's found in the last 4 houses, it means he/she is out of town.",
  },
  calculate: (chart) => {
    const step1 = ADD_MULTIPLE_HOUSES(chart, [1, 12]);
    const step2 = ADD_FIGURE_TO_HOUSE(chart, step1.figure, 13);
    return { housesUsed: [1, 12, 13], steps: [step1.trace.description, step2.trace.description], resultFigure: step2.figure };
  },
  evaluate: (calc, chart) => {
    const quarter = QUARTERS.find((q) => CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern, q.houses).found);
    if (!quarter) {
      return {
        outcome: 'descriptive',
        label: 'Not found anywhere in the chart',
        interpretation: "The resulting star isn't found anywhere in the chart — location not addressed by the source.",
        descriptiveAnswer: 'not-found',
      };
    }
    return {
      outcome: 'descriptive',
      label: quarter.key.replace(/-/g, ' '),
      interpretation: `The thief/robbers are ${quarter.label}.`,
      descriptiveAnswer: quarter.key,
    };
  },
};

export const thiefWhereaboutsQuestion: QuestionDefinition = {
  id: 'the-whereabouts-of-a-thief-or-robbers',
  title: 'Where is the thief or robbers?',
  categoryId: 'legal-conflict',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
