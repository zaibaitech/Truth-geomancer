// Source: Kanzul Mikban, Chapter 102 — "If This Money, the Work, or the
// Lady/Husband Will Be Stable in Your Life" (id
// "if-this-money-the-work-or-the-lady"). One method: recast the first 4
// houses as fresh Mothers (the same RECAST_FROM_HOUSES technique chapter
// 34 already uses), then check the new chart's own first 4 houses against
// a named list of trigger figures — the list itself was never
// transcribed. The recast is shown; the trigger list is not.

import { RECAST_FROM_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-this-money-the-work-or-the-lady';

const method1: MethodDefinition = {
  id: 'money-work-lady-stable-method-1',
  label: 'Method 1',
  status: 'uncertain',
  reviewNote:
    "The chapter names a trigger-figure list to check against the recast chart's own first 4 houses, but the list itself (\"[figures omitted — symbols not preserved in this transcription]\") was never transcribed.",
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick the first 4 houses and use them as your Umuhat (mother stars), and form another chart, cancelling the old one. Check the first 4 houses of the new chart — if any of these stars below are found in any of them, it will be stable; but if not, it will not be stable in your life: [figures omitted — symbols not preserved in this transcription]",
  },
  calculate: (chart) => {
    const { chart: newChart, trace } = RECAST_FROM_HOUSES(chart, [1, 2, 3, 4]);
    const newH1 = newChart.houses[0];
    const resultFigure = {
      figureId: newH1.figureId,
      figureName: newH1.figureName,
      classicalName: newH1.classicalName,
      dotPattern: newH1.dotPattern,
      element: newH1.element,
      qualities: newH1.qualities,
      sourceHouses: [1, 2, 3, 4],
    };
    return { housesUsed: [1, 2, 3, 4], steps: [trace.description, 'Trigger-figure list omitted from the transcription.'], resultFigure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Trigger figures omitted', interpretation: "This chapter's trigger-figure list was not preserved in this transcription." }),
};

export const moneyWorkLadyStableQuestion: QuestionDefinition = {
  id: 'if-this-money-the-work-or-the-lady',
  title: 'Will this money, work, or relationship be stable?',
  categoryId: 'money-possessions',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
