// Source: Kanzul Mikban, Chapter 143 — "The Consequence of a Prisoner" (id
// "the-consequence-of-a-prisoner"). Two methods, each a multi-house sum
// (ADD_MULTIPLE_HOUSES handles any grouping — see that operation's own doc
// comment on why "pick A and B, then C and D, then add them all" is the
// same as summing all four houses at once). Both methods address only
// good/bad; middle-good is not addressed by either. resultKind 'outcome':
// explicitly framed as personal benefit/harm ("well after prison" vs. "not
// easy after prison").

import { ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'the-consequence-of-a-prisoner';

const method1: MethodDefinition = {
  id: 'prisoner-consequence-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'Method 1: After drawing the chart, pick h1 and h6 and add them. Then pick h12 and h15 and add them. Then add all of them together. If it\'s a good star, it is going to be well after the prison; but if it\'s a bad star, it\'s not going to be easy after prison.',
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 6, 12, 15]);
    return { housesUsed: [1, 6, 12, 15], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good', interpretation: 'It is going to be well after the prison.' };
    if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad', interpretation: "It's not going to be easy after prison." };
    return { outcome: 'uncertain', label: 'Middle-good', interpretation: 'This method only addresses good or bad — middle-good is not addressed.' };
  },
};

const method2: MethodDefinition = {
  id: 'prisoner-consequence-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Method 2: Pick h3 and h12, then h1 and h4, and add them all together. If it's a good star, it's going to be well, and vice versa.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [3, 12, 1, 4]);
    return { housesUsed: [1, 3, 4, 12], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good', interpretation: "It's going to be well." };
    if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad', interpretation: "It's not going to be well." };
    return { outcome: 'uncertain', label: 'Middle-good', interpretation: 'This method only addresses good or bad — middle-good is not addressed.' };
  },
};

export const prisonerConsequenceQuestion: QuestionDefinition = {
  id: 'the-consequence-of-a-prisoner',
  title: 'What will happen to the prisoner afterward?',
  categoryId: 'legal-conflict',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
