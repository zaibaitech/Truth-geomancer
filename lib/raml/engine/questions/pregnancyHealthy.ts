// Source: Kanzul Mikban, Chapter 77 — "If the Pregnancy Is Healthy or Not"
// (id "if-the-pregnancy-is-healthy-or-not"). Two methods. Method 1 checks
// 4 separate houses individually (composed directly, same shape as
// chapter 76) — positive trigger only, no stated branch for "not all
// good". Method 2 is a single-house good/bad check; middle-good is never
// addressed.

import { CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-the-pregnancy-is-healthy-or-not';

const method1: MethodDefinition = {
  id: 'pregnancy-healthy-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'After drawing the chart, check the present houses (h4, 7, 10) and h15. If they are all good stars, then it will be healthy and stable till birth.',
  },
  calculate: (chart) => {
    const houses = [4, 7, 10, 15].map((n) => CHECK_HOUSE(chart, n));
    return {
      housesUsed: [4, 7, 10, 15],
      steps: houses.map((h) => h.trace.description),
      resultFigure: houses[0].figure,
    };
  },
  evaluate: (_calc, chart) => {
    const allGood = [4, 7, 10, 15].every((n) => CHECK_HOUSE(chart, n).figure.qualities.fortune.value === 'good');
    return allGood
      ? { outcome: 'favourable', label: 'All good stars', interpretation: 'It will be healthy and stable till birth.' }
      : { outcome: 'uncertain', label: 'Not all good stars', interpretation: 'The source only defines the "all good" trigger — this is not addressed.' };
  },
};

const method2: MethodDefinition = {
  id: 'pregnancy-healthy-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "After drawing the chart, check h8. If it's a good star, it's in good condition and kicking; but if it's a bad star, it's not safe.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 8);
    return { housesUsed: [8], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good star', interpretation: "It's in good condition and kicking." };
    if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad star', interpretation: "It's not safe." };
    return { outcome: 'uncertain', label: 'Middle-good star', interpretation: 'This method only addresses clearly good or bad results.' };
  },
};

export const pregnancyHealthyQuestion: QuestionDefinition = {
  id: 'if-the-pregnancy-is-healthy-or-not',
  title: 'Is the pregnancy healthy?',
  categoryId: 'family-loved-ones',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
