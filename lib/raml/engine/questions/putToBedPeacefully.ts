// Source: Kanzul Mikban, Chapter 81 — "If She Will Put to Bed Peacefully or
// Not" (id "if-she-will-put-to-bed-peacefully-or"). One method, full
// good/middle-good/bad coverage. resultKind is 'outcome': the source
// explicitly frames this as a safety concern (bleeding, operations,
// deaths, vs. a peaceful delivery), not a neutral fact.

import { CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-she-will-put-to-bed-peacefully-or';

const method1: MethodDefinition = {
  id: 'put-to-bed-peacefully-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, check h5. If it's a good star, she will put to bed peacefully. But if it's a middle-good star, she will have a peaceful delivery, but it takes a longer time. If it's a bad star, it leads to a lot of complications, like too much bleeding or loss of blood, operations, deaths, etc.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 5);
    return { housesUsed: [5], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') {
      return { outcome: 'favourable', label: 'Good star', interpretation: 'She will put to bed peacefully.' };
    }
    if (fortune === 'middleGood') {
      return { outcome: 'mixed', label: 'Middle-good star', interpretation: 'She will have a peaceful delivery, but it takes a longer time.' };
    }
    return {
      outcome: 'unfavourable',
      label: 'Bad star',
      interpretation: 'It leads to a lot of complications, like too much bleeding or loss of blood, operations, or worse.',
    };
  },
};

export const putToBedPeacefullyQuestion: QuestionDefinition = {
  id: 'if-she-will-put-to-bed-peacefully-or',
  title: 'Will she put to bed peacefully?',
  categoryId: 'family-loved-ones',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
