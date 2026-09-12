// Source: Kanzul Mikban, Chapter 88 — "If You Will Get a Position/Rank or
// Not" (id "if-you-will-get-a-position-rank-or"). One method: count the
// opened (single-dot) lines across a specific 7-house set, subtract 12
// ONCE (not the repeated "12, 12" reduction chapter 89's own, otherwise
// near-identical, passage uses two paragraphs later — a real, deliberate
// textual difference preserved exactly, not smoothed into the same
// mechanic), and look up the resulting NUMBER as a HOUSE in the user's
// own chart ("check which house corresponds to what's left" — the
// worked examples, "if your answer is 3, it means Mahadi," just
// illustrate the source's own example chart, not a fixed lookup table).
// Then read that house's fortune.

import { CHECK_HOUSE, COUNT_OPENED_LINES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-will-get-a-position-rank-or';
const HOUSES = [1, 2, 4, 5, 10, 11, 15];

const method1: MethodDefinition = {
  id: 'position-or-rank-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, count all the single dots of h1, h2, h4, h5, h10, h11, and h15, and subtract 12 from it. Check which house corresponds to what's left — for example, if your answer is 3, it means Mahadi; if your answer is 7, it means Umar. Then check the star — if it's good, bad, or middle-good. If it's a good star, you will get it early and easier. If it's middle-good, you will get it but it will take a longer time. If it's a bad star, it will be difficult to get it.",
  },
  calculate: (chart) => {
    const { count, trace } = COUNT_OPENED_LINES(chart, HOUSES);
    const resultNumber = count - 12;
    const steps = [trace.description, `Subtract 12: ${count} - 12 = ${resultNumber}`];
    if (resultNumber >= 1 && resultNumber <= 16) {
      const { figure, trace: houseTrace } = CHECK_HOUSE(chart, resultNumber);
      steps.push(houseTrace.description);
      return { housesUsed: [resultNumber], steps, resultFigure: figure };
    }
    steps.push(`${resultNumber} is not a valid house number (1-16)`);
    return { housesUsed: [], steps, resultFigure: CHECK_HOUSE(chart, 1).figure };
  },
  evaluate: (calc, chart) => {
    const { count } = COUNT_OPENED_LINES(chart, HOUSES);
    const resultNumber = count - 12;
    if (resultNumber < 1 || resultNumber > 16) {
      return { outcome: 'uncertain', label: 'Out of range', interpretation: `${count} - 12 = ${resultNumber}, which is not a valid house (1-16) — the source does not address this case.` };
    }
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: `H${resultNumber}, good star`, interpretation: 'You will get it early and easier.' };
    if (fortune === 'middleGood') return { outcome: 'mixed', label: `H${resultNumber}, middle-good star`, interpretation: 'You will get it, but it will take a longer time.' };
    return { outcome: 'unfavourable', label: `H${resultNumber}, bad star`, interpretation: 'It will be difficult to get it.' };
  },
};

export const positionOrRankQuestion: QuestionDefinition = {
  id: 'if-you-will-get-a-position-rank-or',
  title: 'Will I get this position or rank?',
  categoryId: 'work-success',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
