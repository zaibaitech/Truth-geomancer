// Source: Kanzul Mikban, Chapter 61 — "If a Marriage Is Good or Not" (id
// "if-a-marriage-is-good-or-not"). Two methods, both fully computable via
// the existing good/middle-good/bad fortune classification. Method 1's
// "like 22121 [figures omitted]" is an illustrative example only (naming
// ONE figure that happens to satisfy "good star"), not a blocking
// omission — the rule itself is already defined generically by fortune,
// same as chapter 42's bracketed examples (Prompt 5).

import { ADD_MULTIPLE_HOUSES, CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-a-marriage-is-good-or-not';

const method1: MethodDefinition = {
  id: 'marriage-good-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, check h7. If it's a good star like22121 [figures omitted — symbols not preserved in this transcription] then it's very good. If it's a middle-good star, it's partially good. If it's a bad star, it's not good at all.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 7);
    return { housesUsed: [7], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good star', interpretation: "It's very good." };
    if (fortune === 'middleGood') return { outcome: 'mixed', label: 'Middle-good star', interpretation: "It's partially good." };
    return { outcome: 'unfavourable', label: 'Bad star', interpretation: "It's not good at all." };
  },
};

const method2: MethodDefinition = {
  id: 'marriage-good-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Pick h3, h7, h11 and h14 and add them. If it's a good star, it's good; if it's a bad star, it's not good.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [3, 7, 11, 14]);
    return { housesUsed: [3, 7, 11, 14], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good star', interpretation: "It's good." };
    if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad star', interpretation: "It's not good." };
    return { outcome: 'uncertain', label: 'Middle-good star', interpretation: 'This method only addresses clearly good or bad results.' };
  },
};

export const marriageGoodOrNotQuestion: QuestionDefinition = {
  id: 'if-a-marriage-is-good-or-not',
  title: 'Is this marriage good?',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
