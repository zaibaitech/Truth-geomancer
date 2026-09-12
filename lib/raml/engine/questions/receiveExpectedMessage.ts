// Source: Kanzul Mikban, Chapter 148 — "If You Will Receive the Expected
// Message" (id "if-you-will-receive-the-expected-message"). One method
// (H1+H5+H15, a three-way sum via ADD_MULTIPLE_HOUSES), full 3-way fortune
// coverage. resultKind 'outcome': explicitly framed as personal
// benefit/harm.

import { ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-will-receive-the-expected-message';

const method1: MethodDefinition = {
  id: 'receive-expected-message-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, pick h1 and h5, then add it to h15. If it's a good star, you will get it easily. If it's a bad star, you won't get it at all. If it's a middle-good star, you may get it with serious prayer and sacrifices.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 5, 15]);
    return { housesUsed: [1, 5, 15], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good', interpretation: 'You will get it easily.' };
    if (fortune === 'middleGood') return { outcome: 'mixed', label: 'Middle-good', interpretation: 'You may get it with serious prayer and sacrifices.' };
    return { outcome: 'unfavourable', label: 'Bad', interpretation: "You won't get it at all." };
  },
};

export const receiveExpectedMessageQuestion: QuestionDefinition = {
  id: 'if-you-will-receive-the-expected-message',
  title: 'Will I receive the expected message?',
  categoryId: 'fate-timing',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
