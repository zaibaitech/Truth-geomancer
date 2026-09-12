// Source: Kanzul Mikban, Chapter 126 — "The Number of Thieves" (id
// "the-number-of-thieves"). One method: how many times H7's own figure
// repeats across the full 16-house chart (including H7 itself, exactly as
// chapter 120 Method 1 counts Nuhu's occurrences — no self-exclusion is
// stated here either, and the count is always >= 1 since H7 always matches
// itself). resultKind 'descriptive': a count, not a favourable/unfavourable
// judgment.

import { CHECK_HOUSE, COUNT_FIGURE_OCCURRENCES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'the-number-of-thieves';

const method1: MethodDefinition = {
  id: 'number-of-thieves-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'After drawing the chart, check h7. The number of times h7 repeats in the chart is the number of thieves.',
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 7);
    return { housesUsed: [7], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const { count } = COUNT_FIGURE_OCCURRENCES(chart, calc.resultFigure.dotPattern);
    return {
      outcome: 'descriptive',
      label: `${count} thie${count === 1 ? 'f' : 'ves'}`,
      interpretation: `H7's figure repeats ${count} time(s) in the chart — that is the number of thieves.`,
      descriptiveAnswer: String(count),
    };
  },
};

export const numberOfThievesQuestion: QuestionDefinition = {
  id: 'the-number-of-thieves',
  title: 'How many thieves are there?',
  categoryId: 'legal-conflict',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
