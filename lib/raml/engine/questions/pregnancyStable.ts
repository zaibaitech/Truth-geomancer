// Source: Kanzul Mikban, Chapter 14 — "If a Pregnancy Is Going to Be
// Stable or Not (Good Condition)" (id "if-a-pregnancy-is-going-to-be-stable").
// This chapter's text continues into a second sub-topic ("if it's really
// pregnancy or it's sickness") with 3 more methods, but that sub-topic has
// no intention id of its own in content/intentions.ts — a transcription
// artifact, not a separate selectable question — so only the single method
// answering this chapter's own titled question is implemented here.

import { ADD_MULTIPLE_HOUSES, CHECK_FIGURE_PRESENT_IN_CHART } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-a-pregnancy-is-going-to-be-stable';

const method1: MethodDefinition = {
  id: 'pregnancy-stable-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Pick h1, h5, h4 and h10 and add them. If it's a good star, it will be stable; if it's a bad star, it won't. If you get the star in the chart, it's a genuine pregnancy; if it's not found, it's not a real pregnancy.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 5, 4, 10]);
    return { housesUsed: [1, 5, 4, 10], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern);
    const genuineNote = found ? " It's a genuine pregnancy." : " It's not showing as a real pregnancy in the chart.";
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good', interpretation: `It will be stable.${genuineNote}` };
    if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad', interpretation: `It won't be stable.${genuineNote}` };
    return {
      outcome: 'uncertain',
      label: 'Middle-good (not addressed by this method)',
      interpretation: `This method only distinguishes good from bad; a middle-good result isn't covered by its own wording.${genuineNote}`,
    };
  },
};

export const pregnancyStableQuestion: QuestionDefinition = {
  id: 'if-a-pregnancy-is-going-to-be-stable',
  title: 'Is this pregnancy going to be stable?',
  categoryId: 'family-loved-ones',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
