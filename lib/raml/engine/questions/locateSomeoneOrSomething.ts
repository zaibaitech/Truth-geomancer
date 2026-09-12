// Source: Kanzul Mikban, Chapter 36 — "If You Want to Locate Someone or
// Something" (id "if-you-want-to-locate-someone-or-something"). One
// method — descriptive (a compass direction), not favourable/unfavourable,
// same architectural gap as chapters 23/31. Method 2 ("make just one star
// and use it") is too vague to implement as its own distinct rule — it
// never says which single star, or how — so it is not registered rather
// than guessed.

import { EXTRACT_LINES, CHECK_ELEMENT } from '../operations';
import type { Element } from '@/content/stars';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-want-to-locate-someone-or-something';

const DIRECTION_LABEL: Record<Element, string> = {
  fire: 'the eastern part of the place',
  air: 'the western part of the place',
  water: 'the northern part of the place',
  sand: 'the southern part of the place',
};

const method1: MethodDefinition = {
  id: 'locate-method-1',
  label: 'Method 1',
  status: 'needs_review',
  reviewNote:
    'This method answers a descriptive question (a compass direction) rather than a favourable/unfavourable one. The current engine has no MethodOutcome for a purely descriptive result, so no verdict is asserted — the calculation itself is fully computed and shown below.',
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
    return { outcome: 'uncertain', label: `${element} figure`, interpretation: `It's in ${DIRECTION_LABEL[element]}.` };
  },
};

export const locateSomeoneOrSomethingQuestion: QuestionDefinition = {
  id: 'if-you-want-to-locate-someone-or-something',
  title: 'Where can I locate this person or thing?',
  categoryId: 'lost-stolen',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
