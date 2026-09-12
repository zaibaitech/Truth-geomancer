// Source: Kanzul Mikban, Chapter 87 — "When Your Suffering and Pain or
// Sadness Will End" (id "when-your-suffering-and-pain-or-sadness-will").
// One method, full good/middle-good/bad coverage. resultKind 'outcome':
// clearly evaluative.

import { ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'when-your-suffering-and-pain-or-sadness-will';

const method1: MethodDefinition = {
  id: 'suffering-will-end-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h6 and h12 and add them. If it's a good star, it will end early. If it's a middle-good star, it will end but take a long time. If it's a bad star, pray hard — it will be difficult to have it taken away in your life. You have to do a lot of sacrifices and supplications.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [6, 12]);
    return { housesUsed: [6, 12], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good star', interpretation: 'It will end early.' };
    if (fortune === 'middleGood') return { outcome: 'mixed', label: 'Middle-good star', interpretation: 'It will end, but take a long time.' };
    return {
      outcome: 'unfavourable',
      label: 'Bad star',
      interpretation: 'Pray hard — it will be difficult to have it taken away in your life. A lot of sacrifices and supplications are needed.',
    };
  },
};

export const sufferingWillEndQuestion: QuestionDefinition = {
  id: 'when-your-suffering-and-pain-or-sadness-will',
  title: 'When will my suffering end?',
  categoryId: 'health-hardships',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
