// Source: Kanzul Mikban, Chapter 68 — "If Your Partner Is Cheating on You"
// (id "if-your-partner-is-cheating-on-you"). One method, blocked by the
// same unresolved male/female-star classification confirmed absent from
// both source manuscripts (Prompt 6 audit) — see thePersonThatTookAnItem.ts
// for the full reasoning. A second, independent gap also blocks this
// method even if star gender were ever resolved: the rule's very first
// branch depends on the QUERENT'S OWN gender ("if it's a man that comes to
// check... if it's a lady that comes to find out...") — an input this
// app's casting flow has no field for at all (it casts a chart from 4
// Mother patterns; it never asks who is asking). Left needs_review rather
// than guessed at either axis.

import { CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-your-partner-is-cheating-on-you';

const method1: MethodDefinition = {
  id: 'partner-cheating-method-1',
  label: 'Method 1',
  status: 'needs_review',
  reviewReasonCode: 'gender_classification_unsourced',
  reviewNote:
    'Two independent, compounding gaps: (1) the verdict hinges on classifying H7 as a "male star" or "female star" — this chapter never defines which figures are male/female, and this project\'s general figure-gender axis is intentionally left unsourced project-wide (confirmed by an exhaustive re-search of both source manuscripts, Prompt 6). (2) Even if that were resolved, the rule\'s first branch depends on the QUERENT\'s own gender ("if it\'s a man that comes to check... if it\'s a lady..."), which this app\'s casting flow has no input for at all. Withheld rather than guessed at either axis.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, check h7. If it's a man that comes to check and you found a male star in h7, it means his wife or girlfriend is cheating. And if it's a lady that comes to find out, and a female star is found in h7, it means her man is cheating.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 7);
    return { housesUsed: [7], steps: [trace.description], resultFigure: figure };
  },
  evaluate: () => ({
    outcome: 'uncertain',
    label: 'Star gender and querent gender not available',
    interpretation: 'This method cannot currently be verified — see the review note.',
  }),
};

export const partnerCheatingQuestion: QuestionDefinition = {
  id: 'if-your-partner-is-cheating-on-you',
  title: 'Is my partner cheating on me?',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
