// Source: Kanzul Mikban, Chapter 129 — "If It Is the Accused Person That
// Stole the Thing or Not" (id "if-it-is-the-accused-person-that-stole"). One
// calculation (H4), two alternate readings sharing it — the "downward or
// stable star" / "upward or unstable star" idiom, this time with BOTH
// branches explicitly stated. Because each branch's own OR is satisfied by
// EITHER its direction leg or its stability leg alone, direction alone
// already fully resolves the ordinary (non-level) case: downward always
// satisfies the positive branch regardless of stability, and upward always
// satisfies the negative branch regardless of stability (matching the
// chapter 86/business-or-handwork precedent's own full-binary direction
// reading). Only H4 = level (neither upward nor downward) needs stability
// to decide, and stability has no sourced classification — left uncertain
// there. The stability-only reading is kept as its own fully independent,
// entirely blocked alternate method, per the chapter 85/86 precedent — not
// used to patch the direction reading's level-star gap.
// resultKind 'descriptive': the source's own language is truth-value framed
// ("it is him/her" / "he/she is not the one"), a guilt confirmation, not a
// favourable/unfavourable outcome for the querent.

import { CHECK_DIRECTION, CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-it-is-the-accused-person-that-stole';
const QUOTE = "After drawing the chart, check h4. If it is a downward or stable star, then it is him/her; but if it's an upward or unstable star, he/she is not the one.";

const method1a: MethodDefinition = {
  id: 'accused-person-guilty-method-1-direction',
  label: 'Method 1 (direction)',
  status: 'verified',
  source: { book: 'kanzul-mikban', chapterId: CHAPTER_ID, quote: QUOTE },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 4);
    return { housesUsed: [4], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const direction = CHECK_DIRECTION(calc.resultFigure);
    if (direction === 'downward') {
      return { outcome: 'descriptive', label: 'H4 downward', interpretation: 'It is them — the accused person did steal it.', descriptiveAnswer: 'yes' };
    }
    if (direction === 'upward') {
      return { outcome: 'descriptive', label: 'H4 upward', interpretation: 'It is not them — the accused person did not steal it.', descriptiveAnswer: 'no' };
    }
    return { outcome: 'uncertain', label: 'H4 level', interpretation: 'H4 is neither upward nor downward — direction alone cannot resolve this (stability could still decide it, but is unsourced).' };
  },
};

const method1b: MethodDefinition = {
  id: 'accused-person-guilty-method-1-stability',
  label: 'Method 1 (stability)',
  status: 'needs_review',
  reviewReasonCode: 'stability_classification_unsourced',
  reviewNote: 'This alternate reading crosses on stability (stable -> guilty, unstable -> not guilty) rather than direction — the `stability` axis has no sourced classification project-wide.',
  source: { book: 'kanzul-mikban', chapterId: CHAPTER_ID, quote: QUOTE },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 4);
    return { housesUsed: [4], steps: [trace.description], resultFigure: figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Stability not classified', interpretation: 'This project has no sourced stability classification for any figure.' }),
};

export const accusedPersonGuiltyQuestion: QuestionDefinition = {
  id: 'if-it-is-the-accused-person-that-stole',
  title: 'Is the accused person the one who stole it?',
  categoryId: 'legal-conflict',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1a, method1b],
};
