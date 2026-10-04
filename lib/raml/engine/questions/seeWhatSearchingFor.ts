// Source: Kanzul Mikban, Chapter 107 — "If You Will See What You Are Searching For or Not (Nazir)" (id
// "if-you-will-see-what-you-are-searching"). One method: add the constant figure of Nazir to H1's own
// figure and look for the result in the chart; the quarter it is found in
// gives the timing. Nazir's figure (Adam) is supplied by the author-confirmed final
// edition (kanzulFinalEditionFigures.ts CONSTANT_FIGURES) — it was previously
// undefined (constant_figure_undefined). See ../constantFigureSearch.ts for the
// shared shape. resultKind 'descriptive'.

import type { MethodDefinition, QuestionDefinition } from '../types';
import { CONSTANT_FIGURES } from '../kanzulFinalEditionFigures';
import { NAZIR_TIMING, constantPlusH1, resultQuarter } from '../constantFigureSearch';

const CHAPTER_ID = 'if-you-will-see-what-you-are-searching';

const method1: MethodDefinition = {
  id: 'see-what-searching-for-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick the constant figure of Nazir and add it to any star found in house 1. If the star is found in the chart, you will see it, and the vice versa. If it's found in the first 4 houses in the chart (Umuhat), you will see it within some seconds or days. If it's found in the second 4 houses (Banat), you will see it within some minutes or weeks. If it's found in the third 4 houses (Hafidat), you will see it within some hours or months. And if you found it in the last 4 houses (Sumurakat), you may not see it again, or you may see it within many hours or years.",
  },
  // Nazir's constant figure (adam) comes from the author-confirmed final
  // edition (CONSTANT_FIGURES.nazir); it is added to H1's own figure, and the
  // result is looked for in the chart.
  calculate: constantPlusH1(CONSTANT_FIGURES.nazir.starId),
  evaluate: (calc, chart) => {
    const quarter = resultQuarter(chart, calc);
    const timing = quarter ? NAZIR_TIMING[quarter] : null;
    return timing
      ? {
          outcome: 'descriptive',
          label: `${calc.resultFigure.figureName} found among the ${timing.label}`,
          interpretation: `You will see it (timing, as in Nazir: ${timing.text}).`,
          descriptiveAnswer: 'will-see',
        }
      : { outcome: 'descriptive', label: 'Result not found in the chart', interpretation: 'You will not see it.', descriptiveAnswer: 'will-not-see' };
  },
};

export const seeWhatSearchingForQuestion: QuestionDefinition = {
  id: 'if-you-will-see-what-you-are-searching',
  title: 'Will I see what I am searching for?',
  categoryId: 'lost-stolen',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
