// Source: Kanzul Mikban, Chapter 7 — "Marriage and Its Blessings"
// (id "marriage-and-its-blessings").

import { ADD_MULTIPLE_HOUSES, CHECK_ELEMENT, CHECK_FIGURE_PRESENT_IN_CHART, EXTRACT_ELEMENT } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'marriage-and-its-blessings';

const method1: MethodDefinition = {
  id: 'marriage-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h1, h7, h4 and h10, and add them. If you get a downward star and it's found in the chart, you will get her and it's good; but if it's an upward star and not found in the chart, it's not good for you.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 7, 4, 10]);
    return { housesUsed: [1, 7, 4, 10], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const direction = calc.resultFigure.qualities.direction.value;
    const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern);
    if (direction === 'downward' && found) {
      return { outcome: 'favourable', label: 'Downward, found in the chart', interpretation: "You will get her, and it's good." };
    }
    if (direction === 'upward' && !found) {
      return { outcome: 'unfavourable', label: 'Upward, not found in the chart', interpretation: "It's not good for you." };
    }
    return {
      outcome: 'uncertain',
      label: 'Combination not addressed',
      interpretation: "This method only covers downward+found and upward+not-found — this chart's result falls outside both.",
    };
  },
};

const method2: MethodDefinition = {
  id: 'marriage-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Pick h4, h8, h14 and h16 sand elements and form a star. If found in the chart, it's good; but if it's not in the chart, it's not good for you even if you get her/him.",
  },
  calculate: (chart) => {
    const { figure, trace } = EXTRACT_ELEMENT(chart, [4, 8, 14, 16], 'sand');
    return { housesUsed: [4, 8, 14, 16], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern);
    return found
      ? { outcome: 'favourable', label: 'Found in the chart', interpretation: "It's good." }
      : { outcome: 'unfavourable', label: 'Not found in the chart', interpretation: "It's not good for you, even if you do get her/him." };
  },
};

const method3: MethodDefinition = {
  id: 'marriage-method-3',
  label: 'Method 3',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Pick h4, h6, h12 and h16 and add them. If your result is a sand star or fire star, it's good; if it's otherwise, it's not good for you.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [4, 6, 12, 16]);
    return { housesUsed: [4, 6, 12, 16], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const element = CHECK_ELEMENT(calc.resultFigure).element;
    return element === 'sand' || element === 'fire'
      ? { outcome: 'favourable', label: `${element} figure`, interpretation: "It's good." }
      : { outcome: 'unfavourable', label: `${element} figure`, interpretation: "It's not good for you." };
  },
};

// Every branch of this method depends on a specific named figure at H7 that
// the transcription dropped — the text repeats "If it's, you will get..."
// without ever naming which figure each branch refers to.
const method4: MethodDefinition = {
  id: 'marriage-method-4',
  label: 'Method 4',
  status: 'uncertain',
  reviewReasonCode: 'figures_omitted_by_transcription',
  reviewNote: 'Every branch depends on a specific named figure at H7 that the transcription never captured (repeated "If it\'s," with no figure named).',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Check h7. If you see [figures omitted — symbols not preserved in this transcription] it means you will get a colored or white lady with a child...",
  },
  calculate: () => {
    throw new Error('The named figures deciding each branch of this method were not transcribed from the source.');
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Not computable', interpretation: 'This method cannot currently be verified against the source.' }),
};

export const marriageBlessingsQuestion: QuestionDefinition = {
  id: 'marriage-and-its-blessings',
  title: 'Marriage and its blessings',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  methods: [method1, method2, method3, method4],
};
