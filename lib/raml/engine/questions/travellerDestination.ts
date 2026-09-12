// Source: Kanzul Mikban, Chapter 134 — "Where a Traveller Has Travelled To"
// (id "where-a-traveller-has-travelled-to"). One method: sum h1+h7+h15
// (ADD_MULTIPLE_HOUSES handles any number of houses, so a 3-way sum needs no
// new operation), then check which quarter of the chart the result is found
// in — a direct fit for the existing FIND_FIGURE_QUARTER operation
// (chapters 31/35/55 precedent), with this chapter's OWN quarter->direction
// mapping: Umuhat (1-4) = East, Banat (5-8) = West, Hafidat (9-12) = North,
// Sumurakat (13-16) = South. This is also the mapping chapter 130 Method 2
// (thiefAmongAccused.ts) relies on implicitly — this chapter states it
// explicitly, confirming that reading. Not found in any quarter is not
// addressed — left uncertain. resultKind 'descriptive': a compass
// direction, not a favourable/unfavourable outcome.

import { ADD_MULTIPLE_HOUSES, FIND_FIGURE_QUARTER } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'where-a-traveller-has-travelled-to';

const method1: MethodDefinition = {
  id: 'traveller-destination-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'After casting the chart, pick h1 and h7 and add them to h15. If the star is found in the first 4 houses (Umuhat), it means he/she has gone to the East side. If it is found in the second 4 houses (Banat), it means he/she has gone to the West side. If it is found in the third 4 houses (Hafidat), it means he/she has gone to the North side. And if it is found in the last 4 houses (Sumurakat), it means he/she has gone to the South side.',
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 7, 15]);
    return { housesUsed: [1, 7, 15], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const { quarter } = FIND_FIGURE_QUARTER(chart, calc.resultFigure.dotPattern);
    const labels: Record<string, { label: string; answer: string }> = {
      mothers: { label: 'East', answer: 'east' },
      daughters: { label: 'West', answer: 'west' },
      nieces: { label: 'North', answer: 'north' },
      witnesses: { label: 'South', answer: 'south' },
    };
    if (quarter && labels[quarter]) {
      const { label, answer } = labels[quarter];
      return { outcome: 'descriptive', label, interpretation: `He/she has gone to the ${label} side.`, descriptiveAnswer: answer };
    }
    return { outcome: 'uncertain', label: 'Not found in any quarter', interpretation: "The source assumes the result is found in one of the chart's own four quarters — this chart's result is not." };
  },
};

export const travellerDestinationQuestion: QuestionDefinition = {
  id: 'where-a-traveller-has-travelled-to',
  title: 'Where has the traveller gone?',
  categoryId: 'travel-change',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
