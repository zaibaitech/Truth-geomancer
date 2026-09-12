// Source: Kanzul Mikban, Chapter 103 — "If the Querent Is Sick or Not" (id
// "if-the-querent-is-sick-or-not"). Two methods. Method 1's calculation
// (h1+h9, air element) is the same combination chapters 93/96 Method 1
// already use — a genuinely different question each time (this chapter
// asks about the QUERENT's own current health, not a named sick person's
// longevity), so it is its own method here, not a duplicate. Method 2
// checks h9 alone, but states two INDEPENDENT line-conditions on the same
// figure (fire closed -> not sick; air closed -> not well) rather than
// one combined condition — since both lines can genuinely be closed at
// once, and the source never says which one wins, that specific
// combination is left `uncertain` rather than picking one arbitrarily.

import { ADD_MULTIPLE_HOUSES, CHECK_HOUSE, CHECK_LINE_STATE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-the-querent-is-sick-or-not';

const method1: MethodDefinition = {
  id: 'querent-sick-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'After drawing the chart, pick h1 and h9 and add them. If the air element is opened, he/she is not sick; but if it is closed, she/he is not well.',
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 9]);
    return { housesUsed: [1, 9], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const opened = CHECK_LINE_STATE(calc.resultFigure, 'air') === 'opened';
    return opened
      ? { outcome: 'favourable', label: 'Air line opened', interpretation: 'He/she is not sick.' }
      : { outcome: 'unfavourable', label: 'Air line closed', interpretation: 'He/she is not well.' };
  },
};

const method2: MethodDefinition = {
  id: 'querent-sick-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'After casting the chart, check h9. If the fire element is closed, it means he/she is not sick; but if the air element is closed, it means he/she is not well.',
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 9);
    return { housesUsed: [9], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fireClosed = CHECK_LINE_STATE(calc.resultFigure, 'fire') === 'closed';
    const airClosed = CHECK_LINE_STATE(calc.resultFigure, 'air') === 'closed';
    if (fireClosed && airClosed) {
      return { outcome: 'uncertain', label: 'Fire and air both closed', interpretation: 'The source gives no way to choose between its two conditions when both are true at once.' };
    }
    if (fireClosed) return { outcome: 'favourable', label: 'Fire line closed', interpretation: 'He/she is not sick.' };
    if (airClosed) return { outcome: 'unfavourable', label: 'Air line closed', interpretation: 'He/she is not well.' };
    return { outcome: 'uncertain', label: 'Neither fire nor air closed', interpretation: 'This method only addresses the fire or air line being closed — this is not addressed.' };
  },
};

export const querentSickQuestion: QuestionDefinition = {
  id: 'if-the-querent-is-sick-or-not',
  title: 'Am I sick right now?',
  categoryId: 'health-hardships',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
