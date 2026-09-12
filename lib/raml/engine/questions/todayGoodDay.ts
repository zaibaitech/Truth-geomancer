// Source: Kanzul Mikban, Chapter 100 — "If Today Is a Good Day or Not" (id
// "if-today-is-a-good-day-or-not"). One method, full good/middle-good/bad
// coverage — middle-good is explicitly, deterministically "no good news or
// bad news" (mapped to `mixed`, not `uncertain`: the source addresses it,
// it just addresses it as neutral). resultKind 'outcome'.

import { ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-today-is-a-good-day-or-not';

const method1: MethodDefinition = {
  id: 'today-good-day-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h2 and h8 and add them. If it's a good star, it will be good; but if it's a bad star, expect bad news that day. If it's a middle-good star, there will be no good news or bad news that day.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [2, 8]);
    return { housesUsed: [2, 8], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good star', interpretation: 'It will be a good day.' };
    if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad star', interpretation: 'Expect bad news today.' };
    return { outcome: 'mixed', label: 'Middle-good star', interpretation: 'There will be no good news or bad news today.' };
  },
};

export const todayGoodDayQuestion: QuestionDefinition = {
  id: 'if-today-is-a-good-day-or-not',
  title: 'Is today a good day?',
  categoryId: 'fate-timing',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
