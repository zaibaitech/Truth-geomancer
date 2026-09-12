// Source: Kanzul Mikban, Chapter 89 — "If Your Success or Wealth Will
// Remain Forever or Not" (id "if-your-success-or-wealth-will-remain-
// forever"). One method: the SAME 7-house opened-line count as chapter
// 88's own, near-identical passage, but reduced by the REPEATED "12, 12"
// technique (CAST_OUT_BY) rather than chapter 88's single subtraction — a
// deliberate, preserved textual difference, not the same rule twice.

import { CAST_OUT_BY, CHECK_HOUSE, COUNT_OPENED_LINES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-your-success-or-wealth-will-remain-forever';
const HOUSES = [1, 2, 4, 5, 10, 11, 15];

const method1: MethodDefinition = {
  id: 'wealth-permanence-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, count all the single dots of h1, h2, h4, h5, h10, h11, and h15, and start subtracting 12, 12. Check whatever number you get, in the chart, where you can see it — for example, if it's 5, it means Ibrahim; if you get 2, it means Adam, etc. Then check if it's a good star — it means it will remain forever. If it's a bad star, it will soon be cut off and you will be suffering again. If it's a middle-good star, it will only reduce, but you won't be poor.",
  },
  calculate: (chart) => {
    const { count, trace } = COUNT_OPENED_LINES(chart, HOUSES);
    const resultNumber = CAST_OUT_BY(count, 12);
    const { figure, trace: houseTrace } = CHECK_HOUSE(chart, resultNumber);
    return {
      housesUsed: [resultNumber],
      steps: [trace.description, `Cast out by 12s: ${count} -> ${resultNumber}`, houseTrace.description],
      resultFigure: figure,
    };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good star', interpretation: 'It will remain forever.' };
    if (fortune === 'middleGood') return { outcome: 'mixed', label: 'Middle-good star', interpretation: "It will only reduce, but you won't be poor." };
    return { outcome: 'unfavourable', label: 'Bad star', interpretation: 'It will soon be cut off and you will be suffering again.' };
  },
};

export const wealthPermanenceQuestion: QuestionDefinition = {
  id: 'if-your-success-or-wealth-will-remain-forever',
  title: 'Will my success or wealth remain forever?',
  categoryId: 'money-possessions',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
