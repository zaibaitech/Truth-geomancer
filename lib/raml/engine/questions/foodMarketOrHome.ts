// Source: Kanzul Mikban, Chapter 101 — "As a Stranger, If the Food You
// Want to Eat Is from the Market or Home-Prepared" (id
// "as-a-stranger-if-the-food-you-want"). One method: h6+h10 add, then
// check where the resulting figure repeats — at h6 itself (home-prepared),
// at h10 itself (market), or at some OTHER house entirely (a different
// house). The source never addresses the case where the result repeats
// nowhere at all — left uncertain rather than assumed. resultKind
// 'descriptive': a factual origin, not itself favourable/unfavourable.

import { ADD_MULTIPLE_HOUSES, CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'as-a-stranger-if-the-food-you-want';

const method1: MethodDefinition = {
  id: 'food-market-or-home-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h6 and h10 and add them. If the star repeats in h6, it means the food is from the same house — home-prepared. If it repeats in h10, it means it's from the market. If it's not repeated in either place, but repeated in different houses, it means the food is from a different house.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [6, 10]);
    return { housesUsed: [6, 10], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc, chart) => {
    const target = calc.resultFigure.dotPattern.join(',');
    const atH6 = CHECK_HOUSE(chart, 6).figure.dotPattern.join(',') === target;
    const atH10 = CHECK_HOUSE(chart, 10).figure.dotPattern.join(',') === target;
    if (atH6) {
      return { outcome: 'descriptive', label: 'Home-prepared', interpretation: 'The food is home-prepared.', descriptiveAnswer: 'home-prepared' };
    }
    if (atH10) {
      return { outcome: 'descriptive', label: 'From the market', interpretation: "It's from the market.", descriptiveAnswer: 'market' };
    }
    for (let n = 1; n <= 16; n++) {
      if (n === 6 || n === 10) continue;
      if (CHECK_HOUSE(chart, n).figure.dotPattern.join(',') === target) {
        return { outcome: 'descriptive', label: 'From a different house', interpretation: 'The food is from a different house.', descriptiveAnswer: 'different-house' };
      }
    }
    return { outcome: 'uncertain', label: 'Not found anywhere', interpretation: "The source addresses repeating at H6, H10, or elsewhere — this chart's result repeats nowhere, which isn't addressed." };
  },
};

export const foodMarketOrHomeQuestion: QuestionDefinition = {
  id: 'as-a-stranger-if-the-food-you-want',
  title: 'Is this food home-prepared or from the market?',
  categoryId: 'fate-timing',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
