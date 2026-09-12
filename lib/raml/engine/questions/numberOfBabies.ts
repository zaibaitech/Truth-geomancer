// Source: Kanzul Mikban, Chapter 79 — "The Number of Babies in a
// Pregnancy" (id "the-number-of-babies-in-a-pregnancy"). Two independent
// methods: Method 1 is a single named-figure trigger at H10 (positive
// trigger only). Method 2 counts how many times H5's OWN figure repeats
// across the whole 16-house chart — fully computable via the existing
// COUNT_FIGURE_OCCURRENCES primitive; a count of exactly 1 (no repeat at
// all) is never addressed by the source, so it's left uncertain rather
// than assumed to mean "a single baby". resultKind is 'descriptive': a
// count/category, not a favourable/unfavourable value judgment.

import { CHECK_HOUSE, COUNT_FIGURE_OCCURRENCES, MATCH_FIGURE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'the-number-of-babies-in-a-pregnancy';

const method1: MethodDefinition = {
  id: 'number-of-babies-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "After drawing the chart, check h10. If Musah is there, it means it's more than one baby.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 10);
    return { housesUsed: [10], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const matches = MATCH_FIGURE(calc.resultFigure, 'musah');
    return matches
      ? { outcome: 'descriptive', label: 'More than one', interpretation: "It's more than one baby.", descriptiveAnswer: 'more-than-one' }
      : { outcome: 'uncertain', label: 'Not Musah at H10', interpretation: 'The source only defines the "Musah at H10" trigger — this is not addressed.' };
  },
};

const method2: MethodDefinition = {
  id: 'number-of-babies-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'Check h5; if it repeats in the chart twice, it means twins. If it repeats thrice, it means more than two. If it repeats more than 3 times, it means more than 3 babies.',
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 5);
    return { housesUsed: [5], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const { count } = COUNT_FIGURE_OCCURRENCES(chart, calc.resultFigure.dotPattern);
    if (count === 2) return { outcome: 'descriptive', label: 'Twins', interpretation: 'It means twins.', descriptiveAnswer: 'twins' };
    if (count === 3) return { outcome: 'descriptive', label: 'More than two', interpretation: 'It means more than two.', descriptiveAnswer: 'more-than-two' };
    if (count > 3) return { outcome: 'descriptive', label: 'More than three', interpretation: 'It means more than 3 babies.', descriptiveAnswer: 'more-than-three' };
    return { outcome: 'uncertain', label: `Occurs ${count} time(s)`, interpretation: 'This method only addresses 2, 3, or more than 3 occurrences — this chart falls outside all three.' };
  },
};

export const numberOfBabiesQuestion: QuestionDefinition = {
  id: 'the-number-of-babies-in-a-pregnancy',
  title: 'How many babies are in this pregnancy?',
  categoryId: 'family-loved-ones',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1, method2],
};
