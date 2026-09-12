// Source: Kanzul Mikban, Chapter 127 — "The Description of the Thief" (id
// "the-description-of-the-thief"). Two methods (H1 primary, H7 alternate),
// both hinging on classifying a figure as a "male star" or "female star".
//
// PROMPT 11 GENDER-CLASSIFICATION INVESTIGATION (section 2): this is one of
// the two chapters (127, 141) flagged by the Prompt 8/9 source audit as a
// later occurrence of the male/female-star terminology, specifically
// required to be checked for an authoritative definition. Read in full: the
// chapter USES the terms "male star" / "female star" exactly as chapters 41,
// 48, and 68 already do, but supplies no mapping, table, or rule from which
// one could be derived — it says a male/female star "indicates" a male/
// female thief, never which figures those are. Per the critical distinction
// in section 2 ("a mere use of the terms is NOT a definition"), this does
// NOT resolve the classification. Confirmed by re-searching this chapter's
// own surrounding text and the manuscript's front matter — no table exists
// here either. `gender_classification_unsourced` is retained; chapters 41,
// 48, and 68 are NOT revisited, since nothing changed. (Chapter 141, the
// other flagged occurrence, is out of this stage's scope — Chapters 121-140
// only.)
//
// The source also carries its own transcription caveat here ("This passage
// was faint and heavily corrected in the original notebook... please check
// the original scan") — reproduced in the quote below, not smoothed over.
// resultKind 'descriptive': identifying a thief's sex is a factual
// attribute, not itself a favourable/unfavourable outcome.

import { CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'the-description-of-the-thief';
const QUOTE =
  "After drawing the chart, use h1 as the thief's description — a male star or a female star found there indicates a male or female thief. Some also use the star found in h7 for the description. [This passage was faint and heavily corrected in the original notebook — the general method is as above, but some detail may not be captured exactly; please check the original scan.]";

const method1: MethodDefinition = {
  id: 'thief-description-method-1',
  label: 'Method 1 (H1)',
  status: 'needs_review',
  reviewReasonCode: 'gender_classification_unsourced',
  reviewNote:
    'Hinges on classifying H1 as a "male star" or "female star". Chapter 127 uses this terminology without ever defining which figures are male or female — the male/female-star classification remains unsourced project-wide (chapters 41, 48, 68). Prompt 11 re-checked this chapter specifically (per the Prompt 8/9 audit flag) and confirmed no mapping is supplied here either.',
  source: { book: 'kanzul-mikban', chapterId: CHAPTER_ID, quote: QUOTE },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 1);
    return { housesUsed: [1], steps: [trace.description], resultFigure: figure };
  },
  evaluate: () => ({
    outcome: 'uncertain',
    label: 'Star gender not defined',
    interpretation: 'This method cannot currently be verified — see the review note.',
  }),
};

const method2: MethodDefinition = {
  id: 'thief-description-method-2',
  label: 'Method 2 (H7 alternate)',
  status: 'needs_review',
  reviewReasonCode: 'gender_classification_unsourced',
  reviewNote: 'Same unsourced male/female-star gap as Method 1, applied to H7 as an alternate description house.',
  source: { book: 'kanzul-mikban', chapterId: CHAPTER_ID, quote: QUOTE },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 7);
    return { housesUsed: [7], steps: [trace.description], resultFigure: figure };
  },
  evaluate: () => ({
    outcome: 'uncertain',
    label: 'Star gender not defined',
    interpretation: 'This method cannot currently be verified — see the review note.',
  }),
};

export const thiefDescriptionQuestion: QuestionDefinition = {
  id: 'the-description-of-the-thief',
  title: 'What does the thief look like?',
  categoryId: 'legal-conflict',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1, method2],
};
