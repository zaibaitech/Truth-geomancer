// Source: Kanzul Mikban, Chapter 58 — "If Couples Have Had Sex or Not" (id
// "if-couples-have-had-sex-or-not"). Two methods, both fully computable via
// the water line's opened/closed state — the same manuscript-defined
// per-line mechanic already used by chapter 21's Method 2
// (wifeSisterHadSex.ts). A distinct chapter/question from chapter 21
// ("couples" generally vs. "wife or sister" specifically), so kept as its
// own question per the 1:1 chapter-to-question convention used throughout.
//
// resultKind is 'descriptive' here: whether sex occurred is a factual
// yes/no answer, not a favourable/unfavourable value judgment the source
// never makes. (Chapter 21's existing question still uses the outcome
// model from an earlier stage of this project — that pre-dates the
// descriptive result kind and is out of scope for this stage; see
// COVERAGE.md's source-verification queue for a future consistency pass.)

import { ADD_FIGURE_TO_HOUSE, ADD_MULTIPLE_HOUSES, CHECK_LINE_STATE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-couples-have-had-sex-or-not';

const method1: MethodDefinition = {
  id: 'couples-sex-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, pick h7 and h13 and add them. Then add it to h12. If the water element of the star is active (single dot), it means they have had sex; if it's not, it means they didn't.",
  },
  calculate: (chart) => {
    const step1 = ADD_MULTIPLE_HOUSES(chart, [7, 13]);
    const step2 = ADD_FIGURE_TO_HOUSE(chart, step1.figure, 12);
    return { housesUsed: [7, 13, 12], steps: [step1.trace.description, step2.trace.description], resultFigure: step2.figure };
  },
  evaluate: (calc) => {
    const opened = CHECK_LINE_STATE(calc.resultFigure, 'water') === 'opened';
    return opened
      ? { outcome: 'descriptive', label: 'Had sex', interpretation: 'The water line is active (single dot) — they have had sex.', descriptiveAnswer: 'yes' }
      : { outcome: 'descriptive', label: "Didn't", interpretation: "The water line is not active (double dot) — they didn't.", descriptiveAnswer: 'no' };
  },
};

const method2: MethodDefinition = {
  id: 'couples-sex-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Additional method (repeated later in the notebook): After casting the chart, pick h5 and h1 and add them. Check the water element of the star — if it's opened (single dot), it means they have had sex; if it's closed, they didn't do anything.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [5, 1]);
    return { housesUsed: [5, 1], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const opened = CHECK_LINE_STATE(calc.resultFigure, 'water') === 'opened';
    return opened
      ? { outcome: 'descriptive', label: 'Had sex', interpretation: "The water line is opened (single dot) — they have had sex.", descriptiveAnswer: 'yes' }
      : { outcome: 'descriptive', label: "Didn't", interpretation: "The water line is closed — they didn't do anything.", descriptiveAnswer: 'no' };
  },
};

export const couplesHadSexQuestion: QuestionDefinition = {
  id: 'if-couples-have-had-sex-or-not',
  title: 'Have they had sex?',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1, method2],
};
