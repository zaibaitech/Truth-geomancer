// Source: Kanzul Mikban, Chapter 19 — "If You Will Win a Case in Court,
// Chief Palace, a Fight, or War" (content/manuscripts/kanzul-mikban.ts, id
// "if-you-will-win-a-case-in-court"). A separate, shorter chapter 5
// ("if-you-will-win-a-fight-war-or") covers the same question but both of
// its branches depend on named figures the transcription marked
// "[figures omitted]" — not usable here, so it isn't included as a method.

import { ADD_FIGURE_TO_HOUSE, ADD_MULTIPLE_HOUSES, CHECK_FIGURE_PRESENT_IN_CHART, MATCH_FIGURE } from '../operations';
import type { MethodDefinition, MethodOutcome, QuestionDefinition } from '../types';
import { CH19_M3_LIST, idsOf } from '../kanzulFinalEditionFigures';

const CHAPTER_ID = 'if-you-will-win-a-case-in-court';

function fortuneVerdict(
  fortune: 'good' | 'middleGood' | 'bad' | null,
  labels: { good: string; middleGood: string; bad: string },
): { outcome: MethodOutcome; label: string; interpretation: string } {
  if (fortune === 'good') return { outcome: 'favourable', label: 'Good', interpretation: labels.good };
  if (fortune === 'bad') return { outcome: 'unfavourable', label: 'Bad', interpretation: labels.bad };
  if (fortune === 'middleGood') return { outcome: 'mixed', label: 'Middle-good', interpretation: labels.middleGood };
  return { outcome: 'uncertain', label: 'No fortune reading', interpretation: 'This result has no computable good/bad reading.' };
}

const method1: MethodDefinition = {
  id: 'court-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, pick h1, h5, h9 and h14 and add them. If you get a good star, you will win the case. If it's middle-good star, the case will keep long in court and you may win it with prayers. If it's a bad star, you will lose.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 5, 9, 14]);
    return { housesUsed: [1, 5, 9, 14], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) =>
    fortuneVerdict(calc.resultFigure.qualities.fortune.value, {
      good: 'You will win the case.',
      middleGood: 'The case will keep long in court; you may win it with prayers.',
      bad: 'You will lose.',
    }),
};

const method2: MethodDefinition = {
  id: 'court-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Pick h8, h11, h7 and h16 and add them. Add the results to h1 and check if it's a good star — you will win the case; if it's not, you will lose it. If it's a middle-good star, you may win it with serious prayers.",
  },
  calculate: (chart) => {
    const step1 = ADD_MULTIPLE_HOUSES(chart, [8, 11, 7, 16]);
    const step2 = ADD_FIGURE_TO_HOUSE(chart, step1.figure, 1);
    return { housesUsed: [8, 11, 7, 16, 1], steps: [step1.trace.description, step2.trace.description], resultFigure: step2.figure };
  },
  evaluate: (calc) =>
    fortuneVerdict(calc.resultFigure.qualities.fortune.value, {
      good: 'You will win the case.',
      middleGood: 'You may win it with serious prayers.',
      bad: 'You will lose it.',
    }),
};

// Method 3 checks whether specific named figures land in h4+h10 versus
// h5+h11 — those figures were transcribed as "[figures omitted]".
const method3: MethodDefinition = {
  id: 'court-method-3',
  label: 'Method 3',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'Pick h4, h5, h10 and h11 and add them. If you get: Mahadi, Umar, Adam, Musah, in h4 and h10, you will win the case. But if they are found in h5 and h11, you will lose the case.',
  },
  // The result of the sum is the figure looked for. It must be one of the four
  // listed figures AND be found in h4/h10 (win) or in h5/h11 (lose). If it is
  // found in both pairs, the source states no precedence, so nothing is read.
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [4, 5, 10, 11]);
    return { housesUsed: [4, 5, 10, 11], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    if (!idsOf(CH19_M3_LIST).some((id) => MATCH_FIGURE(calc.resultFigure, id))) {
      return { outcome: 'uncertain', label: `${calc.resultFigure.figureName} (not a listed figure)`, interpretation: 'The source lists four figures for this method — this result is not among them.' };
    }
    const inWin = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern, [4, 10]).found;
    const inLose = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern, [5, 11]).found;
    if (inWin && !inLose) return { outcome: 'favourable', label: `${calc.resultFigure.figureName} found in h4/h10`, interpretation: 'You will win the case.' };
    if (inLose && !inWin) return { outcome: 'unfavourable', label: `${calc.resultFigure.figureName} found in h5/h11`, interpretation: 'You will lose the case.' };
    return {
      outcome: 'uncertain',
      label: `${calc.resultFigure.figureName} ${inWin && inLose ? 'found in both pairs' : 'not found in h4/h5/h10/h11'}`,
      interpretation: inWin && inLose ? 'The source gives no precedence when the figure is found in both pairs of houses.' : 'The figure is not found in any of the houses the source names.',
    };
  },
};

const method4: MethodDefinition = {
  id: 'court-method-4',
  label: 'Method 4',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Pick h8, h1, h9 and h11 and add them. If you get a good and upward star, you will win the case and even get money out of it. If it's a good and downward star, you will win the case without money. If it's a bad star, you will lose the case.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [8, 1, 9, 11]);
    return { housesUsed: [8, 1, 9, 11], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const { fortune, direction } = calc.resultFigure.qualities;
    if (fortune.value === 'bad') {
      return { outcome: 'unfavourable', label: 'Bad', interpretation: 'You will lose the case.' };
    }
    if (fortune.value === 'good' && direction.value === 'upward') {
      return { outcome: 'favourable', label: 'Good and upward', interpretation: 'You will win the case and even get money out of it.' };
    }
    if (fortune.value === 'good' && direction.value === 'downward') {
      return { outcome: 'favourable', label: 'Good and downward', interpretation: 'You will win the case, without money.' };
    }
    return {
      outcome: 'uncertain',
      label: 'Combination not addressed',
      interpretation: "This method only covers good+upward, good+downward, and bad results — this chart's result falls outside all three.",
    };
  },
};

export const courtCaseQuestion: QuestionDefinition = {
  id: 'if-you-will-win-a-case-in-court',
  title: 'Will I win a fight, war, or court case?',
  categoryId: 'legal-conflict',
  chapterId: CHAPTER_ID,
  methods: [method1, method2, method3, method4],
};
