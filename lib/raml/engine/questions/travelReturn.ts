// Source: Kanzul Mikban, Chapter 1 — "Traveling, Business, and If You Will
// Return from the Trip or Not" (content/manuscripts/kanzul-mikban.ts, id
// "traveling-business-and-if-you-will-return-from").

import { ADD_MULTIPLE_HOUSES, CHECK_ELEMENT, EXTRACT_ELEMENT } from '../operations';
import { addPatterns } from '../../casting';
import { getStarByPattern } from '@/content/stars';
import { getClassicalAttribute } from '@/content/classicalAttributes';
import { qualitiesFor } from '../chartModel';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'traveling-business-and-if-you-will-return-from';

const method1: MethodDefinition = {
  id: 'travel-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick h1 and h8, then (h9 and h11), and add all of them. If it's a good and upward star, you will return with money and peacefully. If it's a good and downward star, you will return peacefully but without money. If it's a bad star, it's not good at all for you to travel.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 8, 9, 11]);
    return { housesUsed: [1, 8, 9, 11], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const { fortune, direction } = calc.resultFigure.qualities;
    if (fortune.value === 'bad') {
      return { outcome: 'unfavourable', label: 'Bad', interpretation: "It's not good at all for you to travel." };
    }
    if (fortune.value === 'good' && direction.value === 'upward') {
      return { outcome: 'favourable', label: 'Good and upward', interpretation: 'You will return with money and peacefully.' };
    }
    if (fortune.value === 'good' && direction.value === 'downward') {
      return { outcome: 'favourable', label: 'Good and downward', interpretation: 'You will return peacefully, but without money.' };
    }
    return {
      outcome: 'uncertain',
      label: 'Combination not addressed',
      interpretation: 'This method only covers good+upward, good+downward, and bad results — this chart falls outside all three.',
    };
  },
};

const method2: MethodDefinition = {
  id: 'travel-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick (h1 and h7) then (h4 and h8), add all, and check the result you get: if it's fire or air star, you will return with money; if it's water or sand star, you will come back with nothing.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 7, 4, 8]);
    return { housesUsed: [1, 7, 4, 8], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const element = CHECK_ELEMENT(calc.resultFigure).element;
    const favourable = element === 'fire' || element === 'air';
    return favourable
      ? { outcome: 'favourable', label: `${element[0].toUpperCase()}${element.slice(1)} figure`, interpretation: 'You will return with money.' }
      : { outcome: 'unfavourable', label: `${element[0].toUpperCase()}${element.slice(1)} figure`, interpretation: 'You will come back with nothing.' };
  },
};

// The mechanical part (extract each of the 4 elements from h3/h7/h11/h15 into
// 4 synthetic figures, then add them) is fully computable — EXTRACT_ELEMENT
// is exercised here to prove it works. What isn't computable with confidence
// is the deciding rule itself: the source classifies the FINAL figure as a
// whole "single-dot star" or "double-dot star", a whole-figure label this
// project has no verified definition for (elsewhere, opened/closed is
// tracked per LINE, not as one label for an entire 4-line figure) — so this
// stays needs_review rather than guessing what "single-dot star" means.
const method3: MethodDefinition = {
  id: 'travel-method-3',
  label: 'Method 3',
  status: 'needs_review',
  reviewReasonCode: 'whole_figure_state_undefined',
  reviewNote:
    'The deciding rule classifies the final figure as a whole "single-dot star" or "double-dot star" — a whole-figure label with no verified definition in this project (dot state is otherwise tracked per line, not per figure). The calculation itself (four element-extractions, summed) is shown for transparency; the verdict is not.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, pick h3, h7, h11 and h15 fire elements and form one star; then pick h3, h7, h11 and h15 air elements and form a star; then pick h3, h7, h11 and h15 water elements and form a star; then pick h3, h7, h11 and h15 sand elements and form a star. You will have 4 stars at the end — add them and check the star. If it's a good and single-dot star and also found in the chart, it means the trip is good and safe. But if it's a good double-dot star and also found in the chart, it means you will go and come in peace but you won't get money from the trip. If it's not found in the chart at all, it means it's not good to travel.",
  },
  calculate: (chart) => {
    const fire = EXTRACT_ELEMENT(chart, [3, 7, 11, 15], 'fire');
    const air = EXTRACT_ELEMENT(chart, [3, 7, 11, 15], 'air');
    const water = EXTRACT_ELEMENT(chart, [3, 7, 11, 15], 'water');
    const sand = EXTRACT_ELEMENT(chart, [3, 7, 11, 15], 'sand');
    let pattern = fire.figure.dotPattern;
    pattern = addPatterns(pattern, air.figure.dotPattern);
    pattern = addPatterns(pattern, water.figure.dotPattern);
    pattern = addPatterns(pattern, sand.figure.dotPattern);
    const star = getStarByPattern(pattern);
    const resultFigure = {
      figureId: star.id,
      figureName: star.name,
      classicalName: getClassicalAttribute(star.id).classicalName,
      dotPattern: pattern,
      element: star.element,
      qualities: qualitiesFor(star.id, pattern),
      sourceHouses: [3, 7, 11, 15],
    };
    return {
      housesUsed: [3, 7, 11, 15],
      steps: [fire.trace.description, air.trace.description, water.trace.description, sand.trace.description, `sum of the four → ${star.name}`],
      resultFigure,
    };
  },
  evaluate: () => ({
    outcome: 'uncertain',
    label: 'Not computable',
    interpretation: 'This method\'s deciding rule ("single-dot star" vs. "double-dot star" as a whole) has no verified definition in this project.',
  }),
};

export const travelReturnQuestion: QuestionDefinition = {
  id: 'traveling-business-and-if-you-will-return-from',
  title: 'Will I return safely from a trip?',
  categoryId: 'travel-change',
  chapterId: CHAPTER_ID,
  methods: [method1, method2, method3],
};
