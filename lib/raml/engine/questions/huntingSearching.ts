// Source: Kanzul Mikban, Chapter 4 — "Hunting in Water and on Land, and
// Searching for Anything" (id "hunting-in-water-and-on-land-and-searching").
// One method: check h10 for any of the listed successful-search figures. The
// figure list was restored from the author-confirmed final edition (see
// ../kanzulFinalEditionFigures.ts). The source states only the positive
// trigger, so any other figure stays uncertain rather than being read as a
// failure.

import { CHECK_HOUSE, MATCH_FIGURE } from '../operations';
import { CH4_H10_SUCCESS, idsOf } from '../kanzulFinalEditionFigures';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'hunting-in-water-and-on-land-and-searching';

const method1: MethodDefinition = {
  id: 'hunting-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, check h10. If you find the following stars, it means you will be successful in your search: Usman, Mahadi, Iddris, Nuhu, Sulemana, Ayuba, Yunus. If it's any of the above stars, you will get whatever you are asking for or searching for — for example: job, money, title, promotion, marriage, etc.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 10);
    return { housesUsed: [10], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) =>
    idsOf(CH4_H10_SUCCESS).some((id) => MATCH_FIGURE(calc.resultFigure, id))
      ? { outcome: 'favourable', label: `${calc.resultFigure.figureName} at H10`, interpretation: 'You will be successful in your search — you will get whatever you are asking for or searching for.' }
      : { outcome: 'uncertain', label: `${calc.resultFigure.figureName} at H10`, interpretation: 'The source only lists the successful figures for H10 — this figure is not addressed.' },
};

export const huntingSearchingQuestion: QuestionDefinition = {
  id: 'hunting-in-water-and-on-land-and-searching',
  title: 'Will my search or hunt succeed?',
  categoryId: 'lost-stolen',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
