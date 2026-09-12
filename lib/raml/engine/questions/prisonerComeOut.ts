// Source: Kanzul Mikban, Chapter 138 — "If a Prisoner Will Come Out of
// Prison and How Long It Will Take" (id "if-a-prisoner-will-come-out-of-prison").
// Two independent single-branch checks (positive-trigger-only, no stated
// opposite for either). resultKind 'outcome': release from prison is
// explicitly framed as a personal outcome.

import { CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-a-prisoner-will-come-out-of-prison';

const method1: MethodDefinition = {
  id: 'prisoner-come-out-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "After drawing the chart, check h6. If it's a good star, he/she will be removed from the prison.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 6);
    return { housesUsed: [6], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    if (calc.resultFigure.qualities.fortune.value === 'good') {
      return { outcome: 'favourable', label: 'H6 good', interpretation: 'He/she will be removed from the prison.' };
    }
    return { outcome: 'uncertain', label: 'H6 not good', interpretation: 'This method only addresses H6 being good — this is not addressed.' };
  },
};

const method2: MethodDefinition = {
  id: 'prisoner-come-out-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'If h8 and h16 are bad stars, it will take a long time before he/she is removed.',
  },
  calculate: (chart) => {
    const h8 = CHECK_HOUSE(chart, 8);
    const h16 = CHECK_HOUSE(chart, 16);
    return { housesUsed: [8, 16], steps: [h8.trace.description, h16.trace.description], resultFigure: h8.figure };
  },
  evaluate: (_calc, chart) => {
    const h8 = CHECK_HOUSE(chart, 8).figure.qualities.fortune.value;
    const h16 = CHECK_HOUSE(chart, 16).figure.qualities.fortune.value;
    if (h8 === 'bad' && h16 === 'bad') {
      return { outcome: 'unfavourable', label: 'H8 and H16 both bad', interpretation: 'It will take a long time before he/she is removed.' };
    }
    return { outcome: 'uncertain', label: 'Not both bad', interpretation: 'This method only addresses H8 and H16 both being bad — this is not addressed.' };
  },
};

export const prisonerComeOutQuestion: QuestionDefinition = {
  id: 'if-a-prisoner-will-come-out-of-prison',
  title: 'Will the prisoner come out, and how long will it take?',
  categoryId: 'legal-conflict',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
