// Source: Kanzul Mikban, Chapter 118 — "If You Will Get What You Are Searching For, in a Place (Itisal)" (id
// "if-you-will-get-what-you-are-searching"). One method: add the constant figure of Itisal to H1's own
// figure and look for the result in the chart; the quarter it is found in
// gives the timing. Itisal's figure (Iddris) is supplied by the author-confirmed final
// edition (kanzulFinalEditionFigures.ts CONSTANT_FIGURES) — it was previously
// undefined (constant_figure_undefined). See ../constantFigureSearch.ts for the
// shared shape. resultKind 'descriptive'.

import type { MethodDefinition, QuestionDefinition } from '../types';
import { CONSTANT_FIGURES } from '../kanzulFinalEditionFigures';
import { NAZIR_TIMING, constantPlusH1, resultQuarter } from '../constantFigureSearch';

const CHAPTER_ID = 'if-you-will-get-what-you-are-searching';

const method1: MethodDefinition = {
  id: 'get-what-searching-for-in-place-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'After casting the chart, pick the constant figure of Itisal and add it to any star found in house 1, and check if it is found in the chart. If it is, you will get it; but if it is not in the chart, you will not get it. If it is found in the first 4, second 4, third 4, or last 4 houses, it is the same explanation as above in (Nazir).',
  },
  // Itisal's constant figure (iddris) comes from the author-confirmed final
  // edition (CONSTANT_FIGURES.itisal); it is added to H1's own figure, and the
  // result is looked for in the chart.
  calculate: constantPlusH1(CONSTANT_FIGURES.itisal.starId),
  evaluate: (calc, chart) => {
    const quarter = resultQuarter(chart, calc);
    const timing = quarter ? NAZIR_TIMING[quarter] : null;
    return timing
      ? {
          outcome: 'descriptive',
          label: `${calc.resultFigure.figureName} found among the ${timing.label}`,
          interpretation: `You will get it (timing, as in Nazir: ${timing.text}).`,
          descriptiveAnswer: 'will-get-it',
        }
      : { outcome: 'descriptive', label: 'Result not found in the chart', interpretation: 'You will not get it.', descriptiveAnswer: 'will-not-get-it' };
  },
};

export const getWhatSearchingForInPlaceQuestion: QuestionDefinition = {
  id: 'if-you-will-get-what-you-are-searching',
  title: 'Will I get what I am searching for, in this place?',
  categoryId: 'lost-stolen',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
