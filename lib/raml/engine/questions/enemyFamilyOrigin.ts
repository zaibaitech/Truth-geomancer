// Source: Kanzul Mikban, Chapter 84 — "If Your Enemy Is from Your Father's,
// Mother's, Wife's, Boyfriend's/Girlfriend's, or Your Friend's Family" (id
// "if-your-enemy-is-from-your-father-s"). Three independent positive-
// trigger checks (h3/h4/h5 each independently bad -> a specific
// attribution; the source never states what a good/middle-good result at
// any of the three means, so those cases are left uncertain — same
// "positive-trigger-only" pattern already used throughout this project,
// e.g. partnerDisease.ts). resultKind is 'descriptive': naming WHERE an
// enmity comes from is a factual attribution, not itself a
// favourable/unfavourable judgment.

import { CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-your-enemy-is-from-your-father-s';

function positiveTriggerMethod(
  id: string,
  methodLabel: string,
  house: number,
  verdictLabel: string,
  descriptiveAnswer: string,
  interpretation: string,
): MethodDefinition {
  return {
    id,
    label: methodLabel,
    status: 'verified',
    source: {
      book: 'kanzul-mikban',
      chapterId: CHAPTER_ID,
      quote:
        "After drawing the chart, check h3, h4, and h5. If h3 is a bad star, the enmity is from a love relationship, a wife or husband, or close friends. If h4 is a bad star, the enmity is from your father's family. If h5 is a bad star, the enmity is from your mother's family.",
    },
    calculate: (chart) => {
      const { figure, trace } = CHECK_HOUSE(chart, house);
      return { housesUsed: [house], steps: [trace.description], resultFigure: figure };
    },
    evaluate: (calc) => {
      const isBad = calc.resultFigure.qualities.fortune.value === 'bad';
      return isBad
        ? { outcome: 'descriptive', label: verdictLabel, interpretation, descriptiveAnswer }
        : { outcome: 'uncertain', label: `Not bad at H${house}`, interpretation: 'This method only addresses a bad star at this house — this is not addressed.' };
    },
  };
}

const method1 = positiveTriggerMethod(
  'enemy-family-origin-method-1',
  'Method 1',
  3,
  'Love relationship / spouse / close friends',
  'love-relationship-or-friends',
  'The enmity is from a love relationship, a wife or husband, or close friends.',
);

const method2 = positiveTriggerMethod(
  'enemy-family-origin-method-2',
  'Method 2',
  4,
  "Father's family",
  'fathers-family',
  "The enmity is from your father's family.",
);

const method3 = positiveTriggerMethod(
  'enemy-family-origin-method-3',
  'Method 3',
  5,
  "Mother's family",
  'mothers-family',
  "The enmity is from your mother's family.",
);

export const enemyFamilyOriginQuestion: QuestionDefinition = {
  id: 'if-your-enemy-is-from-your-father-s',
  title: 'Is my enemy from my family, or someone close to me?',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1, method2, method3],
};
