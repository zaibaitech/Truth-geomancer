// Source: Kanzul Mikban, Chapter 43 — "The Real Behavior/Character or Life
// of Someone You Want to Get Married to (in Future)" (id
// "the-real-behavior-character-or-life-of-someone"). One method, fully
// computable via the existing good/bad fortune classification.

import { ADD_FIGURE_TO_HOUSE, ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'the-real-behavior-character-or-life-of-someone';

const method1: MethodDefinition = {
  id: 'future-spouse-character-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, pick h3, h7, h11 and h14 and add them. Add the results to h12 and check what star it is. If it's a good star, he/she will have a good behavior, and vice versa.",
  },
  calculate: (chart) => {
    const step1 = ADD_MULTIPLE_HOUSES(chart, [3, 7, 11, 14]);
    const step2 = ADD_FIGURE_TO_HOUSE(chart, step1.figure, 12);
    return { housesUsed: [3, 7, 11, 14, 12], steps: [step1.trace.description, step2.trace.description], resultFigure: step2.figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good star', interpretation: 'He/she will have a good behavior.' };
    if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad star', interpretation: 'He/she will have a bad behavior.' };
    return { outcome: 'uncertain', label: 'Middle-good star', interpretation: 'This method only addresses clearly good or bad results.' };
  },
};

export const futureSpouseCharacterQuestion: QuestionDefinition = {
  id: 'the-real-behavior-character-or-life-of-someone',
  title: 'What is the real behavior or character of the person I want to marry?',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
