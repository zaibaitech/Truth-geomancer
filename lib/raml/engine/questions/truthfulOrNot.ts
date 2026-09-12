// Source: Kanzul Mikban, Chapter 137 — "If Someone Is Truthful or Not" (id
// "if-someone-is-truthful-or-not"). Two methods.
//
// Method 1: H13 good -> truthful; H14 good -> not truthful. Neither house
// good is not addressed. BOTH houses good at once is a genuine conflict (two
// stated triggers, opposite conclusions, no priority given) — left
// uncertain, matching the chapter 103 Method 2 / 136 precedent for stated-
// but-overlapping conditions.
//
// Method 2: pick h1 and h5, add, check presence anywhere in the full
// 16-house chart (no self-exclusion stated) — the IDENTICAL calculation
// chapter 124 Method 2 already uses for a different question (is something
// really stolen). Same math, genuinely distinct questions (truthfulness vs.
// theft confirmation), so registered separately here rather than merged,
// per section 5's "answers a distinct question -> register it separately."
// Both methods use the same 'yes'/'no' descriptiveAnswer vocabulary so real
// agreement/conflict between them is detected correctly.
// resultKind 'descriptive': explicitly about truthfulness, a factual
// confirmation.

import { ADD_MULTIPLE_HOUSES, CHECK_FIGURE_PRESENT_IN_CHART, CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-someone-is-truthful-or-not';

const method1: MethodDefinition = {
  id: 'truthful-or-not-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Method 1: After drawing the chart, check h13 and h14. If h13 is a good star, he/she is telling the truth, or is a truthful person. But if it's h14 that is a good star, it means the querent is not truthful.",
  },
  calculate: (chart) => {
    const h13 = CHECK_HOUSE(chart, 13);
    const h14 = CHECK_HOUSE(chart, 14);
    return { housesUsed: [13, 14], steps: [h13.trace.description, h14.trace.description], resultFigure: h13.figure };
  },
  evaluate: (_calc, chart) => {
    const h13Good = CHECK_HOUSE(chart, 13).figure.qualities.fortune.value === 'good';
    const h14Good = CHECK_HOUSE(chart, 14).figure.qualities.fortune.value === 'good';
    if (h13Good && h14Good) {
      return { outcome: 'uncertain', label: 'Both H13 and H14 good', interpretation: 'Both stated triggers are satisfied at once, with no stated priority between them.' };
    }
    if (h13Good) {
      return { outcome: 'descriptive', label: 'H13 good', interpretation: 'He/she is telling the truth, or is a truthful person.', descriptiveAnswer: 'yes' };
    }
    if (h14Good) {
      return { outcome: 'descriptive', label: 'H14 good', interpretation: 'The querent is not truthful.', descriptiveAnswer: 'no' };
    }
    return { outcome: 'uncertain', label: 'Neither H13 nor H14 good', interpretation: 'The source only addresses H13 good or H14 good — neither is the case here.' };
  },
};

const method2: MethodDefinition = {
  id: 'truthful-or-not-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'Method 2: Pick h1 and h5 and add them. If it is found in the chart, it is true (yes); but if it is not found in the chart, it is not true (no).',
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 5]);
    return { housesUsed: [1, 5], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern);
    return found
      ? { outcome: 'descriptive', label: 'Found in chart', interpretation: 'It is true (yes) — he/she is truthful.', descriptiveAnswer: 'yes' }
      : { outcome: 'descriptive', label: 'Not found in chart', interpretation: 'It is not true (no) — he/she is not truthful.', descriptiveAnswer: 'no' };
  },
};

export const truthfulOrNotQuestion: QuestionDefinition = {
  id: 'if-someone-is-truthful-or-not',
  title: 'Is this person telling the truth?',
  categoryId: 'legal-conflict',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1, method2],
};
