// Source: Kanzul Mikban, Chapter 35 — "If Your Family Is Doing Well (While
// You Are Far from Them)" (id "if-your-family-is-doing-well-while-you").
// One method. The source's own wording gives a clear well-being gradient
// even without the words "good/bad" ("doing very well" down to "in
// danger... can't handle it") — a direct translation of stated meaning
// into the outcome vocabulary, not an invented judgment.
//
// Prompt 6 audit: the "which quarter of the chart" search previously
// hand-rolled its own QUARTERS array — the identical mechanic to chapters
// 31 and 55's own methods, now extracted to the shared FIND_FIGURE_QUARTER
// operation. This chapter keeps its own quarter->outcome/label/text
// mapping, only the SEARCH itself is shared.

import { ADD_MULTIPLE_HOUSES, FIND_FIGURE_QUARTER, type ChartQuarter } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';
import type { MethodOutcome } from '../types';

const CHAPTER_ID = 'if-your-family-is-doing-well-while-you';

const QUARTER_MEANING: Record<ChartQuarter, { outcome: MethodOutcome; label: string; text: string }> = {
  mothers: { outcome: 'favourable', label: 'Found among the Mothers (H1-4)', text: 'They are doing very well.' },
  daughters: { outcome: 'mixed', label: 'Found among the Daughters (H5-8)', text: 'They are doing well, but they are facing financial problems.' },
  nieces: { outcome: 'mixed', label: 'Found among the Nieces (H9-12)', text: 'They are facing financial problems and some of them are sick.' },
  witnesses: { outcome: 'unfavourable', label: 'Found among the Witnesses/Judge/Reconciler (H13-16)', text: "They are in danger, or in a situation they can't handle themselves." },
};

const method1: MethodDefinition = {
  id: 'family-doing-well-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "If you are far from your family and want to know how they are doing, pick h1, h4, h7 and h10 and add them. If the star is found in the first 4 houses (Umuhat), they are doing very well. If it's found in the second 4 houses (Banaat), they are doing well but they are facing financial problems. If it's found in the third 4 houses (Hafidat), they are facing financial problems and some of them are sick. If it's found in the last 4 houses (Sumurakat), they are in danger, or they are in a situation that they can't handle themselves.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 4, 7, 10]);
    return { housesUsed: [1, 4, 7, 10], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const { quarter } = FIND_FIGURE_QUARTER(chart, calc.resultFigure.dotPattern);
    if (!quarter) {
      return { outcome: 'uncertain', label: 'Not found in any quarter', interpretation: 'This result figure does not match any of the 16 houses — the source does not address this case.' };
    }
    const meaning = QUARTER_MEANING[quarter];
    return { outcome: meaning.outcome, label: meaning.label, interpretation: meaning.text };
  },
};

export const familyDoingWellQuestion: QuestionDefinition = {
  id: 'if-your-family-is-doing-well-while-you',
  title: 'Is my family doing well while I am away?',
  categoryId: 'family-loved-ones',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
