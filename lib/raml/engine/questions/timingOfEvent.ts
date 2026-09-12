// Source: Kanzul Mikban, Chapter 17 — "If Something Will Happen in an
// Hour, Day, Week, Month, or Year" (id "if-something-will-happen-in-an-
// hour-day"). Both methods decide their branches by named/drawn figures
// the transcription marked "[figures omitted]"; Method 2 has one trailing
// sentence that reads as independently computable ("if the star is found
// in the chart, the year will be good") but it refers back to "the method
// above" and "the star" from the omitted portion of the same method, so it
// can't be isolated with confidence as its own rule.

import { ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-something-will-happen-in-an-hour-day';

const method1: MethodDefinition = {
  id: 'timing-method-1',
  label: 'Method 1',
  status: 'uncertain',
  reviewReasonCode: 'figures_omitted_by_transcription',
  reviewNote: 'Every branch depends on named figures for H1+H6 and H4+H16 that the transcription marked "[figures omitted — symbols not preserved]".',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'Pick (h1 and h6), then (h4 and h16), and add all. If you get: [figures omitted] then it will happen within an hour, or a day, or 1–10 days.',
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 6, 4, 16]);
    return { housesUsed: [1, 6, 4, 16], steps: [trace.description], resultFigure: figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Not computable', interpretation: 'The timing figures this method depends on were not transcribed from the source.' }),
};

const method2: MethodDefinition = {
  id: 'timing-method-2',
  label: 'Method 2',
  status: 'uncertain',
  reviewReasonCode: 'figures_omitted_by_transcription',
  reviewNote:
    'Every branch depends on named figures the transcription marked "[figures omitted]"; a later sentence about the result being "found in the chart" refers back to that same omitted material, so it can\'t be isolated as an independent rule.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'Pick (h1 and h13), then (h4 and h12), then (h7 and h10), then (h15 and h16), and add all. If you get: [figures omitted] in the first four stars, it will happen very fast.',
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 13, 4, 12, 7, 10, 15, 16]);
    return { housesUsed: [1, 13, 4, 12, 7, 10, 15, 16], steps: [trace.description], resultFigure: figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Not computable', interpretation: 'The timing figures this method depends on were not transcribed from the source.' }),
};

export const timingOfEventQuestion: QuestionDefinition = {
  id: 'if-something-will-happen-in-an-hour-day',
  title: 'When will this happen?',
  categoryId: 'fate-timing',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
