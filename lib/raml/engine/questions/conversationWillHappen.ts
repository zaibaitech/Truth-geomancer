// Source: Kanzul Mikban, Chapter 108 — "If You Will Get to Talk to
// Someone, or If Conversation Will Take Place Between Two People" (id
// "if-you-will-get-to-talk-to-someone"). One method: same shape as
// chapter 107 (Nazir) — the first step ("pick the constant figure of
// Nutik") cannot be computed, since Nutik's dot-pattern is never defined
// anywhere in either manuscript.

import { CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-will-get-to-talk-to-someone';

const method1: MethodDefinition = {
  id: 'conversation-will-happen-method-1',
  label: 'Method 1',
  status: 'uncertain',
  reviewReasonCode: 'constant_figure_undefined',
  reviewNote:
    "The calculation starts by adding the \"constant figure of Nutik\" to H1's own figure, but Nutik's dot-pattern is never defined anywhere in either manuscript.",
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick the constant figure of Nutik and add it to any star found in house 1. Check if it's found in the chart — it means conversation will take place, and vice versa. If it's found in the first 4, second 4, third 4, or last 4 houses in the chart, the explanation is the same as above (for how soon).",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 1);
    return { housesUsed: [1], steps: [trace.description, "Nutik's own dot-pattern is undefined — the calculation cannot proceed past H1."], resultFigure: figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Nutik undefined', interpretation: 'The constant figure of Nutik is never defined in either manuscript.' }),
};

export const conversationWillHappenQuestion: QuestionDefinition = {
  id: 'if-you-will-get-to-talk-to-someone',
  title: 'Will we get to talk?',
  categoryId: 'fate-timing',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
