// Source: Kanzul Mikban, Chapter 15 — "If Things Will Be Better for the
// Questioner or Not" (id "if-things-will-be-better-for-the-questioner").
// The one method's good/middle-good/bad branches are all spelled out
// explicitly, unlike most 3-way fortune methods elsewhere in this engine —
// no branch needs an "uncertain, not addressed" fallback here. A trailing
// note about the result figure repeating multiple times elsewhere in the
// chart ("if the star repeats itself a number of times, it also shows how
// your life will be") is too unquantified to encode (the source never says
// what count means what) and is left out rather than guessed at.

import { ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-things-will-be-better-for-the-questioner';

const method1: MethodDefinition = {
  id: 'things-better-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Pick h(2 and h6), then (h3 and h7), then (h8 and h9), then (h13 and h15), then add them all. If you get a good star, you will be wealthy and have a good life. If it's a bad star, it will be difficult to be successful in life. If it's a middle-good star, things will be difficult and sometimes it will be better.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [2, 6, 3, 7, 8, 9, 13, 15]);
    return { housesUsed: [2, 6, 3, 7, 8, 9, 13, 15], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good', interpretation: 'You will be wealthy and have a good life.' };
    if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad', interpretation: 'It will be difficult to be successful in life.' };
    return { outcome: 'mixed', label: 'Middle-good', interpretation: "Things will be difficult, and sometimes it will be better." };
  },
};

export const thingsWillBeBetterQuestion: QuestionDefinition = {
  id: 'if-things-will-be-better-for-the-questioner',
  title: 'Will things get better for me?',
  categoryId: 'fate-timing',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
