// Source: Kanzul Mikban, Chapter 71 — "If a Man Will Have Manhood Problems
// in His Marriage or Life" (id "if-a-man-will-have-manhood-problems-in").
// Two methods, each a single named-figure trigger check — positive
// trigger only, no stated negative branch.

import { CHECK_HOUSE, MATCH_FIGURE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-a-man-will-have-manhood-problems-in';

const method1: MethodDefinition = {
  id: 'manhood-problems-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "After drawing the chart, check h3. If it's Sulemana, it means he will have manhood problems in future.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 3);
    return { housesUsed: [3], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const matches = MATCH_FIGURE(calc.resultFigure, 'sulemana');
    return matches
      ? { outcome: 'unfavourable', label: 'Sulemana at H3', interpretation: 'He will have manhood problems in future.' }
      : { outcome: 'uncertain', label: 'Not Sulemana at H3', interpretation: 'The source only defines the "Sulemana at H3" trigger — this is not addressed.' };
  },
};

const method2: MethodDefinition = {
  id: 'manhood-problems-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "After drawing the chart, check h5. If it's Ayuba, it means he will have weak manhood, or it will die (fail) in future.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 5);
    return { housesUsed: [5], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const matches = MATCH_FIGURE(calc.resultFigure, 'ayuba');
    return matches
      ? { outcome: 'unfavourable', label: 'Ayuba at H5', interpretation: 'He will have weak manhood, or it will fail in future.' }
      : { outcome: 'uncertain', label: 'Not Ayuba at H5', interpretation: 'The source only defines the "Ayuba at H5" trigger — this is not addressed.' };
  },
};

export const manhoodProblemsQuestion: QuestionDefinition = {
  id: 'if-a-man-will-have-manhood-problems-in',
  title: 'Will he have manhood problems in his marriage or life?',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
