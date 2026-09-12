// Source: Kanzul Mikban, Chapter 16 — "If You Will Overcome Your Enemy or
// Not" (id "if-you-will-overcome-your-enemy-or-not").

import { ADD_MULTIPLE_HOUSES, CHECK_ELEMENT } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-will-overcome-your-enemy-or-not';

const method1: MethodDefinition = {
  id: 'overcome-enemy-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Pick (h1 and h12), (h8 and h13), and add all. If you get fire or air star, you will overcome him/her, and he/she will die. If it's water star, you will overcome him/her but he/she will not die. If it's sand star, you will never succeed — you cannot do anything to him/her. You will end up hurting yourself if you don't stop.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 12, 8, 13]);
    return { housesUsed: [1, 12, 8, 13], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const element = CHECK_ELEMENT(calc.resultFigure).element;
    if (element === 'fire' || element === 'air') {
      return { outcome: 'favourable', label: `${element} figure`, interpretation: 'You will overcome him/her, and he/she will die.' };
    }
    if (element === 'water') {
      return { outcome: 'mixed', label: 'Water figure', interpretation: 'You will overcome him/her, but he/she will not die.' };
    }
    return { outcome: 'unfavourable', label: 'Sand figure', interpretation: 'You will never succeed — stop before you hurt yourself.' };
  },
};

const method2: MethodDefinition = {
  id: 'overcome-enemy-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Pick (h1 and h12), then (h13 and h14), and add them all. If you get a good star, you will be saved by Allah Almighty from his charms and problems, and you are likely to overcome him/her. But if it's a bad star, please avoid him/her — you will be hurt if you try doing anything to him/her.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 12, 13, 14]);
    return { housesUsed: [1, 12, 13, 14], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') {
      return { outcome: 'favourable', label: 'Good', interpretation: 'You will be saved from his/her charms and problems, and are likely to overcome him/her.' };
    }
    if (fortune === 'bad') {
      return { outcome: 'unfavourable', label: 'Bad', interpretation: "Avoid him/her — you will be hurt if you try anything." };
    }
    return {
      outcome: 'uncertain',
      label: 'Middle-good (not addressed by this method)',
      interpretation: "This method only distinguishes good from bad; a middle-good result isn't covered by its own wording.",
    };
  },
};

export const overcomeEnemyQuestion: QuestionDefinition = {
  id: 'if-you-will-overcome-your-enemy-or-not',
  title: 'Will I overcome my enemy?',
  categoryId: 'legal-conflict',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
