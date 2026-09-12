// Source: Kanzul Mikban, Chapter 6 — "If You Want to Know Where Your Enemy
// or a Thief Is Hidden" (id "if-you-want-to-know-where-your-enemy"). The
// only method decides the verdict by named figures in H4/H10 that were
// transcribed as "[figures omitted]" — not computable.

import { CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-want-to-know-where-your-enemy';

const method1: MethodDefinition = {
  id: 'enemy-location-method-1',
  label: 'Method 1',
  status: 'uncertain',
  reviewReasonCode: 'figures_omitted_by_transcription',
  reviewNote:
    'Decides the verdict by named figures appearing in H4 or H10 — those figures were transcribed as "[figures omitted — symbols not preserved]" and cannot be identified.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'After drawing the chart, check h4 and h10. If you see any of the stars below in any of the houses, it means you will see or get him/her in an opened land or desert: [figures omitted — symbols not preserved in this transcription]',
  },
  calculate: (chart) => {
    const h4 = CHECK_HOUSE(chart, 4);
    const h10 = CHECK_HOUSE(chart, 10);
    return { housesUsed: [4, 10], steps: [h4.trace.description, h10.trace.description], resultFigure: h4.figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Not computable', interpretation: 'The deciding figures for H4/H10 were not transcribed from the source.' }),
};

export const enemyThiefLocationQuestion: QuestionDefinition = {
  id: 'if-you-want-to-know-where-your-enemy',
  title: 'Where is my enemy or a thief hiding?',
  categoryId: 'legal-conflict',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
