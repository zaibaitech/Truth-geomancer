// Source: Kanzul Mikban, Chapter 2 — "If You Want to Know If You Will Get
// Money Today or Not" (content/manuscripts/kanzul-mikban.ts, id
// "if-you-want-to-know-if-you-will"). Quotes below are verbatim from that
// chapter's transcription.

import { ADD_FIGURE_TO_HOUSE, ADD_MULTIPLE_HOUSES, CHECK_FIGURE_PRESENT_IN_CHART, CHECK_LINE_STATE, EXTRACT_ELEMENT } from '../operations';
import type { ComputedFigure, MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-want-to-know-if-you-will';

function fireOrWaterOpened(figure: ComputedFigure): boolean {
  return CHECK_LINE_STATE(figure, 'fire') === 'opened' || CHECK_LINE_STATE(figure, 'water') === 'opened';
}

const method1: MethodDefinition = {
  id: 'money-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Pick h3, h7, h11 and h15 and add them. If the water or fire element is opened (single dot), you will get money that day; if it's not, you will not get money.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [3, 7, 11, 15]);
    return { housesUsed: [3, 7, 11, 15], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const opened = fireOrWaterOpened(calc.resultFigure);
    return opened
      ? { outcome: 'favourable', label: 'Fire or water line opened', interpretation: 'You will get money today.' }
      : { outcome: 'unfavourable', label: 'Fire and water lines both closed', interpretation: 'You will not get money today.' };
  },
};

const method2: MethodDefinition = {
  id: 'money-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Pick h2 and h11 and add them. Add the result to h7 and check if it's in the chart — you will get money, but if it's not in the chart, you will not get anything.",
  },
  calculate: (chart) => {
    const step1 = ADD_MULTIPLE_HOUSES(chart, [2, 11]);
    const step2 = ADD_FIGURE_TO_HOUSE(chart, step1.figure, 7);
    return { housesUsed: [2, 11, 7], steps: [step1.trace.description, step2.trace.description], resultFigure: step2.figure };
  },
  evaluate: (calc, chart) => {
    const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern);
    return found
      ? { outcome: 'favourable', label: 'Found in the chart', interpretation: 'You will get money.' }
      : { outcome: 'unfavourable', label: 'Not found in the chart', interpretation: 'You will not get anything.' };
  },
};

const method3: MethodDefinition = {
  id: 'money-method-3',
  label: 'Method 3',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Pick h3, h7, h11 and h15 water elements and form a star. If the water or fire element of that star is opened (single dot), then you will get money; if it's not, you will not get money that day.",
  },
  calculate: (chart) => {
    const { figure, trace } = EXTRACT_ELEMENT(chart, [3, 7, 11, 15], 'water');
    return { housesUsed: [3, 7, 11, 15], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const opened = fireOrWaterOpened(calc.resultFigure);
    return opened
      ? { outcome: 'favourable', label: 'Fire or water line opened', interpretation: 'You will get money.' }
      : { outcome: 'unfavourable', label: 'Fire and water lines both closed', interpretation: 'You will not get money today.' };
  },
};

const method4: MethodDefinition = {
  id: 'money-method-4',
  label: 'Method 4',
  status: 'uncertain',
  reviewReasonCode: 'constant_figure_undefined',
  reviewNote:
    "The chapter references checking one's \"Sirri Sa'ael (Damir)\" against a list of named figures, but that figure list was transcribed as \"[figures omitted — symbols not preserved]\" — the source PDF's hand-drawn symbols could not be read. There is also no defined computation elsewhere in this project for what \"Sirri Sa'ael\" itself is derived from. Not implemented rather than guessed.",
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Also, check your Sirri Sa'ael (Damir); if it's any of the stars below, you will get whatever you are asking for or about: [figures omitted — symbols not preserved in this transcription]",
  },
  calculate: () => {
    throw new Error("Sirri Sa'ael (Damir) has no defined computation in this codebase — the source figures needed to check it were not transcribed.");
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Not computable', interpretation: 'This method cannot currently be verified against the source.' }),
};

export const moneyQuestion: QuestionDefinition = {
  id: 'if-you-want-to-know-if-you-will',
  title: 'Will I get money today?',
  categoryId: 'money-possessions',
  chapterId: CHAPTER_ID,
  methods: [method1, method2, method3, method4],
};
