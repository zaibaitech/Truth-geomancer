// Source: Kanzul Mikban, Chapter 67 — "If He/She Is Enjoying the Marriage"
// (id "if-he-she-is-enjoying-the-marriage"). One method: extract each
// element from its own matching house-position across the 4 quarters
// (fire from H1/H5/H9/H13, air from H2/H6/H10/H14, water from H3/H7/H11/
// H15, sand from H4/H8/H12/H16 — this exact "sand-sand" grouping is
// confirmed verbatim by chapter 74's own worked example later in this
// same manuscript), add all 4 together, then read the result — fully
// computable via EXTRACT_ELEMENT + the new ADD_FIGURES primitive
// (Prompt 7). The "not found in the chart" branch is checked first, since
// the source states it as an override on top of the fortune/direction
// breakdown ("she/he is not in the marriage anymore" — a different
// situation from any live marriage's quality).

import { ADD_FIGURES, CHECK_DIRECTION, CHECK_FIGURE_PRESENT_IN_CHART, EXTRACT_ELEMENT } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-he-she-is-enjoying-the-marriage';

const method1: MethodDefinition = {
  id: 'enjoying-marriage-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick fire-fire elements, air-air elements, water-water elements, and sand-sand elements, and add them all. If you get a good and downward star, she/he is enjoying the marriage. If it's good and upward star, he/she is in the marriage but with no happiness or enjoyment. If it's a bad star, it means the marriage is on and off. If the star is not in the chart, it means he/she is not in the marriage anymore.",
  },
  calculate: (chart) => {
    const fire = EXTRACT_ELEMENT(chart, [1, 5, 9, 13], 'fire');
    const air = EXTRACT_ELEMENT(chart, [2, 6, 10, 14], 'air');
    const water = EXTRACT_ELEMENT(chart, [3, 7, 11, 15], 'water');
    const sand = EXTRACT_ELEMENT(chart, [4, 8, 12, 16], 'sand');
    const sum = ADD_FIGURES([fire.figure, air.figure, water.figure, sand.figure]);
    return {
      housesUsed: [1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15, 4, 8, 12, 16],
      steps: [fire.trace.description, air.trace.description, water.trace.description, sand.trace.description, sum.trace.description],
      resultFigure: sum.figure,
    };
  },
  evaluate: (calc, chart) => {
    const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern);
    if (!found) {
      return { outcome: 'unfavourable', label: 'Not found in the chart', interpretation: 'He/she is not in the marriage anymore.' };
    }
    const fortune = calc.resultFigure.qualities.fortune.value;
    const direction = CHECK_DIRECTION(calc.resultFigure);
    if (fortune === 'good' && direction === 'downward') {
      return { outcome: 'favourable', label: 'Good and downward', interpretation: 'She/he is enjoying the marriage.' };
    }
    if (fortune === 'good' && direction === 'upward') {
      return { outcome: 'mixed', label: 'Good and upward', interpretation: 'He/she is in the marriage but with no happiness or enjoyment.' };
    }
    if (fortune === 'bad') {
      return { outcome: 'mixed', label: 'Bad star', interpretation: 'The marriage is on and off.' };
    }
    return {
      outcome: 'uncertain',
      label: fortune === 'middleGood' ? 'Middle-good star' : 'Good, level',
      interpretation: 'This method only addresses good-and-downward, good-and-upward, and bad results (when found in the chart).',
    };
  },
};

export const enjoyingMarriageQuestion: QuestionDefinition = {
  id: 'if-he-she-is-enjoying-the-marriage',
  title: 'Is he/she enjoying the marriage?',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
