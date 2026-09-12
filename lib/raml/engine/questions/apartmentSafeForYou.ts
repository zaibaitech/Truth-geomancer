// Source: Kanzul Mikban, Chapter 147 — "If This Apartment You Are Going to
// Is Safe/Good for You" (id "if-this-apartment-you-are-going-to-is"). One
// method (H1+H4+H5, a three-way sum via ADD_MULTIPLE_HOUSES), full 3-way
// fortune coverage. resultKind 'outcome': explicitly framed as personal
// benefit/harm ("safe" vs. "not").

import { ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-this-apartment-you-are-going-to-is';

const method1: MethodDefinition = {
  id: 'apartment-safe-for-you-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, pick h1 and h4, then add it to h5. If it's a good star, it's good and safe. If it's a bad star, it is not. If it's a middle-good star, you have to do a lot of prayers and sacrifices (spiritual cleansing).",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 4, 5]);
    return { housesUsed: [1, 4, 5], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good', interpretation: "It's good and safe." };
    if (fortune === 'middleGood') return { outcome: 'mixed', label: 'Middle-good', interpretation: 'You have to do a lot of prayers and sacrifices (spiritual cleansing).' };
    return { outcome: 'unfavourable', label: 'Bad', interpretation: 'It is not good and safe.' };
  },
};

export const apartmentSafeForYouQuestion: QuestionDefinition = {
  id: 'if-this-apartment-you-are-going-to-is',
  title: 'Is this apartment safe/good for me?',
  categoryId: 'work-success',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
