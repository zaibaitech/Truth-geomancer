// Source: Kanzul Mikban, Chapter 82 — "The Time She Will Put to Bed" (id
// "the-time-she-will-put-to-bed"). Two methods. Method 1 is a full,
// exhaustive element->time mapping (all 4 elements covered) — a neutral
// timing fact, resultKind 'descriptive', same reasoning as chapter 57
// ("when to travel"). Method 2's own text is cut off mid-sentence in the
// source ("...and... [text continues onto the next page, not yet
// transcribed]") immediately after naming which 4 houses to recast as
// fresh Mothers — the recast itself is shown (via the existing
// RECAST_FROM_HOUSES primitive, same technique chapter 34 Method 1
// already uses), but what to check on the resulting chart, and what it
// means, was never transcribed. Left `uncertain` — not guessed.

import { ADD_MULTIPLE_HOUSES, CHECK_ELEMENT, RECAST_FROM_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'the-time-she-will-put-to-bed';

const TIME_LABEL: Record<string, { label: string; answer: string }> = {
  fire: { label: 'Within some days', answer: 'within-days' },
  air: { label: 'Weeks', answer: 'weeks' },
  water: { label: 'A month', answer: 'a-month' },
  sand: { label: 'More than 1-2 months', answer: 'more-than-a-month' },
};

const method1: MethodDefinition = {
  id: 'time-to-put-to-bed-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, pick h1 and h5 and add them. If it's fire star, it means within some days. If it's air star, it's weeks. If it's water star, it's a month. And if it's sand star, it's more than 1 or 2 months.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 5]);
    return { housesUsed: [1, 5], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const { element } = CHECK_ELEMENT(calc.resultFigure);
    const entry = TIME_LABEL[element];
    return { outcome: 'descriptive', label: entry.label, interpretation: `It's ${entry.label.toLowerCase()}.`, descriptiveAnswer: entry.answer };
  },
};

const method2: MethodDefinition = {
  id: 'time-to-put-to-bed-method-2',
  label: 'Method 2',
  status: 'uncertain',
  reviewNote:
    "The source names which 4 houses to recast as fresh Mothers, then its own text is cut off mid-sentence (\"...and... [text continues onto the next page, not yet transcribed]\") before ever saying what to check on the resulting chart, or what it means. Only the recast itself is shown.",
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'After casting the chart, pick h1, h4, h5 and h7 and use them to form your first 4 houses (Umuhat), and... [text continues onto the next page, not yet transcribed]',
  },
  calculate: (chart) => {
    const { chart: newChart, trace } = RECAST_FROM_HOUSES(chart, [1, 4, 5, 7]);
    const newH1 = newChart.houses[0];
    const resultFigure = {
      figureId: newH1.figureId,
      figureName: newH1.figureName,
      classicalName: newH1.classicalName,
      dotPattern: newH1.dotPattern,
      element: newH1.element,
      qualities: newH1.qualities,
      sourceHouses: [1, 4, 5, 7],
    };
    return { housesUsed: [1, 4, 5, 7], steps: [trace.description, 'Source text ends here — no further check is stated.'], resultFigure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Text incomplete', interpretation: 'The source text is cut off before stating what to check next.' }),
};

export const timeToPutToBedQuestion: QuestionDefinition = {
  id: 'the-time-she-will-put-to-bed',
  title: 'How soon will she put to bed?',
  categoryId: 'family-loved-ones',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1, method2],
};
