// Source: Kanzul Mikban, Chapter 17 — "If Something Will Happen in an
// Hour, Day, Week, Month, or Year" (id "if-something-will-happen-in-an-
// hour-day"). Two methods, both restored from the author-confirmed final
// edition's figure lists (see ../kanzulFinalEditionFigures.ts).
//
// Method 1: the sum of (h1+h6) and (h4+h16); a listed figure means "within an
// hour, or a day, or 1-10 days", and the same figure found in the first four
// houses means "within an hour".
//
// Method 2: the sum of (h1+h13), (h4+h12), (h7+h10), (h15+h16). The "fast" list
// found in the first four houses = very fast; the same list found elsewhere in
// the chart = within 7 days; the "slow" list = within a month or a year. The
// source's closing sentence ("If you use the method above and the star is
// found in the chart, the year will be good; if not, the year will be hard")
// does not say which star it refers to, so it is NOT implemented. A figure
// outside both lists, or a "fast" figure absent from the chart, is not
// addressed by the source and stays uncertain.
// resultKind 'descriptive': the answer is a time span, not a judgment.

import { ADD_MULTIPLE_HOUSES, CHECK_FIGURE_PRESENT_IN_CHART, MATCH_FIGURE } from '../operations';
import { CH17_M1_LIST, CH17_M2_FAST, CH17_M2_SLOW, idsOf } from '../kanzulFinalEditionFigures';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-something-will-happen-in-an-hour-day';

const FIRST_FOUR = [1, 2, 3, 4];

const method1: MethodDefinition = {
  id: 'timing-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'Pick (h1 and h6), then (h4 and h16), and add all. If you get: Ali, Nuhu, Umar, Issah, Mahadi, Adam, Yussif, then it will happen within an hour, or a day, or 1–10 days. If any of the above is found in the first four houses, then it will happen within an hour.',
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 6, 4, 16]);
    return { housesUsed: [1, 6, 4, 16], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    if (!idsOf(CH17_M1_LIST).some((id) => MATCH_FIGURE(calc.resultFigure, id))) {
      return { outcome: 'uncertain', label: `${calc.resultFigure.figureName} (not a listed figure)`, interpretation: 'The source lists seven figures for this method — this result is not among them.' };
    }
    const early = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern, FIRST_FOUR).found;
    return early
      ? { outcome: 'descriptive', label: `${calc.resultFigure.figureName}, found in the first four houses`, interpretation: 'It will happen within an hour.', descriptiveAnswer: 'within-an-hour' }
      : { outcome: 'descriptive', label: calc.resultFigure.figureName, interpretation: 'It will happen within an hour, or a day, or 1–10 days.', descriptiveAnswer: 'within-an-hour-a-day-or-ten-days' };
  },
};

const method2: MethodDefinition = {
  id: 'timing-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Pick (h1 and h13), then (h4 and h12), then (h7 and h10), then (h15 and h16), and add all. If you get: Ayuba, Umar, Issah, Ibrahim, Iddris, Mahadi, Adam, Yussif in the first four stars, it will happen very fast — less than an hour, or an hour's time. But if it's found in the chart, it will happen within 7 days. And if it's: Kalla Allahu, Sulemana, Ali, Nuhu, Hassan & Hussein, Yunus, Usman, Musah, then it will happen within a month or a year.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 13, 4, 12, 7, 10, 15, 16]);
    return { housesUsed: [1, 13, 4, 12, 7, 10, 15, 16], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const name = calc.resultFigure.figureName;
    if (idsOf(CH17_M2_SLOW).some((id) => MATCH_FIGURE(calc.resultFigure, id))) {
      return { outcome: 'descriptive', label: name, interpretation: 'It will happen within a month or a year.', descriptiveAnswer: 'within-a-month-or-a-year' };
    }
    if (idsOf(CH17_M2_FAST).some((id) => MATCH_FIGURE(calc.resultFigure, id))) {
      if (CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern, FIRST_FOUR).found) {
        return { outcome: 'descriptive', label: `${name}, found in the first four houses`, interpretation: "It will happen very fast — less than an hour, or an hour's time.", descriptiveAnswer: 'within-an-hour' };
      }
      if (CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern).found) {
        return { outcome: 'descriptive', label: `${name}, found in the chart`, interpretation: 'It will happen within 7 days.', descriptiveAnswer: 'within-seven-days' };
      }
      return { outcome: 'uncertain', label: `${name} (not found in the chart)`, interpretation: 'The source gives a timing for this figure only when it is found in the chart.' };
    }
    return { outcome: 'uncertain', label: name, interpretation: 'This result is not among the sixteen figures the source places in either timing list.' };
  },
};

export const timingOfEventQuestion: QuestionDefinition = {
  id: 'if-something-will-happen-in-an-hour-day',
  title: 'When will this happen?',
  categoryId: 'fate-timing',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1, method2],
};
