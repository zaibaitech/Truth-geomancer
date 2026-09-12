// Source: Kanzul Mikban, Chapter 74 — "If Someone Is an Adulterous
// Son/Daughter (Born Out of Wedlock)" (id
// "if-someone-is-an-adulterous-son-daughter-born"). One method, fully
// computable — the source's own worked example ("pick sand-sand elements
// and form a star — that is, pick the elements of h4, h8, h12 and h16")
// is what confirms the "fire-fire/air-air/water-water/sand-sand" mechanic
// chapters 62 and 67 also use. Modeled as `outcome` rather than
// `descriptive`: unlike a neutral fact (e.g. "male or female child"), the
// question's own wording ("adulterous") is already a loaded, negative
// term for the found-in-chart branch, not a neutral category label.

import { CHECK_FIGURE_PRESENT_IN_CHART, EXTRACT_ELEMENT } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-someone-is-an-adulterous-son-daughter-born';

const method1: MethodDefinition = {
  id: 'born-out-of-wedlock-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "If you want to know if someone was born out of wedlock or not, draw the chart and pick sand-sand elements and form a star — that is, pick the elements of h4, h8, h12 and h16 and form one star. Check the star in the chart. If it's found, it means he/she was born out of wedlock; but if it's not in the chart, he/she is not.",
  },
  calculate: (chart) => {
    const { figure, trace } = EXTRACT_ELEMENT(chart, [4, 8, 12, 16], 'sand');
    return { housesUsed: [4, 8, 12, 16], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern);
    return found
      ? { outcome: 'unfavourable', label: 'Found in the chart', interpretation: 'He/she was born out of wedlock.' }
      : { outcome: 'favourable', label: 'Not found in the chart', interpretation: 'He/she was not born out of wedlock.' };
  },
};

export const bornOutOfWedlockQuestion: QuestionDefinition = {
  id: 'if-someone-is-an-adulterous-son-daughter-born',
  title: 'Was this person born out of wedlock?',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
