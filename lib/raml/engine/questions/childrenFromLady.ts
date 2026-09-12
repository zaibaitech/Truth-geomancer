// Source: Kanzul Mikban, Chapter 13 — "If You Will Get Children from a
// Lady You Want to Marry" (id "if-you-will-get-children-from-a-lady").

import { ADD_MULTIPLE_HOUSES, CHECK_ELEMENT, CHECK_FIGURE_PRESENT_IN_CHART, CHECK_LINE_STATE, EXTRACT_ELEMENT, EXTRACT_LINES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-will-get-children-from-a-lady';

const method1: MethodDefinition = {
  id: 'children-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Pick h1 fire element, h5 air element, h4 water element, and h10 sand element, and form a star. If it's a good and downward star, and also found in the chart, you will get children early and many kids. If it's a good star but not in the chart, you will get kids but not early. If it's a bad star, you won't.",
  },
  calculate: (chart) => {
    const { figure, trace } = EXTRACT_LINES(chart, [
      { house: 1, element: 'fire' },
      { house: 5, element: 'air' },
      { house: 4, element: 'water' },
      { house: 10, element: 'sand' },
    ]);
    return { housesUsed: [1, 5, 4, 10], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const { fortune, direction } = calc.resultFigure.qualities;
    const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern);
    if (fortune.value === 'bad') {
      return { outcome: 'unfavourable', label: 'Bad', interpretation: "You won't get children with her." };
    }
    if (fortune.value === 'good' && direction.value === 'downward' && found) {
      return { outcome: 'favourable', label: 'Good, downward, found', interpretation: 'You will get children early, and many kids.' };
    }
    if (fortune.value === 'good' && !found) {
      return { outcome: 'mixed', label: 'Good, not found in the chart', interpretation: 'You will get kids, but not early.' };
    }
    return {
      outcome: 'uncertain',
      label: 'Combination not addressed',
      interpretation: 'This method covers good+downward+found, good-and-not-found, and bad results — this chart falls outside all three.',
    };
  },
};

const method2: MethodDefinition = {
  id: 'children-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Pick h1, h5, h11 and h14 and add them. If it's fire star, you will have kids very fast. If it's air star, you will get kids but it will take a long time. If it's water or sand star, it will be difficult to have a kid with her.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 5, 11, 14]);
    return { housesUsed: [1, 5, 11, 14], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const element = CHECK_ELEMENT(calc.resultFigure).element;
    if (element === 'fire') return { outcome: 'favourable', label: 'Fire figure', interpretation: 'You will have kids very fast.' };
    if (element === 'air') return { outcome: 'mixed', label: 'Air figure', interpretation: 'You will get kids, but it will take a long time.' };
    return { outcome: 'unfavourable', label: `${element[0].toUpperCase()}${element.slice(1)} figure`, interpretation: 'It will be difficult to have a kid with her.' };
  },
};

const method3: MethodDefinition = {
  id: 'children-method-3',
  label: 'Method 3',
  status: 'uncertain',
  reviewReasonCode: 'figures_omitted_by_transcription',
  reviewNote: 'Every branch depends on specific named figures at H5 that the transcription marked "[figures omitted — symbols not preserved]".',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'If you found the following stars in house 5, it means she will get pregnant early for you: [figures omitted]...',
  },
  calculate: () => {
    throw new Error('The named figures deciding each branch of this method were not transcribed from the source.');
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Not computable', interpretation: 'This method cannot currently be verified against the source.' }),
};

const method4: MethodDefinition = {
  id: 'children-method-4',
  label: 'Method 4',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Pick h6 and h10 and add them. If it's a downward star, she will (have kids); but if it's upward, she will not.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [6, 10]);
    return { housesUsed: [6, 10], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const direction = calc.resultFigure.qualities.direction.value;
    if (direction === 'downward') return { outcome: 'favourable', label: 'Downward', interpretation: 'She will have kids.' };
    if (direction === 'upward') return { outcome: 'unfavourable', label: 'Upward', interpretation: 'She will not.' };
    return { outcome: 'uncertain', label: 'Level (no clear direction)', interpretation: "This figure's top and bottom lines match, so this method's test doesn't resolve cleanly here." };
  },
};

const method5: MethodDefinition = {
  id: 'children-method-5',
  label: 'Method 5',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Pick h2, h5, h7 and h15 water elements and form a star. If the water element is opened (single dot), she will — and if it's a good star too, she will — but if it's not, she will not have kids.",
  },
  calculate: (chart) => {
    const { figure, trace } = EXTRACT_ELEMENT(chart, [2, 5, 7, 15], 'water');
    return { housesUsed: [2, 5, 7, 15], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const openedAndGood = CHECK_LINE_STATE(calc.resultFigure, 'water') === 'opened' && calc.resultFigure.qualities.fortune.value === 'good';
    return openedAndGood
      ? { outcome: 'favourable', label: 'Water line opened, good', interpretation: 'She will have kids.' }
      : { outcome: 'unfavourable', label: 'Condition not met', interpretation: 'She will not have kids.' };
  },
};

export const childrenFromLadyQuestion: QuestionDefinition = {
  id: 'if-you-will-get-children-from-a-lady',
  title: 'Will I get children from this lady?',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  methods: [method1, method2, method3, method4, method5],
};
