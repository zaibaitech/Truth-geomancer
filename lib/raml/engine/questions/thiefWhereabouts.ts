// Source: Kanzul Mikban, Chapter 55 — "The Whereabouts of a Thief or
// Robbers" (id "the-whereabouts-of-a-thief-or-robbers"). One method, fully
// computable — the same "which quarter of the 16 houses" shape chapter 31's
// lost-thing question already uses (lostThingThiefLocation.ts), applied to
// a different calculation and a genuinely different chapter/question. Not
// merged with chapter 31 — same 1:1 chapter-to-question convention used
// throughout this engine. resultKind is 'descriptive': a location, not a
// favourable/unfavourable value judgment.
//
// Prompt 6 audit: the "which quarter of the chart" search previously
// hand-rolled its own QUARTERS array — the identical mechanic to chapters
// 31 and 35's own methods, now extracted to the shared FIND_FIGURE_QUARTER
// operation. This chapter keeps its own quarter->key/label mapping, only
// the SEARCH itself is shared.

import { ADD_FIGURE_TO_HOUSE, ADD_MULTIPLE_HOUSES, FIND_FIGURE_QUARTER, type ChartQuarter } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'the-whereabouts-of-a-thief-or-robbers';

const QUARTER_LABEL: Record<ChartQuarter, { key: string; label: string }> = {
  mothers: { key: 'same-house', label: 'in the same house or compound with you' },
  daughters: { key: 'same-area', label: 'in the same area with you' },
  nieces: { key: 'same-town', label: 'in the same town with you' },
  witnesses: { key: 'out-of-town', label: 'out of town' },
};

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
    const { quarter } = FIND_FIGURE_QUARTER(chart, calc.resultFigure.dotPattern);
    if (!quarter) {
      return {
        outcome: 'descriptive',
        label: 'Not found anywhere in the chart',
        interpretation: "The resulting star isn't found anywhere in the chart — location not addressed by the source.",
        descriptiveAnswer: 'not-found',
      };
    }
    const found = QUARTER_LABEL[quarter];
    return {
      outcome: 'descriptive',
      label: found.key.replace(/-/g, ' '),
      interpretation: `The thief/robbers are ${found.label}.`,
      descriptiveAnswer: found.key,
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
