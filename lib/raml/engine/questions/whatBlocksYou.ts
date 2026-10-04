// Source: Kanzul Mikban, Chapter 119 — "If You Won't Get What You Are Searching For (Ifusal)" (id
// "if-you-won-t-get-what-you-are"). One method: add the constant figure of Ifusal to H1's own
// figure and look for the result in the chart; the quarter it is found in
// gives the timing. Ifusal's figure (Ayuba) is supplied by the author-confirmed final
// edition (kanzulFinalEditionFigures.ts CONSTANT_FIGURES) — it was previously
// undefined (constant_figure_undefined). See ../constantFigureSearch.ts for the
// shared shape. resultKind 'descriptive'.

import type { MethodDefinition, QuestionDefinition } from '../types';
import { CONSTANT_FIGURES } from '../kanzulFinalEditionFigures';
import { NAZIR_TIMING, constantPlusH1, resultQuarter } from '../constantFigureSearch';

const CHAPTER_ID = 'if-you-won-t-get-what-you-are';

const method1: MethodDefinition = {
  id: 'what-blocks-you-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'To know what will block or stop you from getting what you want: after drawing the chart, pick the constant figure of Ifusal and add it to any star found in house 1, and check if it is found in the chart. If it is, it means you won\'t get what you are searching for. If you want to know how long it will take, check the star: if it is found in the first 4, second 4, third 4, or last 4 houses, it is the same explanation as in Nazir.',
  },
  // Ifusal's constant figure (ayuba) comes from the author-confirmed final
  // edition (CONSTANT_FIGURES.ifusal); it is added to H1's own figure, and the
  // result is looked for in the chart.
  calculate: constantPlusH1(CONSTANT_FIGURES.ifusal.starId),
  evaluate: (calc, chart) => {
    const quarter = resultQuarter(chart, calc);
    const timing = quarter ? NAZIR_TIMING[quarter] : null;
    return timing
      ? {
          outcome: 'descriptive',
          label: `${calc.resultFigure.figureName} found among the ${timing.label}`,
          interpretation: `You won't get what you are searching for (timing, as in Nazir: ${timing.text}).`,
          descriptiveAnswer: 'blocked',
        }
      : { outcome: 'uncertain', label: 'Result not found in the chart', interpretation: 'The source only states what it means when the result is found in the chart.' };
  },
};

export const whatBlocksYouQuestion: QuestionDefinition = {
  id: 'if-you-won-t-get-what-you-are',
  title: 'What will block me from getting what I want?',
  categoryId: 'lost-stolen',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
