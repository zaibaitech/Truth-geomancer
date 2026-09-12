// Source: Kanzul Mikban, Chapter 141 — "If the Prisoner Is Male or Female"
// (id "if-the-prisoner-is-male-or-female"). One method: H1+H7 sum, "male
// star" -> male, "vice versa" -> female.
//
// PROMPT 12 GENDER-CLASSIFICATION INVESTIGATION (section 2): this is the
// chapter the Prompt 8 manuscript-wide audit flagged as a confirmed
// occurrence of the male/female-star terminology, specifically required to
// be investigated this stage. Read in full, together with its complete
// surrounding context: the chapter USES the term "male star" exactly as
// chapters 41/48/68/127 already do, but supplies no mapping, table, or rule
// from which one could be derived — "if it's a male star, he's a male" only
// tells us the correlation, never WHICH figures are male. Per the critical
// distinction the instructions draw ("use of the terminology is NOT a
// definition"), this does not resolve the classification.
//
// Stronger than a re-search this time: the book's OWN front matter
// (`KM_EDITION_NOTE`, content/manuscripts/kanzul-mikban.ts) explicitly
// states the paired qualities a figure is "described" by — including
// "male or female" — and then says outright: "this transcription has no
// verified source defining exactly which of the sixteen named figures
// carries which quality." That is the source itself confirming the gap,
// not just this project's own repeated failure to find a table. Chapter
// 141 does not contradict or supplement that front-matter admission in any
// way. `gender_classification_unsourced` is retained; chapters 41, 48, 68,
// and 127 were re-checked and are unchanged — nothing to revisit, since
// nothing new was found. This is the 7th confirmed occurrence of this gap.
//
// resultKind 'descriptive': the prisoner's sex is a factual attribute, not
// itself a favourable/unfavourable outcome — same framing as chapter 127's
// thief description.

import { ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-the-prisoner-is-male-or-female';

const method1: MethodDefinition = {
  id: 'prisoner-male-or-female-method-1',
  label: 'Method 1',
  status: 'needs_review',
  reviewReasonCode: 'gender_classification_unsourced',
  reviewNote:
    'Hinges on classifying the H1+H7 sum as a "male star" or "female star" — this chapter never defines which figures are male or female, and the book\'s own front matter (KM_EDITION_NOTE) explicitly admits no verified source exists anywhere in the transcription for this quality. Chapter 141 was specifically re-checked (per the Prompt 8 audit flag) and confirmed not to resolve it either.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "After drawing the chart, pick h1 and h7 and add them. If it's a male star, he's a male, and vice versa.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 7]);
    return { housesUsed: [1, 7], steps: [trace.description], resultFigure: figure };
  },
  evaluate: () => ({
    outcome: 'uncertain',
    label: 'Star gender not defined',
    interpretation: 'This method cannot currently be verified — see the review note.',
  }),
};

export const prisonerMaleOrFemaleQuestion: QuestionDefinition = {
  id: 'if-the-prisoner-is-male-or-female',
  title: 'Is the prisoner male or female?',
  categoryId: 'legal-conflict',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
