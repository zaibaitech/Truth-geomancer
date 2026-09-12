// Source: Kanzul Mikban, Chapter 12 — "If You Want to Know If You Will Be
// Rich in Life or Not" (id "if-you-want-to-know-if-you-will-3"). One
// layered method: element decides the headline outcome, and fortune
// refines the water/sand branch specifically — encoded exactly as nested
// in the source rather than flattened into an approximation.

import { ADD_MULTIPLE_HOUSES, CHECK_ELEMENT } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-want-to-know-if-you-will-3';

const method1: MethodDefinition = {
  id: 'rich-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Pick h1, h7, h4 and h8 and add them. If it's fire or air star, you will be rich; but if it's water or sand star, it will be difficult — you need serious prayers. If it's a good star but water or sand star, you will be feeding and clothing alright but you won't be rich. If it's a bad star and also water or sand star, you can only feed from hand to mouth.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 7, 4, 8]);
    return { housesUsed: [1, 7, 4, 8], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const { element, qualities } = calc.resultFigure;
    if (element === 'fire' || element === 'air') {
      return { outcome: 'favourable', label: `${element} figure`, interpretation: 'You will be rich.' };
    }
    // water or sand
    if (qualities.fortune.value === 'good') {
      return { outcome: 'mixed', label: `Good, ${element} figure`, interpretation: "You will be feeding and clothing alright, but you won't be rich." };
    }
    if (qualities.fortune.value === 'bad') {
      return { outcome: 'unfavourable', label: `Bad, ${element} figure`, interpretation: 'You can only feed from hand to mouth.' };
    }
    return {
      outcome: 'uncertain',
      label: `Middle-good, ${element} figure`,
      interpretation: 'This method only refines the water/sand result for clearly good or bad figures — a middle-good one is not addressed.',
    };
  },
};

export const richOrNotQuestion: QuestionDefinition = {
  id: 'if-you-want-to-know-if-you-will-3',
  title: 'Will I be rich in life?',
  categoryId: 'money-possessions',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
