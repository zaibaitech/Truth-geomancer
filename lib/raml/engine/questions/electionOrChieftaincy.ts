// Source: Kanzul Mikban, Chapter 20 — "Who Will Win an Election or a
// Chieftaincy Title" (id "who-will-win-an-election-or-a-chieftaincy"). Two
// independent methods, same shape, different houses — kept separate since
// each can produce a different figure (and so a different verdict) on the
// same chart, exactly like the project's other "same explanation, different
// houses" pairs (e.g. chapter 1's money methods).

import { ADD_MULTIPLE_HOUSES, CHECK_FIGURE_PRESENT_IN_CHART } from '../operations';
import type { ChartModel, MethodCalculation, MethodDefinition, MethodVerdict, QuestionDefinition } from '../types';

const CHAPTER_ID = 'who-will-win-an-election-or-a-chieftaincy';

// Shared evaluation: the source's own good/bad/middle-good branches, plus a
// "not found in the chart" note layered on top (the source treats this as
// an additional fact about timing/delay, not a different verdict).
function evaluateElection(calc: MethodCalculation, chart: ChartModel): MethodVerdict {
  const { qualities, dotPattern } = calc.resultFigure;
  const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, dotPattern);
  const delayNote = found ? '' : ' This figure is not found elsewhere in the chart, which may also mean the event is delayed, or comes with some misunderstanding.';

  if (qualities.fortune.value === 'good') {
    return { outcome: 'favourable', label: 'Good star', interpretation: `The person you name first will win.${delayNote}` };
  }
  if (qualities.fortune.value === 'bad') {
    return { outcome: 'unfavourable', label: 'Bad star', interpretation: `The person you name first will not win.${delayNote}` };
  }
  return { outcome: 'mixed', label: 'Middle-good star', interpretation: `It's going to be a bracket — too close to call.${delayNote}` };
}

const method1: MethodDefinition = {
  id: 'election-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Pick h1, h5, h9 and h13 and add them. If you get a good star, he/she will win; but if it's a bad star, he/she will not. Choose the one you want to win and name him/her first. If it's a middle-good star, it's going to be a bracket [too close to call]. If it's not found in the chart, it means the election might not come on schedule, or it will be delayed due to some misunderstanding.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 5, 9, 13]);
    return { housesUsed: [1, 5, 9, 13], steps: [trace.description], resultFigure: figure };
  },
  evaluate: evaluateElection,
};

const method2: MethodDefinition = {
  id: 'election-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'You can also use h10, h12, h14 and h15 and add them — same explanation as above.',
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [10, 12, 14, 15]);
    return { housesUsed: [10, 12, 14, 15], steps: [trace.description], resultFigure: figure };
  },
  evaluate: evaluateElection,
};

export const electionOrChieftaincyQuestion: QuestionDefinition = {
  id: 'who-will-win-an-election-or-a-chieftaincy',
  title: 'Who will win an election or a chieftaincy title?',
  categoryId: 'work-success',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
