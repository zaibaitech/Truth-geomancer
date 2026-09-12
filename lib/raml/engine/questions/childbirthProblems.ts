// Source: Kanzul Mikban, Chapter 70 — "If a Pregnant Woman Will Have
// Childbirth Problems in Her Marriage" (id
// "if-a-pregnant-woman-will-have-childbirth-problems"). Two methods, each a
// single named-figure trigger check — positive trigger only, no stated
// negative branch (same shape as chapter 65's disease checks and chapter
// 32's rain methods).

import { CHECK_HOUSE, MATCH_FIGURE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-a-pregnant-woman-will-have-childbirth-problems';

const method1: MethodDefinition = {
  id: 'childbirth-problems-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "After casting the chart, check h7. If it's Yunus, it means it will be difficult for her to have kids.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 7);
    return { housesUsed: [7], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const matches = MATCH_FIGURE(calc.resultFigure, 'yunus');
    return matches
      ? { outcome: 'unfavourable', label: 'Yunus at H7', interpretation: 'It will be difficult for her to have kids.' }
      : { outcome: 'uncertain', label: 'Not Yunus at H7', interpretation: 'The source only defines the "Yunus at H7" trigger — this is not addressed.' };
  },
};

const method2: MethodDefinition = {
  id: 'childbirth-problems-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Check h5; if it's Yusuf, it means she's going to have a childbirth problem in her life.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 5);
    return { housesUsed: [5], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const matches = MATCH_FIGURE(calc.resultFigure, 'yussif');
    return matches
      ? { outcome: 'unfavourable', label: 'Yusuf at H5', interpretation: "She's going to have a childbirth problem in her life." }
      : { outcome: 'uncertain', label: 'Not Yusuf at H5', interpretation: 'The source only defines the "Yusuf at H5" trigger — this is not addressed.' };
  },
};

export const childbirthProblemsQuestion: QuestionDefinition = {
  id: 'if-a-pregnant-woman-will-have-childbirth-problems',
  title: 'Will she have childbirth problems in her marriage?',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
