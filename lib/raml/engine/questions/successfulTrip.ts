// Source: Kanzul Mikban, Chapter 30 — "If You Will Be Successful and Get
// What You Want from the Trip/Traveling" (id
// "if-you-will-be-successful-and-get-what"). One method: direction decides
// the primary branch (upward=favourable, downward=a real delay, kept as
// `mixed` rather than flattened into unfavourable, since the source frames
// it as "be patient" rather than "it will fail"); the water line refines
// the upward branch's wording without changing its outcome. Two further
// named-figure branches (Hassan & Hussein: profit but not stable; Issah: a lot
// of money but very sick) were restored from the author-confirmed final
// edition and are read as figure-specific exceptions to the direction rule
// (both figures are upward stars in STARS, so they cannot be refinements of
// the downward branch).

import { ADD_FIGURE_TO_HOUSE, ADD_MULTIPLE_HOUSES, CHECK_DIRECTION, CHECK_LINE_STATE, MATCH_FIGURE } from '../operations';
import { CH30_HASSAN_HUSSEIN, CH30_ISSAH, idsOf } from '../kanzulFinalEditionFigures';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-will-be-successful-and-get-what';

const method1: MethodDefinition = {
  id: 'successful-trip-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, pick h1, h8, h7 and h11 and add them. Add the results to h16. If the star is an upward star, it means the trip is good and safe. And if the water element of the star is opened, it means you will get a lot of profit in your business trip. If the star is a downward star, please be patient — about a month or 10 days, or at least 3 days before you travel.",
  },
  calculate: (chart) => {
    const step1 = ADD_MULTIPLE_HOUSES(chart, [1, 8, 7, 11]);
    const step2 = ADD_FIGURE_TO_HOUSE(chart, step1.figure, 16);
    return { housesUsed: [1, 8, 7, 11, 16], steps: [step1.trace.description, step2.trace.description], resultFigure: step2.figure };
  },
  evaluate: (calc) => {
    // The source's two figure-specific clauses (restored from the final
    // edition) are read as named exceptions to the general direction reading.
    // Both figures are upward stars in STARS, so they could never be reached
    // from inside the downward branch.
    if (idsOf(CH30_HASSAN_HUSSEIN).some((id) => MATCH_FIGURE(calc.resultFigure, id))) {
      return {
        outcome: 'mixed',
        label: 'Hassan & Hussein',
        interpretation: 'You will get a lot of profit but it will not be stable — you will lose it after that.',
      };
    }
    if (idsOf(CH30_ISSAH).some((id) => MATCH_FIGURE(calc.resultFigure, id))) {
      return {
        outcome: 'mixed',
        label: 'Issah',
        interpretation: 'You will get a lot of money and benefits from the trip, but you will be very, very sick — you may spend all the money on the sickness.',
      };
    }
    const direction = CHECK_DIRECTION(calc.resultFigure);
    if (direction === 'upward') {
      const waterOpened = CHECK_LINE_STATE(calc.resultFigure, 'water') === 'opened';
      return waterOpened
        ? { outcome: 'favourable', label: 'Upward star, water line opened', interpretation: 'The trip is good and safe, and you will get a lot of profit in your business trip.' }
        : { outcome: 'favourable', label: 'Upward star', interpretation: 'The trip is good and safe.' };
    }
    if (direction === 'downward') {
      return {
        outcome: 'mixed',
        label: 'Downward star',
        interpretation: 'Please be patient — about a month or 10 days, or at least 3 days before you travel.',
      };
    }
    return { outcome: 'uncertain', label: 'Level star', interpretation: 'This method only addresses a clearly upward or downward result.' };
  },
};

export const successfulTripQuestion: QuestionDefinition = {
  id: 'if-you-will-be-successful-and-get-what',
  title: 'Will I be successful and get what I want from this trip?',
  categoryId: 'travel-change',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
