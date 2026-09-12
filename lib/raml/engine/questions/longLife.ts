// Source: Kanzul Mikban, Chapter 93 — "If Someone Has Long Life or Not" (id
// "if-someone-has-long-life-or-not"). One method, reusing the existing
// FIND_FIGURE_QUARTER primitive: h1+h9, then which quarter of the chart
// the resulting figure is found in decides the verdict. The "not found
// anywhere" case is not a gap — the source itself gives it a real,
// deterministic answer ("only Allah Almighty knows"), mapped here to
// `uncertain` since that is honestly what it means: no favourable/
// unfavourable answer is available. resultKind 'outcome': long vs. short
// life carries an inherent value judgment (same reasoning as chapter 10's
// "is your lost thing still around," Prompt 6), not a neutral fact.

import { ADD_MULTIPLE_HOUSES, FIND_FIGURE_QUARTER } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-someone-has-long-life-or-not';

const method1: MethodDefinition = {
  id: 'long-life-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h1 and h9 and add them. If it is found in the first 4 houses, it means long life. If it is found in the last 4 houses, it means short life. If it is found in the second [or third] 4 houses, it means mid-long life. If it is not found in the chart at all, it means only Allah Almighty knows.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 9]);
    return { housesUsed: [1, 9], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const { quarter } = FIND_FIGURE_QUARTER(chart, calc.resultFigure.dotPattern);
    if (quarter === 'mothers') return { outcome: 'favourable', label: 'Found among H1-H4', interpretation: 'Long life.' };
    if (quarter === 'witnesses') return { outcome: 'unfavourable', label: 'Found among H13-H16', interpretation: 'Short life.' };
    if (quarter === 'daughters' || quarter === 'nieces') return { outcome: 'mixed', label: 'Found among H5-H12', interpretation: 'Mid-long life.' };
    return { outcome: 'uncertain', label: 'Not found in the chart', interpretation: 'Only Allah Almighty knows.' };
  },
};

export const longLifeQuestion: QuestionDefinition = {
  id: 'if-someone-has-long-life-or-not',
  title: 'Will they have a long life?',
  categoryId: 'health-hardships',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
