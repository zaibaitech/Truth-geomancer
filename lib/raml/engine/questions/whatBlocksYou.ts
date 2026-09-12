// Source: Kanzul Mikban, Chapter 119 — "If You Won't Get What You Are
// Searching For (Ifusal)" (id "if-you-won-t-get-what-you-are"). Same
// shape as chapters 107/108/118: blocked at the first step, since
// Ifusal's own dot-pattern is never defined anywhere in either
// manuscript.

import { CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-won-t-get-what-you-are';

const method1: MethodDefinition = {
  id: 'what-blocks-you-method-1',
  label: 'Method 1',
  status: 'uncertain',
  reviewReasonCode: 'constant_figure_undefined',
  reviewNote:
    "The calculation starts by adding the \"constant figure of Ifusal\" to H1's own figure, but Ifusal's dot-pattern is never defined anywhere in either manuscript.",
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'To know what will block or stop you from getting what you want: after drawing the chart, pick the constant figure of Ifusal and add it to any star found in house 1, and check if it is found in the chart. If it is, it means you won\'t get what you are searching for. If you want to know how long it will take, check the star: if it is found in the first 4, second 4, third 4, or last 4 houses, it is the same explanation as in Nazir.',
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 1);
    return { housesUsed: [1], steps: [trace.description, "Ifusal's own dot-pattern is undefined — the calculation cannot proceed past H1."], resultFigure: figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Ifusal undefined', interpretation: 'The constant figure of Ifusal is never defined in either manuscript.' }),
};

export const whatBlocksYouQuestion: QuestionDefinition = {
  id: 'if-you-won-t-get-what-you-are',
  title: 'What will block me from getting what I want?',
  categoryId: 'lost-stolen',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
