// Source: Kanzul Mikban, Chapter 65 — "If a Partner Has a Particular
// Disease or Sickness" (id "if-a-partner-has-a-particular-disease-or").
// Three methods, each a single named-figure trigger check — the same
// "positive trigger only, no stated negative branch" shape as chapter 32's
// rain methods (Prompt 4): the absence of the named figure isn't assumed
// to mean "healthy," it's left uncertain since the source only defines
// the positive case.

import { CHECK_HOUSE, MATCH_FIGURE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-a-partner-has-a-particular-disease-or';

const method1: MethodDefinition = {
  id: 'partner-disease-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'Check h6 after drawing the chart. If you get Issah, there, it means he/she has a particular illness or sickness.',
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 6);
    return { housesUsed: [6], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const matches = MATCH_FIGURE(calc.resultFigure, 'issah');
    return matches
      ? { outcome: 'unfavourable', label: 'Issah at H6', interpretation: 'He/she has a particular illness or sickness.' }
      : { outcome: 'uncertain', label: 'Not Issah at H6', interpretation: 'The source only defines the "Issah at H6" trigger — this is not addressed.' };
  },
};

const method2: MethodDefinition = {
  id: 'partner-disease-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'After drawing the chart, check h14. If you get Issah there, it means he/she has a particular sickness.',
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 14);
    return { housesUsed: [14], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const matches = MATCH_FIGURE(calc.resultFigure, 'issah');
    return matches
      ? { outcome: 'unfavourable', label: 'Issah at H14', interpretation: 'He/she has a particular sickness.' }
      : { outcome: 'uncertain', label: 'Not Issah at H14', interpretation: 'The source only defines the "Issah at H14" trigger — this is not addressed.' };
  },
};

const method3: MethodDefinition = {
  id: 'partner-disease-method-3',
  label: 'Method 3',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'If you check h6 and found Ayuba there, it means he/she has jinn spirits or a spiritual [problem affecting the] marriage.',
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 6);
    return { housesUsed: [6], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const matches = MATCH_FIGURE(calc.resultFigure, 'ayuba');
    return matches
      ? { outcome: 'unfavourable', label: 'Ayuba at H6', interpretation: 'He/she has jinn spirits or a spiritual problem affecting the marriage.' }
      : { outcome: 'uncertain', label: 'Not Ayuba at H6', interpretation: 'The source only defines the "Ayuba at H6" trigger — this is not addressed.' };
  },
};

export const partnerDiseaseQuestion: QuestionDefinition = {
  id: 'if-a-partner-has-a-particular-disease-or',
  title: 'Does my partner have a particular disease or sickness?',
  categoryId: 'health-hardships',
  chapterId: CHAPTER_ID,
  methods: [method1, method2, method3],
};
