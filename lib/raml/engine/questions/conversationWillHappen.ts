// Source: Kanzul Mikban, Chapter 108 — "If You Will Get to Talk to Someone, or If Conversation Will Take Place Between Two People" (id
// "if-you-will-get-to-talk-to-someone"). One method: add the constant figure of Nutik to H1's own
// figure and look for the result in the chart; the quarter it is found in
// gives the timing. Nutik's figure (Umar) is supplied by the author-confirmed final
// edition (kanzulFinalEditionFigures.ts CONSTANT_FIGURES) — it was previously
// undefined (constant_figure_undefined). See ../constantFigureSearch.ts for the
// shared shape. resultKind 'descriptive'.

import type { MethodDefinition, QuestionDefinition } from '../types';
import { CONSTANT_FIGURES } from '../kanzulFinalEditionFigures';
import { NAZIR_TIMING, constantPlusH1, resultQuarter } from '../constantFigureSearch';

const CHAPTER_ID = 'if-you-will-get-to-talk-to-someone';

const method1: MethodDefinition = {
  id: 'conversation-will-happen-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick the constant figure of Nutik and add it to any star found in house 1. Check if it's found in the chart — it means conversation will take place, and vice versa. If it's found in the first 4, second 4, third 4, or last 4 houses in the chart, the explanation is the same as above (for how soon).",
  },
  // Nutik's constant figure (umar) comes from the author-confirmed final
  // edition (CONSTANT_FIGURES.nutik); it is added to H1's own figure, and the
  // result is looked for in the chart.
  calculate: constantPlusH1(CONSTANT_FIGURES.nutik.starId),
  evaluate: (calc, chart) => {
    const quarter = resultQuarter(chart, calc);
    const timing = quarter ? NAZIR_TIMING[quarter] : null;
    return timing
      ? {
          outcome: 'descriptive',
          label: `${calc.resultFigure.figureName} found among the ${timing.label}`,
          interpretation: `A conversation will take place (timing, as in Nazir: ${timing.text}).`,
          descriptiveAnswer: 'conversation-will-take-place',
        }
      : { outcome: 'descriptive', label: 'Result not found in the chart', interpretation: 'No conversation will take place.', descriptiveAnswer: 'no-conversation' };
  },
};

export const conversationWillHappenQuestion: QuestionDefinition = {
  id: 'if-you-will-get-to-talk-to-someone',
  title: 'Will we get to talk?',
  categoryId: 'fate-timing',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
