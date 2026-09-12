// Source: Kanzul Mikban, Chapter 80 — "If a Pregnancy Is Yours or Not
// (D.N.A.)" (id "if-a-pregnancy-is-yours-or-not-d"). Two methods, both
// fully computable and fully binary (every branch addressed). resultKind
// is 'descriptive': paternity is a factual yes/no answer whose
// desirability isn't stated by the source (unlike, e.g., "will I get
// money", paternity confirmation isn't framed as universally good or bad
// news) — same reasoning as chapters 47/58/66 (Prompt 5/6).

import { ADD_MULTIPLE_HOUSES, CHECK_FIGURE_PRESENT_IN_CHART, CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-a-pregnancy-is-yours-or-not-d';

const method1: MethodDefinition = {
  id: 'pregnancy-paternity-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "After drawing the chart, pick h1 and h5 and add them. If it's found in the chart, the pregnancy is yours; but if it's not in the chart, it's not yours.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 5]);
    return { housesUsed: [1, 5], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern);
    return found
      ? { outcome: 'descriptive', label: 'Yours', interpretation: 'The pregnancy is yours.', descriptiveAnswer: 'yours' }
      : { outcome: 'descriptive', label: 'Not yours', interpretation: "It's not yours.", descriptiveAnswer: 'not-yours' };
  },
};

const method2: MethodDefinition = {
  id: 'pregnancy-paternity-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Check h10 and h11 after casting the chart. If both are good stars, then it's yours; but if they are not, it's not yours.",
  },
  calculate: (chart) => {
    const h10 = CHECK_HOUSE(chart, 10);
    const h11 = CHECK_HOUSE(chart, 11);
    return { housesUsed: [10, 11], steps: [h10.trace.description, h11.trace.description], resultFigure: h11.figure };
  },
  evaluate: (_calc, chart) => {
    const bothGood = [10, 11].every((n) => CHECK_HOUSE(chart, n).figure.qualities.fortune.value === 'good');
    return bothGood
      ? { outcome: 'descriptive', label: 'Yours', interpretation: "It's yours.", descriptiveAnswer: 'yours' }
      : { outcome: 'descriptive', label: 'Not yours', interpretation: "It's not yours.", descriptiveAnswer: 'not-yours' };
  },
};

export const pregnancyPaternityQuestion: QuestionDefinition = {
  id: 'if-a-pregnancy-is-yours-or-not-d',
  title: 'Is this pregnancy mine?',
  categoryId: 'family-loved-ones',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1, method2],
};
