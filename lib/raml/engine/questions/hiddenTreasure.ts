// Source: Kanzul Mikban, Chapter 132 — "If There's a Hidden Treasure (Gold/
// Money) in a Particular Place" (id "if-there-s-a-hidden-treasure-gold-money").
// Three methods.
//
// Methods 1 and 2 both name a trigger-figure list that was never
// transcribed ("[figures omitted — symbols not preserved in this
// transcription]") — same shape as chapters 102/124 Method 1. Method 2's
// own calculation basis ("if you get [omitted] ... in your chart") is even
// less specified than Method 1's (no stated houses), compounding the
// omission — left uncertain either way.
//
// Method 3: H1's "downward or stable star" idiom, both branches stated —
// the same full-binary direction reading as chapters 129/130 (downward and
// upward each independently satisfy their own branch regardless of
// stability; only a level H1 needs the unsourced stability axis), split
// into a direction sub-method (verified) and a stability sub-method
// (blocked), per the chapter 85/86 precedent.
// resultKind 'descriptive': an existence claim ("there is [treasure]" /
// "there is nothing there"), not a favourable/unfavourable outcome.

import { ADD_MULTIPLE_HOUSES, CHECK_DIRECTION, CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-there-s-a-hidden-treasure-gold-money';

const method1: MethodDefinition = {
  id: 'hidden-treasure-method-1',
  label: 'Method 1',
  status: 'uncertain',
  reviewNote:
    'The chapter names a trigger-figure list to check the H4+H6 sum against, but the list itself ("[figures omitted — symbols not preserved in this transcription]") was never transcribed.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Method 1: After casting the chart, pick h4 and h6 and add them. If it's one of the following stars, there is [treasure]; but if it's not, there is nothing there. The stars are as follows: [figures omitted — symbols not preserved in this transcription]",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [4, 6]);
    return { housesUsed: [4, 6], steps: [trace.description, 'Trigger-figure list omitted from the transcription.'], resultFigure: figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Trigger figures omitted', interpretation: "This chapter's trigger-figure list was not preserved in this transcription." }),
};

const method2: MethodDefinition = {
  id: 'hidden-treasure-method-2',
  label: 'Method 2',
  status: 'uncertain',
  reviewNote:
    'Names a second trigger-figure list ("[figures omitted...]") to check for anywhere "in your chart" — even the calculation\'s own basis (which houses, if any, feed it) is unclear beyond that, compounding the omission.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Method 2: Also, if you get [figures omitted — symbols not preserved in this transcription] or in your chart, then there's something; but if it's not any of the above stars, then there's nothing there.",
  },
  calculate: (chart) => {
    const { figure } = CHECK_HOUSE(chart, 1); // representative reference figure only — no trigger list to check
    return { housesUsed: [], steps: ['Trigger-figure list omitted from the transcription.'], resultFigure: figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Trigger figures omitted', interpretation: "This chapter's trigger-figure list was not preserved in this transcription." }),
};

const QUOTE_M3 = "Method 3: Also, if your h1 is a downward star or a stable star, it means there's something; but if it is not, there's nothing.";

const method3a: MethodDefinition = {
  id: 'hidden-treasure-method-3-direction',
  label: 'Method 3 (direction)',
  status: 'verified',
  source: { book: 'kanzul-mikban', chapterId: CHAPTER_ID, quote: QUOTE_M3 },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 1);
    return { housesUsed: [1], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const direction = CHECK_DIRECTION(calc.resultFigure);
    if (direction === 'downward') {
      return { outcome: 'descriptive', label: 'H1 downward', interpretation: "There's something there.", descriptiveAnswer: 'treasure' };
    }
    if (direction === 'upward') {
      return { outcome: 'descriptive', label: 'H1 upward', interpretation: "There's nothing there.", descriptiveAnswer: 'nothing' };
    }
    return { outcome: 'uncertain', label: 'H1 level', interpretation: 'H1 is neither upward nor downward — direction alone cannot resolve this (stability could still decide it, but is unsourced).' };
  },
};

const method3b: MethodDefinition = {
  id: 'hidden-treasure-method-3-stability',
  label: 'Method 3 (stability)',
  status: 'needs_review',
  reviewReasonCode: 'stability_classification_unsourced',
  reviewNote: 'This alternate reading crosses on stability (stable -> something, unstable -> nothing) rather than direction — the `stability` axis has no sourced classification project-wide.',
  source: { book: 'kanzul-mikban', chapterId: CHAPTER_ID, quote: QUOTE_M3 },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 1);
    return { housesUsed: [1], steps: [trace.description], resultFigure: figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Stability not classified', interpretation: 'This project has no sourced stability classification for any figure.' }),
};

export const hiddenTreasureQuestion: QuestionDefinition = {
  id: 'if-there-s-a-hidden-treasure-gold-money',
  title: 'Is there hidden treasure in this place?',
  categoryId: 'lost-stolen',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1, method2, method3a, method3b],
};
