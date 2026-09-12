// Source: Kanzul Mikban, Chapter 23 — "Is There Much Trees, Water, Sand, or
// Stones in the Area You Are Going To" (id
// "is-there-much-trees-water-sand-or-stones"). One method, fully
// mechanical — a real, verified answer, just a DESCRIPTIVE one (which
// terrain type) rather than a favourable/unfavourable verdict. Prompt 4.5
// introduced `outcome: 'descriptive'` for exactly this shape, so this
// question is `status: 'verified'` like any other fully-computable method —
// the earlier `needs_review` workaround was an architectural gap, not a
// real source-verification issue, and has been removed now that the engine
// can represent this kind of result honestly.

import { ADD_MULTIPLE_HOUSES, CHECK_ELEMENT } from '../operations';
import type { Element } from '@/content/stars';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'is-there-much-trees-water-sand-or-stones';

const TERRAIN_LABEL: Record<Element, string> = {
  fire: 'Much stones',
  air: 'Much trees',
  water: 'Much water',
  sand: 'Much sand',
};

const method1: MethodDefinition = {
  id: 'terrain-method-1',
  label: 'Method 1',
  status: 'verified',
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
    return {
      outcome: 'descriptive',
      label: TERRAIN_LABEL[element],
      interpretation: `The area has ${TERRAIN_LABEL[element].toLowerCase()}.`,
      descriptiveAnswer: element,
    };
  },
};

export const terrainTypeQuestion: QuestionDefinition = {
  id: 'is-there-much-trees-water-sand-or-stones',
  title: 'Is there much trees, water, sand, or stones where I am going?',
  categoryId: 'travel-change',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
