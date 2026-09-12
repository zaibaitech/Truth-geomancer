// Source: Kanzul Mikban, Chapter 96 — "If a Sick Person Has Long Life or
// Not" (id "if-a-sick-person-has-long-life-or"). Two methods. Method 2
// comes from the unnumbered fragment that follows chapter 96 shortly
// after, explicitly titled "Additional Method — If a Sick Person Has Long
// Life (repeated later in the notebook)" — its own title says it answers
// the SAME question as chapter 96, so it is registered here as chapter
// 96's own Method 2 rather than under its separate intentions.ts id
// ("if-a-sick-person-has-long-life-repeated"), matching the ch.47+fragment
// and ch.48+ch.56 consolidation precedent from Prompt 5. Method 2 reuses
// the ch.62/67/74 "extract an element from each quartet, sum via
// ADD_FIGURES" mechanic exactly.

import { ADD_FIGURES, ADD_MULTIPLE_HOUSES, CHECK_LINE_STATE, EXTRACT_ELEMENT } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-a-sick-person-has-long-life-or';
const FRAGMENT_CHAPTER_ID = 'if-a-sick-person-has-long-life-repeated';

const method1: MethodDefinition = {
  id: 'sick-person-long-life-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'After casting the chart, pick h1 and h9 and add them. After that, check the air element — if it is a single dot, there is long life; but if it is double dots, there is no long life.',
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 9]);
    return { housesUsed: [1, 9], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const opened = CHECK_LINE_STATE(calc.resultFigure, 'air') === 'opened';
    return opened
      ? { outcome: 'favourable', label: 'Air line opened', interpretation: 'There is long life.' }
      : { outcome: 'unfavourable', label: 'Air line closed', interpretation: 'There is no long life.' };
  },
};

const method2: MethodDefinition = {
  id: 'sick-person-long-life-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    // Prompt 13 traceability fix: this method implements the unnumbered
    // "repeated later in the notebook" fragment verbatim, not chapter 96's
    // own paragraph — so it now cites the fragment's own entry rather than
    // chapter 96's, keeping consolidated material traceable to where it
    // actually came from. The QUESTION still belongs to chapter 96; only
    // this one method's source reference changed. (The fragment carries no
    // chapter number of its own, so it renders as an unnumbered Kanzul
    // Mikban reference — the same way chapter 47's own fragment methods
    // already do.)
    chapterId: FRAGMENT_CHAPTER_ID,
    quote:
      "Additional Method (repeated later in the notebook): Pick all of the first 4 houses' water elements, the second 4 houses' water elements, the third 4 houses' water elements, and the last 4 houses' water elements, and add them. If the water element is closed, he/she has long life, and the vice versa.",
  },
  calculate: (chart) => {
    const q1 = EXTRACT_ELEMENT(chart, [1, 2, 3, 4], 'water');
    const q2 = EXTRACT_ELEMENT(chart, [5, 6, 7, 8], 'water');
    const q3 = EXTRACT_ELEMENT(chart, [9, 10, 11, 12], 'water');
    const q4 = EXTRACT_ELEMENT(chart, [13, 14, 15, 16], 'water');
    const { figure, trace } = ADD_FIGURES([q1.figure, q2.figure, q3.figure, q4.figure]);
    return {
      housesUsed: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      steps: [q1.trace.description, q2.trace.description, q3.trace.description, q4.trace.description, trace.description],
      resultFigure: figure,
    };
  },
  evaluate: (calc) => {
    const closed = CHECK_LINE_STATE(calc.resultFigure, 'water') === 'closed';
    return closed
      ? { outcome: 'favourable', label: 'Water line closed', interpretation: 'He/she has long life.' }
      : { outcome: 'unfavourable', label: 'Water line opened', interpretation: 'He/she does not have long life.' };
  },
};

export const sickPersonLongLifeQuestion: QuestionDefinition = {
  id: 'if-a-sick-person-has-long-life-or',
  title: 'Does this sick person have long life?',
  categoryId: 'health-hardships',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
