// Source: Kanzul Mikban, Chapter 51 — "If Things Are Going to Be Well This
// Year or Not (Yearly News)" (id "if-things-are-going-to-be-well-this").
// One method. The source addresses: bad (any element/direction) ->
// unfavourable; good-and-fire (any direction) -> mixed (good, but
// financial problems — a real caveat, not flattened into unfavourable);
// good-and-downward-and-(air/water/sand) -> favourable. Good-and-upward
// (non-fire) and middle-good are never addressed, so both are left
// uncertain rather than guessed.

import { ADD_MULTIPLE_HOUSES, CHECK_DIRECTION, CHECK_ELEMENT } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-things-are-going-to-be-well-this';

const method1: MethodDefinition = {
  id: 'yearly-news-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h1, h6, h10 and h16 and add them all. If the star is a good and downward air star, or it is a good downward water star, or a good downward sand star, then it is going to be a good and successful year, with a lot of money and long life. But if it's a good and fire star, it will be good but you will be facing financial problems. If it is a bad star, it is going to be a very difficult year — a lot of problems and sicknesses.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 6, 10, 16]);
    return { housesUsed: [1, 6, 10, 16], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    const { element } = CHECK_ELEMENT(calc.resultFigure);
    const direction = CHECK_DIRECTION(calc.resultFigure);
    if (fortune === 'bad') {
      return { outcome: 'unfavourable', label: 'Bad star', interpretation: 'It is going to be a very difficult year — a lot of problems and sicknesses.' };
    }
    if (fortune === 'good' && element === 'fire') {
      return { outcome: 'mixed', label: 'Good and fire', interpretation: 'It will be good, but you will be facing financial problems.' };
    }
    if (fortune === 'good' && element !== 'fire' && direction === 'downward') {
      return { outcome: 'favourable', label: `Good, downward, ${element}`, interpretation: 'It is going to be a good and successful year, with a lot of money and long life.' };
    }
    return {
      outcome: 'uncertain',
      label: fortune === 'middleGood' ? 'Middle-good' : `Good, upward, ${element}`,
      interpretation: 'This method only addresses a bad star, a good-and-fire star, or a good-and-downward air/water/sand star.',
    };
  },
};

export const yearlyNewsQuestion: QuestionDefinition = {
  id: 'if-things-are-going-to-be-well-this',
  title: 'Will things go well for me this year?',
  categoryId: 'fate-timing',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
