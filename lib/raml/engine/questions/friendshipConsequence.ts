// Source: Kanzul Mikban, the unnumbered "The Consequence of Friendship Between
// Two People" fragment that follows chapter 52 (id
// "the-consequence-of-friendship-between-two-people").
//
// PROMPT 13 COVERAGE FINDING: like the "stay in the marriage" fragment after
// chapter 7, this one is fully computable and already has its own selectable
// entry in content/intentions.ts, but was never registered — Prompt 5's own
// notes record it as "fully computable, no chapter number, out of this
// stage's numbered scope." That per-stage scope no longer exists now that
// the book is complete, so the final coverage audit closes the gap. Nothing
// here is new source material.
//
// Distinct from chapter 52 ("the friendship between two people — if it's
// good") and from chapter 85 ("how the future of two people's friendship
// will be"): this fragment asks what will COME of the friendship, via its
// own h1+h3 calculation. Only good and bad are addressed; middle-good is
// not. resultKind 'outcome': the source frames the two branches as
// benefit vs. harm ("success... love and happiness" vs. "something
// terrible, or a calamity").

import { ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'the-consequence-of-friendship-between-two-people';

const method1: MethodDefinition = {
  id: 'friendship-consequence-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'After drawing the chart, pick h1 and h3 and add them. If it is a good star, success will come between them, along with love and happiness; but if it is a bad star, something terrible, or a calamity, will come between them.',
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 3]);
    return { housesUsed: [1, 3], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') {
      return { outcome: 'favourable', label: 'Good', interpretation: 'Success will come between them, along with love and happiness.' };
    }
    if (fortune === 'bad') {
      return { outcome: 'unfavourable', label: 'Bad', interpretation: 'Something terrible, or a calamity, will come between them.' };
    }
    return { outcome: 'uncertain', label: 'Middle-good', interpretation: 'This method only addresses good or bad — middle-good is not addressed.' };
  },
};

export const friendshipConsequenceQuestion: QuestionDefinition = {
  id: 'the-consequence-of-friendship-between-two-people',
  title: 'What will come of this friendship?',
  categoryId: 'family-loved-ones',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
