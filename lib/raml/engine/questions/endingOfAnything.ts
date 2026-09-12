// Source: Kanzul Mikban, Chapter 92 — "The Ending Part of Anything You Want
// to Do in Your Life" (id "the-ending-part-of-anything-you-want-to"). One
// method: a majority check across 3 houses (h4, h14, h15) — 2 or 3 good
// means favourable, "and the vice versa" (0 or 1 good) means unfavourable.
// Full binary coverage, no gap.

import { CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'the-ending-part-of-anything-you-want-to';
const HOUSES = [4, 14, 15];

const method1: MethodDefinition = {
  id: 'ending-of-anything-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'After casting the chart, check h4, h14, and h15. If they are all good stars, or two of them are good stars, then it will be good, and the vice versa.',
  },
  calculate: (chart) => {
    const checks = HOUSES.map((n) => CHECK_HOUSE(chart, n));
    return {
      housesUsed: HOUSES,
      steps: checks.map((c) => c.trace.description),
      resultFigure: checks[2].figure,
    };
  },
  evaluate: (_calc, chart) => {
    const goodCount = HOUSES.filter((n) => CHECK_HOUSE(chart, n).figure.qualities.fortune.value === 'good').length;
    return goodCount >= 2
      ? { outcome: 'favourable', label: `${goodCount} of 3 good`, interpretation: 'It will be good.' }
      : { outcome: 'unfavourable', label: `${goodCount} of 3 good`, interpretation: 'It will not be good.' };
  },
};

export const endingOfAnythingQuestion: QuestionDefinition = {
  id: 'the-ending-part-of-anything-you-want-to',
  title: 'How will this end up?',
  categoryId: 'fate-timing',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
