// Source: Kanzul Mikban, Chapter 19 — "If You Will Win a Case in Court,
// Chief Palace, a Fight, or War" (content/manuscripts/kanzul-mikban.ts, id
// "if-you-will-win-a-case-in-court"). A separate, shorter chapter 5
// ("if-you-will-win-a-fight-war-or") covers the same question but both of
// its branches depend on named figures the transcription marked
// "[figures omitted]" — not usable here, so it isn't included as a method.

import { ADD_FIGURE_TO_HOUSE, ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, MethodOutcome, QuestionDefinition } from '../types';

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
  status: 'uncertain',
  reviewNote:
    'This method decides the verdict by which of two named figures shows up in h4/h10 versus h5/h11 — those figures were transcribed as "[figures omitted — symbols not preserved]" and cannot be identified.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Pick h4, h5, h10 and h11 and add them. If you get: [figures omitted] in h4 and h10, you will win the case. But if they are found in h5 and h11, you will lose the case.",
  },
  calculate: () => {
    throw new Error('The deciding figures for this method were not transcribed from the source.');
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Not computable', interpretation: 'This method cannot currently be verified against the source.' }),
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
