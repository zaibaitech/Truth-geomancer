// Source: Kanzul Mikban, Chapter 122 — "If You Will Get What You Want, or If
// Your Intentions Will Be Gotten (Very Close)" (id
// "if-you-will-get-what-you-want-or"). The chapter's own title carries a
// bracketed transcription note (already present in kanzul-mikban.ts's own
// data — not added here) flagging that the book's Table of Contents lists
// this slot as "if someone has long life or not (sick person)," but the
// body text found here is genuinely about intentions/getting what you want.
// That long-life topic is already covered elsewhere (chapters 93, 96, and
// the "repeated again" fragment after chapter 104) — not duplicated again
// here.
//
// Two independent methods, each phrased as "downward OR stable" — the same
// per-figure disjunction idiom already seen at chapters 86/129/130/132.
// Both give ONLY a positive branch (no stated negative), so each direction
// sub-method is "positive-trigger-only, else uncertain" rather than the
// full-binary shape chapters 86/129/130/132 use (those state both branches
// explicitly). Split into a direction reading (verified) and a stability
// reading (blocked — the `stability` axis has been needs_review project-wide
// since Prompt 1), per the chapter 85/86 precedent for alternate scholarly
// axes. resultKind 'outcome': getting what you want is a personal benefit.

import { ADD_MULTIPLE_HOUSES, CHECK_DIRECTION, CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-will-get-what-you-want-or';

const method1a: MethodDefinition = {
  id: 'get-what-you-want-very-close-method-1-direction',
  label: 'Method 1 (direction)',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Method 1: After casting the chart, check h7 and h12. If both are downward stars or stable stars, it means he/she will get what he/she wants, and it's very close.",
  },
  calculate: (chart) => {
    const h7 = CHECK_HOUSE(chart, 7);
    const h12 = CHECK_HOUSE(chart, 12);
    return { housesUsed: [7, 12], steps: [h7.trace.description, h12.trace.description], resultFigure: h7.figure };
  },
  evaluate: (_calc, chart) => {
    const h7 = CHECK_HOUSE(chart, 7).figure;
    const h12 = CHECK_HOUSE(chart, 12).figure;
    if (CHECK_DIRECTION(h7) === 'downward' && CHECK_DIRECTION(h12) === 'downward') {
      return { outcome: 'favourable', label: 'H7 and H12 both downward', interpretation: "You will get what you want, and it's very close." };
    }
    return { outcome: 'uncertain', label: 'Not both downward', interpretation: 'The source only defines the case where both H7 and H12 are downward stars — this is not addressed by direction alone (they could still both be stable).' };
  },
};

const method1b: MethodDefinition = {
  id: 'get-what-you-want-very-close-method-1-stability',
  label: 'Method 1 (stability)',
  status: 'needs_review',
  reviewReasonCode: 'stability_classification_unsourced',
  reviewNote: 'This alternate reading requires both H7 and H12 to be stable stars — the `stability` axis has no sourced classification project-wide.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Method 1: After casting the chart, check h7 and h12. If both are downward stars or stable stars, it means he/she will get what he/she wants, and it's very close.",
  },
  calculate: (chart) => {
    const h7 = CHECK_HOUSE(chart, 7);
    const h12 = CHECK_HOUSE(chart, 12);
    return { housesUsed: [7, 12], steps: [h7.trace.description, h12.trace.description], resultFigure: h7.figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Stability not classified', interpretation: 'This project has no sourced stability classification for any figure.' }),
};

const method2a: MethodDefinition = {
  id: 'get-what-you-want-very-close-method-2-direction',
  label: 'Method 2 (direction)',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'Method 2: If h11 is a downward star or a stable star, it means it will be gotten very fast.',
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 11);
    return { housesUsed: [11], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    if (CHECK_DIRECTION(calc.resultFigure) === 'downward') {
      return { outcome: 'favourable', label: 'H11 downward', interpretation: 'It will be gotten very fast.' };
    }
    return { outcome: 'uncertain', label: 'H11 not downward', interpretation: 'The source only defines the case where H11 is downward — this is not addressed by direction alone (it could still be stable).' };
  },
};

const method2b: MethodDefinition = {
  id: 'get-what-you-want-very-close-method-2-stability',
  label: 'Method 2 (stability)',
  status: 'needs_review',
  reviewReasonCode: 'stability_classification_unsourced',
  reviewNote: 'This alternate reading requires H11 to be a stable star — the `stability` axis has no sourced classification project-wide.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'Method 2: If h11 is a downward star or a stable star, it means it will be gotten very fast.',
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 11);
    return { housesUsed: [11], steps: [trace.description], resultFigure: figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Stability not classified', interpretation: 'This project has no sourced stability classification for any figure.' }),
};

export const getWhatYouWantVeryCloseQuestion: QuestionDefinition = {
  id: 'if-you-will-get-what-you-want-or',
  title: 'Will I get what I want, and how soon?',
  categoryId: 'fate-timing',
  chapterId: CHAPTER_ID,
  methods: [method1a, method1b, method2a, method2b],
};
