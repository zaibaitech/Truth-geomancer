// Source: Kanzul Mikban, Chapter 32 — "If It Will Rain Today or Not" (id
// "if-it-will-rain-today-or-not"). Four independent methods, each stating
// only a POSITIVE trigger condition ("if X, it will rain") and never an
// explicit negative branch — so each method's "condition not met" case is
// left `uncertain` (source silent) rather than assumed to mean "no rain".

import { CHECK_ELEMENT_ADJACENT_REPETITION, CHECK_FIGURE_ADJACENT_REPETITION, CHECK_HOUSE, MATCH_FIGURE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';
import { getStarById } from '@/content/stars';

const CHAPTER_ID = 'if-it-will-rain-today-or-not';

function starPattern(id: string) {
  const star = getStarById(id);
  if (!star) throw new Error(`Unknown star id "${id}"`);
  return star.pattern;
}

const method1: MethodDefinition = {
  id: 'rain-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'After casting the chart, check if Ali is following each other in the chart. If they are, then it will rain.',
  },
  calculate: (chart) => {
    const aliPattern = starPattern('ali');
    const { trace } = CHECK_FIGURE_ADJACENT_REPETITION(chart, aliPattern);
    return {
      housesUsed: [],
      steps: [trace.description],
      resultFigure: CHECK_HOUSE(chart, 1).figure, // Ali may not appear at all; H1 shown as a representative reference figure only
    };
  },
  evaluate: (_calc, chart) => {
    const { found } = CHECK_FIGURE_ADJACENT_REPETITION(chart, starPattern('ali'));
    return found
      ? { outcome: 'favourable', label: 'Ali follows Ali', interpretation: 'It will rain.' }
      : { outcome: 'uncertain', label: 'Ali does not follow Ali', interpretation: 'The source only defines the "Ali follows Ali" trigger — this is not addressed.' };
  },
};

const method2: MethodDefinition = {
  id: 'rain-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'After drawing the chart, check h4. If you found Kallah Allahu there, it is going to rain.',
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 4);
    return { housesUsed: [4], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const matches = MATCH_FIGURE(calc.resultFigure, 'kalla-allahu');
    return matches
      ? { outcome: 'favourable', label: 'Kalla Allahu at H4', interpretation: 'It is going to rain.' }
      : { outcome: 'uncertain', label: 'Not Kalla Allahu at H4', interpretation: 'The source only defines the "Kalla Allahu at H4" trigger — this is not addressed.' };
  },
};

const method3: MethodDefinition = {
  id: 'rain-method-3',
  label: 'Method 3',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "If you found Iddris in h9, it is going to rain, insha'Allah.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 9);
    return { housesUsed: [9], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const matches = MATCH_FIGURE(calc.resultFigure, 'iddris');
    return matches
      ? { outcome: 'favourable', label: 'Iddris at H9', interpretation: 'It is going to rain, insha\'Allah.' }
      : { outcome: 'uncertain', label: 'Not Iddris at H9', interpretation: 'The source only defines the "Iddris at H9" trigger — this is not addressed.' };
  },
};

const method4: MethodDefinition = {
  id: 'rain-method-4',
  label: 'Method 4',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'Also, when water stars are following each other in a chart, it talks about rain.',
  },
  calculate: (chart) => {
    const { trace } = CHECK_ELEMENT_ADJACENT_REPETITION(chart, 'water');
    return {
      housesUsed: [],
      steps: [trace.description],
      resultFigure: CHECK_HOUSE(chart, 1).figure, // representative reference figure only — see Method 1
    };
  },
  evaluate: (_calc, chart) => {
    const { found } = CHECK_ELEMENT_ADJACENT_REPETITION(chart, 'water');
    return found
      ? { outcome: 'favourable', label: 'Two adjacent water houses', interpretation: 'It talks about rain.' }
      : { outcome: 'uncertain', label: 'No two adjacent water houses', interpretation: 'The source only defines the "adjacent water stars" trigger — this is not addressed.' };
  },
};

export const willItRainQuestion: QuestionDefinition = {
  id: 'if-it-will-rain-today-or-not',
  title: 'Will it rain today?',
  categoryId: 'fate-timing',
  chapterId: CHAPTER_ID,
  methods: [method1, method2, method3, method4],
};
