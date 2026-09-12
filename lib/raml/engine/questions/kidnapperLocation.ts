// Source: Kanzul Mikban, Chapter 142 — "Where Kidnappers Are Keeping a
// Person Hostage" (id "where-kidnappers-are-keeping-a-person-hostage").
// Uncertain for two compounding reasons, not just one: (a) the calculation
// itself — "check which star is found in its own house" — presumes a fixed
// figure-to-house identity mapping (which of the 16 houses is each figure's
// "own" house) that is never given anywhere in either manuscript or in
// content/classicalAttributes.ts; (b) even granting that mapping existed,
// every one of the ~11 branches has its trigger figure omitted from the
// transcription ("If it's:, he/she is..." repeated with nothing named,
// identical in shape to chapters 94/97's "figures omitted" pattern). With
// the calculation's own first step already unrecoverable, there is nothing
// to compute — left `uncertain` as a single method, matching the chapter
// 94/97 precedent for "figures omitted throughout" but going one step
// further since even the underlying mechanism isn't verifiable here.
// resultKind 'descriptive': locating a person is a factual answer, not a
// favourable/unfavourable outcome.

import { CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'where-kidnappers-are-keeping-a-person-hostage';

const method1: MethodDefinition = {
  id: 'kidnapper-location-method-1',
  label: 'Method 1',
  status: 'uncertain',
  reviewNote:
    'This method depends on a figure-to-house "own house" identity mapping that is never defined anywhere in either manuscript, and every one of its branches also has its trigger figure omitted from the transcription ("If it\'s:, he/she is..." repeated with nothing named) — there is no verifiable calculation to compute here at all.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, check which star is found in its own house. If it's:, he/she is kidnapped in his/her own house. If it's:, he/she is in one of the closest houses, or a neighbor's. If it's, he/she is in one of his/her family members' house. If it's, he/she is in his/her father's or mother's house. If it's, he/she is in one of his/her children's house. If it's, he/she is in a sick person's house, close to him or her. If it's, he/she is in his or her girlfriend's/boyfriend's, or wife's/husband's house. If it's, he/she is in a funeral house. If it's, he/she is on a journey — they are taking him/her somewhere out of towns. If it's, he/she is in a chief's, king's, or a well-known and respected person's house. If it's, he/she is in his/her ex's house. If it's, he/she is in his/her enemy's house — and so on, up to the end of the stars.",
  },
  calculate: (chart) => {
    const { figure } = CHECK_HOUSE(chart, 1); // representative reference figure only — no verifiable calculation to show
    return { housesUsed: [], steps: ['Both the "own house" identity mapping and every branch trigger figure are unrecoverable from this transcription.'], resultFigure: figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Calculation and trigger figures unrecoverable', interpretation: 'Neither the "own house" mapping this method depends on nor any of its branch trigger figures survive in this transcription.' }),
};

export const kidnapperLocationQuestion: QuestionDefinition = {
  id: 'where-kidnappers-are-keeping-a-person-hostage',
  title: 'Where are the kidnappers keeping the person?',
  categoryId: 'legal-conflict',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
