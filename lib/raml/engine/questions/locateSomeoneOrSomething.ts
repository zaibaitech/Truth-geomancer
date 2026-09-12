// Source: Kanzul Mikban, Chapter 36 — "If You Want to Locate Someone or
// Something" (id "if-you-want-to-locate-someone-or-something"). One
// method — a real, verified answer (a compass direction), descriptive
// rather than favourable/unfavourable. See terrainType.ts: `status:
// 'verified'` with `outcome: 'descriptive'` (Prompt 4.5). Method 2 ("make
// just one star and use it") is still too vague to implement as its own
// distinct rule — it never says which single star, or how — so it remains
// unregistered rather than guessed.

import { EXTRACT_LINES, CHECK_ELEMENT } from '../operations';
import type { Element } from '@/content/stars';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-want-to-locate-someone-or-something';

const DIRECTION_LABEL: Record<Element, string> = {
  fire: 'Eastern',
  air: 'Western',
  water: 'Northern',
  sand: 'Southern',
};

const method1: MethodDefinition = {
  id: 'locate-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, pick h1 fire element, h2 air element, h3 water element, and h4 sand element, and form a star. If the star is fire star... it means it's in the eastern part of the place. If it's air star... western part... water star... northern part... sand star... southern part of the place you are.",
  },
  calculate: (chart) => {
    const { figure, trace } = EXTRACT_LINES(chart, [
      { house: 1, element: 'fire' },
      { house: 2, element: 'air' },
      { house: 3, element: 'water' },
      { house: 4, element: 'sand' },
    ]);
    return { housesUsed: [1, 2, 3, 4], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const { element } = CHECK_ELEMENT(calc.resultFigure);
    return {
      outcome: 'descriptive',
      label: `${DIRECTION_LABEL[element]} direction`,
      interpretation: `It's in the ${DIRECTION_LABEL[element].toLowerCase()} part of the place you are.`,
      descriptiveAnswer: element,
    };
  },
};

export const locateSomeoneOrSomethingQuestion: QuestionDefinition = {
  id: 'if-you-want-to-locate-someone-or-something',
  title: 'Where can I locate this person or thing?',
  categoryId: 'lost-stolen',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
