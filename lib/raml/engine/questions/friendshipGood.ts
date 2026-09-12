// Source: Kanzul Mikban, Chapter 52 — "The Friendship Between Two People,
// If It's Good or Not" (id "the-friendship-between-two-people-if-it-s").
// One method, fully computable via the existing good/bad fortune
// classification. Middle-good is never addressed, so it is left uncertain
// rather than guessed.
//
// An unnumbered fragment immediately follows this chapter in the source
// ("The Consequence of Friendship Between Two People", id
// "the-consequence-of-friendship-between-two-people") with its own fully
// computable rule (h1+h3, good/bad). It is documented in COVERAGE.md but
// not registered here — Prompt 5 scopes this stage to numbered Chapters
// 41-60, and this fragment carries no chapter number of its own.

import { ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'the-friendship-between-two-people-if-it-s';

const method1: MethodDefinition = {
  id: 'friendship-good-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, pick h11 and h15 and add them. If it is a good star, their friendship is going to be strong and last forever; but if it's a bad star, the friendship will not last a long time — enemies will come between them and separate them.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [11, 15]);
    return { housesUsed: [11, 15], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good star', interpretation: 'Their friendship is going to be strong and last forever.' };
    if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad star', interpretation: 'The friendship will not last a long time — enemies will come between them and separate them.' };
    return { outcome: 'uncertain', label: 'Middle-good star', interpretation: 'This method only addresses clearly good or bad results.' };
  },
};

export const friendshipGoodQuestion: QuestionDefinition = {
  id: 'the-friendship-between-two-people-if-it-s',
  title: 'Is this friendship good?',
  categoryId: 'family-loved-ones',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
