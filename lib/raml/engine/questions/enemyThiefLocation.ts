// Source: Kanzul Mikban, Chapter 6 — "If You Want to Know Where Your Enemy
// or a Thief Is Hidden" (id "if-you-want-to-know-where-your-enemy"). The
// only method decides the verdict by named figures in H4/H10 that the
// transcription marked "[figures omitted]"; Prompt 58 restored them from the
// manuscript scan (see ../kanzulRestoredFigures.ts). Only the positive trigger
// is stated, so a non-matching figure stays uncertain.

import { CHECK_HOUSE, MATCH_FIGURE } from '../operations';
import { CH6_H4_H10_OPEN_LAND, starIdsOf } from '../kanzulRestoredFigures';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-want-to-know-where-your-enemy';

const method1: MethodDefinition = {
  id: 'enemy-location-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'After drawing the chart, check h4 and h10. If you see any of the stars below in any of the houses, it means you will see or get him/her in an opened land or desert: Musah, Adam, Iddris, Ayuba',
  },
  calculate: (chart) => {
    const h4 = CHECK_HOUSE(chart, 4);
    const h10 = CHECK_HOUSE(chart, 10);
    // "any of the stars below in any of the houses": either house triggers it.
    const listed = starIdsOf(CH6_H4_H10_OPEN_LAND);
    const hit = [h4, h10].find((h) => listed.includes(h.figure.figureId));
    return { housesUsed: [4, 10], steps: [h4.trace.description, h10.trace.description], resultFigure: (hit ?? h4).figure };
  },
  evaluate: (calc) =>
    starIdsOf(CH6_H4_H10_OPEN_LAND).some((id) => MATCH_FIGURE(calc.resultFigure, id))
      ? { outcome: 'descriptive', label: `${calc.resultFigure.figureName} at H${calc.resultFigure.sourceHouses[0]}`, interpretation: 'You will see or get him/her in an opened land or desert.', descriptiveAnswer: 'open-land-or-desert' }
      : { outcome: 'uncertain', label: 'No listed figure at H4 or H10', interpretation: 'The source only lists the open-land/desert figures for H4/H10 — no stated reading for any other figure.' },
};

export const enemyThiefLocationQuestion: QuestionDefinition = {
  id: 'if-you-want-to-know-where-your-enemy',
  title: 'Where is my enemy or a thief hiding?',
  categoryId: 'legal-conflict',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
