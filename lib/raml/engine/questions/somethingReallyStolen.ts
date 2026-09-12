// Source: Kanzul Mikban, Chapter 124 — "If Something Has Really Been Stolen
// or Not" (id "if-something-has-really-been-stolen-or-not"). Two methods.
// Method 1 names a trigger-figure list that was never transcribed ("[figures
// omitted — symbols not preserved in this transcription]") — left uncertain,
// same shape as chapter 102's own omitted-list method (moneyWorkLadyStable.ts).
// Method 2 is a plain h1+h5 sum checked for presence anywhere in the full
// 16-house chart (no self-exclusion stated, unlike chapters 101/105/128/136 —
// this method's own wording never singles out h1 or h5 as houses to exclude
// from the search). resultKind 'descriptive': the source's own language is
// truth-value framed ("it is true" / "it's a lie"), not good/bad framed —
// this is a factual confirmation, like chapter 137's near-identical
// truthfulness check, not a personal-benefit outcome.

import { ADD_MULTIPLE_HOUSES, CHECK_FIGURE_PRESENT_IN_CHART, CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-something-has-really-been-stolen-or-not';

const method1: MethodDefinition = {
  id: 'something-really-stolen-method-1',
  label: 'Method 1',
  status: 'uncertain',
  reviewNote:
    'The chapter names a trigger-figure list to check against the whole chart, but the list itself ("[figures omitted — symbols not preserved in this transcription]") was never transcribed.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'Method 1: After casting the chart, check if you get( [figures omitted — symbols not preserved in this transcription] ) in the chart. If so, it is true — it has been stolen. But if none of these stars is found in the chart, it means it\'s a lie.',
  },
  calculate: (chart) => {
    const { figure } = CHECK_HOUSE(chart, 1); // representative reference figure only — no trigger list to check
    return { housesUsed: [], steps: ['Trigger-figure list omitted from the transcription.'], resultFigure: figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Trigger figures omitted', interpretation: "This chapter's trigger-figure list was not preserved in this transcription." }),
};

const method2: MethodDefinition = {
  id: 'something-really-stolen-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Method 2: After drawing the chart, pick h1 and h5 and add them. If it is found in the chart, it's true, and vice versa.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 5]);
    return { housesUsed: [1, 5], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern);
    return found
      ? { outcome: 'descriptive', label: 'Confirmed — it was stolen', interpretation: 'It is true — the item has really been stolen.', descriptiveAnswer: 'yes' }
      : { outcome: 'descriptive', label: 'Not stolen', interpretation: "It's a lie — the item has not really been stolen.", descriptiveAnswer: 'no' };
  },
};

export const somethingReallyStolenQuestion: QuestionDefinition = {
  id: 'if-something-has-really-been-stolen-or-not',
  title: 'Has this really been stolen?',
  categoryId: 'lost-stolen',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1, method2],
};
