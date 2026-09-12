// Source: Kanzul Mikban, Chapter 144 — "If You Will Get Your Debts,
// Deposit, or Savings Back" (id "if-you-will-get-your-debts-deposit-or").
// One method (H1+H7+H2+H8, via ADD_MULTIPLE_HOUSES), three fortune
// branches, but the "good" branch carries an EXTRA stated condition the
// other two don't: "a good star AND repeats in the chart itself" — good
// fortune alone isn't enough per the source's own wording, so a good result
// that does NOT repeat anywhere in the chart is left uncertain rather than
// assumed favourable (the source never says what a good-but-not-repeating
// result means). "Repeats in the chart" is checked across the full 16
// houses, same as chapters 124/137's identical "found in the chart" idiom
// — the summed figure isn't equal to any one of its own 4 source houses by
// construction, so no self-exclusion is needed here either. Middle-good is
// fully addressed ("it will take a longer time") — resultKind 'outcome',
// explicitly framed as personal benefit/harm.

import { ADD_MULTIPLE_HOUSES, CHECK_FIGURE_PRESENT_IN_CHART } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-will-get-your-debts-deposit-or';

const method1: MethodDefinition = {
  id: 'debts-deposit-back-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h1 and h7, then h2 and h8, and add them all. If it's a good star and repeats in the chart itself, they will pay you, or you will get the money back. If it's a bad star, they won't pay you, and you won't get the money back. If it's a middle-good star, it will take a longer time before you get it.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 7, 2, 8]);
    return { housesUsed: [1, 2, 7, 8], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'bad') {
      return { outcome: 'unfavourable', label: 'Bad', interpretation: "They won't pay you, and you won't get the money back." };
    }
    if (fortune === 'middleGood') {
      return { outcome: 'mixed', label: 'Middle-good', interpretation: 'It will take a longer time before you get it.' };
    }
    if (fortune === 'good') {
      const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern);
      if (found) {
        return { outcome: 'favourable', label: 'Good and repeats in the chart', interpretation: 'They will pay you, or you will get the money back.' };
      }
      return { outcome: 'uncertain', label: 'Good but does not repeat', interpretation: 'The source only defines a good star that also repeats in the chart — this good result does not repeat anywhere.' };
    }
    return { outcome: 'uncertain', label: 'Unrecognized fortune value', interpretation: 'This chart state is not addressed.' };
  },
};

export const debtsDepositBackQuestion: QuestionDefinition = {
  id: 'if-you-will-get-your-debts-deposit-or',
  title: 'Will I get my debts, deposit, or savings back?',
  categoryId: 'money-possessions',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
