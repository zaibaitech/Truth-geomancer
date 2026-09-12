// Source: Kanzul Mikban, Chapter 9 — "Sickness (If He/She Will Survive)"
// (id "sickness-if-he-she-will-survive").

import { ADD_FIGURE_TO_HOUSE, ADD_MULTIPLE_HOUSES, CHECK_FIGURE_PRESENT_IN_CHART, CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'sickness-if-he-she-will-survive';

const method1: MethodDefinition = {
  id: 'sickness-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h4 and h6 and add it to h8. Add all and check: if it's a good star, it's sickness from Allah; if it's a bad star, it's from humans. If it's found in the chart, he/she has a long life; if not found in the chart, he/she will not survive it.",
  },
  calculate: (chart) => {
    const step1 = ADD_MULTIPLE_HOUSES(chart, [4, 6]);
    const step2 = ADD_FIGURE_TO_HOUSE(chart, step1.figure, 8);
    return { housesUsed: [4, 6, 8], steps: [step1.trace.description, step2.trace.description], resultFigure: step2.figure };
  },
  evaluate: (calc, chart) => {
    const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern);
    const fortune = calc.resultFigure.qualities.fortune.value;
    const cause = fortune === 'good' ? ' The sickness is from Allah.' : fortune === 'bad' ? ' The sickness is from humans.' : '';
    return found
      ? { outcome: 'favourable', label: 'Found in the chart', interpretation: `He/she has a long life.${cause}` }
      : { outcome: 'unfavourable', label: 'Not found in the chart', interpretation: `He/she will not survive it.${cause}` };
  },
};

const method2: MethodDefinition = {
  id: 'sickness-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h2, h5, h8 and h11 and add them all. If it's found in the chart, he/she will survive the sickness; if it's not found in the chart, he/she will not survive.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [2, 5, 8, 11]);
    return { housesUsed: [2, 5, 8, 11], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern);
    return found
      ? { outcome: 'favourable', label: 'Found in the chart', interpretation: 'He/she will survive the sickness.' }
      : { outcome: 'unfavourable', label: 'Not found in the chart', interpretation: 'He/she will not survive.' };
  },
};

const method3: MethodDefinition = {
  id: 'sickness-method-3',
  label: 'Method 3',
  status: 'uncertain',
  reviewReasonCode: 'figures_omitted_by_transcription',
  reviewNote: 'Both the healing and the difficult-to-survive figure lists for H6 were transcribed as "[figures omitted — symbols not preserved]".',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "If you find the following stars in h6, he/she will be healed, insha'Allah: [figures omitted]. But if you find stars like: [figures omitted] it means it will be difficult for him/her to survive.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 6);
    return { housesUsed: [6], steps: [trace.description], resultFigure: figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Not computable', interpretation: 'The deciding figures for H6 were not transcribed from the source.' }),
};

export const sicknessSurvivalQuestion: QuestionDefinition = {
  id: 'sickness-if-he-she-will-survive',
  title: 'Sickness — will he/she survive?',
  categoryId: 'health-hardships',
  chapterId: CHAPTER_ID,
  methods: [method1, method2, method3],
};
