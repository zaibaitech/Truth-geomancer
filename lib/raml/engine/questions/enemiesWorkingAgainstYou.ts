// Source: Kanzul Mikban, Chapter 34 — "If Your Enemies Are Working Against
// You or Not" (id "if-your-enemies-are-working-against-you-or"). Two
// methods. Method 1 uses the RECAST_FROM_HOUSES primitive — a known
// classical technique of treating 4 of the current chart's houses as fresh
// Mothers and deriving a whole new chart from them.

import { ADD_MULTIPLE_HOUSES, CHECK_LINE_STATE, RECAST_FROM_HOUSES } from '../operations';
import type { CastingRequirement, MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-your-enemies-are-working-against-you-or';

/** Presentation metadata only (Prompt 72). Does not change calculate()/evaluate().
 * Recast is application-derived from the original chart's own H3/H7/H11/H15 —
 * never a second user-generated cast (see castingRequirement.ts's own doc
 * comment). `then` is the NEW chart's H13, not original-chart H13. */
const ENEMIES_M1_CASTING: CastingRequirement = {
  userGenerates: { kind: 'four_mothers' },
  inspects: {
    kind: 'recast',
    motherHouses: [3, 7, 11, 15],
    then: { kind: 'named_houses', houses: [13] },
  },
  appDerives: { kind: 'recast_shield', motherHouses: [3, 7, 11, 15] },
  display: { kind: 'recast_working' },
  evidence: 'source_explicit',
};

const ENEMIES_M2_CASTING: CastingRequirement = {
  userGenerates: { kind: 'four_mothers' },
  inspects: { kind: 'named_houses', houses: [1, 12] },
  appDerives: { kind: 'named_houses', houses: [1, 12] },
  display: { kind: 'named_houses', houses: [1, 12] },
  evidence: 'source_explicit',
};

const method1: MethodDefinition = {
  id: 'enemies-working-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, pick h3, h7, h11 and h15 and use them to form new Umuhat (mother houses), and cancel the old chart. Use the Umuhat to form another chart, and check h13 of the new chart you have drawn. Check the water element of h13 — if it's opened (single dot) or closed (double dot). If it's a single dot, they are not working on you, or they are, but it's not working on you because you are spiritually active. But if it's double dots, they are seriously working on you to destroy you.",
  },
  castingRequirement: ENEMIES_M1_CASTING,
  calculate: (chart) => {
    const { chart: newChart, trace } = RECAST_FROM_HOUSES(chart, [3, 7, 11, 15]);
    const newH13 = newChart.houses[12];
    const resultFigure = {
      figureId: newH13.figureId,
      figureName: newH13.figureName,
      classicalName: newH13.classicalName,
      dotPattern: newH13.dotPattern,
      element: newH13.element,
      qualities: newH13.qualities,
      sourceHouses: [3, 7, 11, 15],
    };
    return {
      housesUsed: [3, 7, 11, 15],
      steps: [trace.description, `New chart's H13 = ${newH13.figureName}`],
      resultFigure,
    };
  },
  evaluate: (calc) => {
    const opened = CHECK_LINE_STATE(calc.resultFigure, 'water') === 'opened';
    return opened
      ? { outcome: 'favourable', label: 'New H13, water line opened', interpretation: "They are not working on you, or if they are, it's not affecting you because you are spiritually active." }
      : { outcome: 'unfavourable', label: 'New H13, water line closed', interpretation: 'They are seriously working on you to destroy you.' };
  },
};

const method2: MethodDefinition = {
  id: 'enemies-working-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "After casting the chart, pick h1 and h12 and add them. If it is a good star, they are not working on you; but if it's a bad star, they are working on you seriously.",
  },
  castingRequirement: ENEMIES_M2_CASTING,
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 12]);
    return { housesUsed: [1, 12], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good star', interpretation: 'They are not working on you.' };
    if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad star', interpretation: 'They are working on you seriously.' };
    return { outcome: 'uncertain', label: 'Middle-good star', interpretation: 'This method only addresses clearly good or bad results.' };
  },
};

export const enemiesWorkingAgainstYouQuestion: QuestionDefinition = {
  id: 'if-your-enemies-are-working-against-you-or',
  title: 'Are my enemies working against me?',
  categoryId: 'legal-conflict',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
