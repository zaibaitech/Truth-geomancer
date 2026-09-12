// Source: Kanzul Mikban, Chapter 25 — "If There Are Armed Robbers on Your
// Way" (id "if-there-are-armed-robbers-on-your-way"). One method. The
// source only defines the water-element branch; it never states what a
// fire, air, or sand result means, so those are left `uncertain` rather
// than assumed safe.

import { ADD_MULTIPLE_HOUSES, CHECK_ELEMENT } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-there-are-armed-robbers-on-your-way';

const method1: MethodDefinition = {
  id: 'armed-robbers-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, pick h9, h8, h12 and h16 and add them. If your result is a water star, then you don't have to travel — you may meet armed robbers on your way, which will involve bloodshed or accident.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [9, 8, 12, 16]);
    return { housesUsed: [9, 8, 12, 16], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const { element } = CHECK_ELEMENT(calc.resultFigure);
    if (element === 'water') {
      return {
        outcome: 'unfavourable',
        label: 'Water figure',
        interpretation: "Don't travel — you may meet armed robbers on your way, which will involve bloodshed or accident.",
      };
    }
    return {
      outcome: 'uncertain',
      label: `${element} figure`,
      interpretation: 'This method only defines the water-element result — a non-water figure is not addressed by the source.',
    };
  },
};

export const armedRobbersQuestion: QuestionDefinition = {
  id: 'if-there-are-armed-robbers-on-your-way',
  title: 'Are there armed robbers on my way?',
  categoryId: 'legal-conflict',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
