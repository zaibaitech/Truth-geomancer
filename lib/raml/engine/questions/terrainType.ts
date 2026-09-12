// Source: Kanzul Mikban, Chapter 23 — "Is There Much Trees, Water, Sand, or
// Stones in the Area You Are Going To" (id
// "is-there-much-trees-water-sand-or-stones"). One method, fully
// mechanical — but it answers a DESCRIPTIVE question (which terrain type)
// rather than a favourable/unfavourable one. The engine's MethodOutcome
// vocabulary (favourable/unfavourable/mixed) has no honest way to represent
// "the answer is water" — asserting any of those would mischaracterize
// what the source actually says. The calculation is real and shown in full;
// status is `needs_review` for this architectural reason, not because
// anything is missing or ambiguous in the source itself.

import { ADD_MULTIPLE_HOUSES, CHECK_ELEMENT } from '../operations';
import type { Element } from '@/content/stars';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'is-there-much-trees-water-sand-or-stones';

const TERRAIN_LABEL: Record<Element, string> = {
  fire: 'much stones',
  air: 'much trees',
  water: 'much water',
  sand: 'much sand',
};

const method1: MethodDefinition = {
  id: 'terrain-method-1',
  label: 'Method 1',
  status: 'needs_review',
  reviewNote:
    'This method answers a descriptive question (which terrain type the resulting element indicates) rather than a favourable/unfavourable one. The current engine has no MethodOutcome for a purely descriptive result, so no verdict is asserted — the calculation itself is fully computed and shown below.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h1, h7, h4 and h8 and add them. If it's fire star, the area has much stones. If it's an air star, the area has much trees. If it's water star, the area has much water. If it's sand star, the area has much sand.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 7, 4, 8]);
    return { housesUsed: [1, 7, 4, 8], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const { element } = CHECK_ELEMENT(calc.resultFigure);
    return { outcome: 'uncertain', label: `${element} figure`, interpretation: `The area has ${TERRAIN_LABEL[element]}.` };
  },
};

export const terrainTypeQuestion: QuestionDefinition = {
  id: 'is-there-much-trees-water-sand-or-stones',
  title: 'Is there much trees, water, sand, or stones where I am going?',
  categoryId: 'travel-change',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
