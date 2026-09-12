// Source: Kanzul Mikban, Chapter 62 — "If the Prayers Done for Someone Have
// Been Answered or Not" (id "if-the-prayers-done-for-someone-have-been").
// One method: extract the water element from each of the chart's 4
// quarters (Mothers h1-4, Daughters h5-8, Nieces h9-12,
// Witnesses/Judge/Reconciler h13-16) into 4 synthetic figures, add all 4
// together, then read the final figure's own water line state — fully
// computable via the existing EXTRACT_ELEMENT primitive plus the new
// ADD_FIGURES primitive (Prompt 7), which sums already-computed figures
// rather than houses directly.

import { ADD_FIGURES, CHECK_LINE_STATE, EXTRACT_ELEMENT } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-the-prayers-done-for-someone-have-been';

const method1: MethodDefinition = {
  id: 'prayers-answered-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'Pick the water elements of the first 4 houses, second 4 houses, third 4 houses, and last 4 houses. Then add all and check if the water element of that star is opened — it\'s answered, and vice versa.',
  },
  calculate: (chart) => {
    const mothers = EXTRACT_ELEMENT(chart, [1, 2, 3, 4], 'water');
    const daughters = EXTRACT_ELEMENT(chart, [5, 6, 7, 8], 'water');
    const nieces = EXTRACT_ELEMENT(chart, [9, 10, 11, 12], 'water');
    const witnesses = EXTRACT_ELEMENT(chart, [13, 14, 15, 16], 'water');
    const sum = ADD_FIGURES([mothers.figure, daughters.figure, nieces.figure, witnesses.figure]);
    return {
      housesUsed: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      steps: [mothers.trace.description, daughters.trace.description, nieces.trace.description, witnesses.trace.description, sum.trace.description],
      resultFigure: sum.figure,
    };
  },
  evaluate: (calc) => {
    const opened = CHECK_LINE_STATE(calc.resultFigure, 'water') === 'opened';
    return opened
      ? { outcome: 'favourable', label: 'Water line opened', interpretation: "The water element is opened — the prayers have been answered." }
      : { outcome: 'unfavourable', label: 'Water line closed', interpretation: 'The water element is closed — the prayers have not been answered.' };
  },
};

export const prayersAnsweredQuestion: QuestionDefinition = {
  id: 'if-the-prayers-done-for-someone-have-been',
  title: 'Have the prayers done for this person been answered?',
  categoryId: 'fate-timing',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
