// Source: Kanzul Mikban, Chapter 48 — "If It's a Male or Female Child" (id
// "if-it-s-a-male-or-female-child"), Methods 1-2, PLUS Chapter 56 — "About
// a Pregnancy, If It's a Boy or a Girl" (id "about-a-pregnancy-if-it-s-a-boy"),
// Method 1 — the SAME underlying question asked and answered a second time
// later in the manuscript. Registered together under Chapter 48's id
// (content/intentions.ts already reuses the same id for both, per
// instruction #10: check for duplicate/overlapping questions before adding
// a new one) rather than as two separate, overlapping intentions.
//
// Chapter 48's own two methods both hinge on classifying a figure as a
// "male star" or "female star" directly — this specific chapter never
// defines which figures are male/female (unlike chapter 31, which
// explicitly redefines gender via element for its own rule), and this
// project's general figure-gender axis is intentionally left unsourced
// project-wide (see FigureQualities.gender in types.ts). Both are withheld
// rather than guessed. Chapter 56's method needs no such classification —
// it is pure whole-chart dot arithmetic — and is the only verified method
// here.
//
// resultKind is 'descriptive': the child's sex is a factual answer, not a
// favourable/unfavourable value judgment.

import { CAST_OUT_BY, COUNT_TOTAL_DOTS, CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-it-s-a-male-or-female-child';
const CHAPTER_56_ID = 'about-a-pregnancy-if-it-s-a-boy';

const method1: MethodDefinition = {
  id: 'child-gender-method-1',
  label: 'Method 1',
  status: 'needs_review',
  reviewNote:
    'Hinges on classifying H1 as a "male star" or "female star" — this chapter never defines which figures are male vs. female, and this project\'s general figure-gender axis is intentionally left unsourced project-wide (see FigureQualities.gender in types.ts). Withheld rather than guessed.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "After drawing the chart, check h1. If it's a male star or female star, then that's it.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 1);
    return { housesUsed: [1], steps: [trace.description], resultFigure: figure };
  },
  evaluate: () => ({
    outcome: 'uncertain',
    label: 'Star gender not defined',
    interpretation: 'This method cannot currently be verified — see the review note.',
  }),
};

const method2: MethodDefinition = {
  id: 'child-gender-method-2',
  label: 'Method 2',
  status: 'needs_review',
  reviewNote:
    'Same unsourced-gender gap as Method 1, applied to H10 and H11 needing to match each other.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "Check h10 and h11. If both houses are male stars, then it's a male; and if they are female stars too, it's female.",
  },
  calculate: (chart) => {
    const h10 = CHECK_HOUSE(chart, 10);
    const h11 = CHECK_HOUSE(chart, 11);
    return { housesUsed: [10, 11], steps: [h10.trace.description, h11.trace.description], resultFigure: h11.figure };
  },
  evaluate: () => ({
    outcome: 'uncertain',
    label: 'Star gender not defined',
    interpretation: 'This method cannot currently be verified — see the review note.',
  }),
};

const method3: MethodDefinition = {
  id: 'child-gender-method-3',
  label: 'Method 3',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_56_ID,
    quote:
      "After casting the chart, count all the dots in the chart, and start subtracting (3, 3, 3). If your result is 1 or 3, it means it's a male child; but if it's 2, it's a female child.",
  },
  calculate: (chart) => {
    const { total, trace } = COUNT_TOTAL_DOTS(chart);
    const reduced = CAST_OUT_BY(total, 3);
    const judge = CHECK_HOUSE(chart, 15).figure; // representative reference figure only — see goodToStayInTown.ts's Method 2
    return { housesUsed: [], steps: [trace.description, `Cast out by 3s: ${total} -> ${reduced}`], resultFigure: judge };
  },
  evaluate: (_calc, chart) => {
    const { total } = COUNT_TOTAL_DOTS(chart);
    const reduced = CAST_OUT_BY(total, 3);
    if (reduced === 1 || reduced === 3) {
      return { outcome: 'descriptive', label: 'Male', interpretation: `Total dots ${total}, cast out by 3s = ${reduced} — it's a male child.`, descriptiveAnswer: 'male' };
    }
    return { outcome: 'descriptive', label: 'Female', interpretation: `Total dots ${total}, cast out by 3s = ${reduced} — it's a female child.`, descriptiveAnswer: 'female' };
  },
};

export const childGenderQuestion: QuestionDefinition = {
  id: 'if-it-s-a-male-or-female-child',
  title: 'Will it be a male or female child?',
  categoryId: 'family-loved-ones',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1, method2, method3],
};
