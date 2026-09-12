// Source: Kanzul Mikban, Chapter 90 — "If Someone's Misery Will Be Taken
// Away from Him/Her or Not" (id "if-someone-s-misery-will-be-taken-away").
// Two methods. Method 1's calculation is well-defined (sum the dot-values
// of every bad-fortune house, cast out by 12s, check that house's
// fortune) but the passage's own worked examples ("if your result is 9,
// it means; if it's 12, it means; if it's 1, it means, etc.") never say
// what any of those results actually mean for THIS question — the same
// shape of gap as chapter 64 Method 2, `interpretation_not_stated`.
// Method 2 is fully computable and independent: whole-chart good vs. bad
// house count, reusing the existing COUNT_FORTUNE primitive.

import { CAST_OUT_BY, CHECK_HOUSE, COUNT_FORTUNE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-someone-s-misery-will-be-taken-away';

const method1: MethodDefinition = {
  id: 'misery-taken-away-method-1',
  label: 'Method 1',
  status: 'uncertain',
  reviewReasonCode: 'interpretation_not_stated',
  reviewNote:
    'The calculation is complete (sum the dot-values of every bad-fortune house, cast out by 12s, check that resulting house\'s own fortune) but the passage\'s own worked examples never say what any specific result number means for this question — only "Check if the star is a good star or a bad star" survives, with no stated mapping from that check to an answer about misery ending.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "Method 1: After drawing the chart, count all the dots of the bad stars in the chart and start subtracting 12, 12. If your result is 9, it means; if it's 12, it means; if it's 1, it means, etc. Check if the star is a good star or a bad star.",
  },
  calculate: (chart) => {
    const badHouses = chart.houses.filter((h) => h.qualities.fortune.value === 'bad');
    const totalDots = badHouses.reduce((sum, h) => sum + h.dotPattern.reduce((s, v) => s + v, 0), 0);
    const resultNumber = CAST_OUT_BY(totalDots, 12);
    const { figure, trace } = CHECK_HOUSE(chart, resultNumber);
    return {
      housesUsed: [resultNumber],
      steps: [
        `Bad-fortune houses: ${badHouses.map((h) => `H${h.houseNumber}`).join(', ') || 'none'}`,
        `Sum of their dots: ${totalDots}`,
        `Cast out by 12s: ${totalDots} -> ${resultNumber}`,
        trace.description,
      ],
      resultFigure: figure,
    };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Interpretation not stated', interpretation: 'The source never says what this result means for whether misery ends.' }),
};

const method2: MethodDefinition = {
  id: 'misery-taken-away-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'Method 2: Count all the good stars in the chart. If they are more than the bad stars, it means your misery will come to an end; but if the bad stars are more than the good stars, it means it will be difficult for you to overcome it in your life.',
  },
  calculate: (chart) => {
    const tally = COUNT_FORTUNE(chart);
    return {
      housesUsed: [],
      steps: [`Whole chart: ${tally.good} good, ${tally.middleGood} middle-good, ${tally.bad} bad`],
      resultFigure: CHECK_HOUSE(chart, 1).figure, // representative reference figure only — this method has no single result figure
    };
  },
  evaluate: (_calc, chart) => {
    const tally = COUNT_FORTUNE(chart);
    if (tally.good > tally.bad) {
      return { outcome: 'favourable', label: `${tally.good} good vs. ${tally.bad} bad`, interpretation: 'Your misery will come to an end.' };
    }
    if (tally.bad > tally.good) {
      return { outcome: 'unfavourable', label: `${tally.bad} bad vs. ${tally.good} good`, interpretation: 'It will be difficult for you to overcome it in your life.' };
    }
    return { outcome: 'uncertain', label: `${tally.good} good, ${tally.bad} bad — tied`, interpretation: 'This method only addresses one side being strictly more than the other — a tie is not addressed.' };
  },
};

export const miseryTakenAwayQuestion: QuestionDefinition = {
  id: 'if-someone-s-misery-will-be-taken-away',
  title: 'Will my misery be taken away?',
  categoryId: 'health-hardships',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
