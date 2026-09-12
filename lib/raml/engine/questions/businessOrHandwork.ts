// Source: Kanzul Mikban, Chapter 86 — "If It's Business or Handwork That
// Will Benefit You" (id "if-it-s-business-or-handwork-that-will"). Same
// structure as chapter 85, two paragraphs earlier: one calculation
// (h2+h10), with the verdict stated as an OR across direction (verified)
// and stability (unsourced) — "upward OR unstable" -> business,
// "downward OR stable" -> handwork. Because the two axes point to
// OPPOSITE conclusions (unlike the friendship-secrets fragment, where
// both halves of the OR agreed), a direction-only reading cannot rule out
// the source's own stability-based half silently disagreeing on a given
// chart. Split into two methods, matching chapter 85's own precedent:
// Method 1 (direction, verified) and Method 2 (stability, blocked).

import { ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-it-s-business-or-handwork-that-will';
const QUOTE =
  "After drawing the chart, pick h2 and h10 and add them. If it's an upward or unstable star, then business will fit you; but if it's a downward or stable star, it's through handwork that will help you become successful in life.";

const method1: MethodDefinition = {
  id: 'business-or-handwork-method-1',
  label: 'Method 1 (direction)',
  status: 'verified',
  source: { book: 'kanzul-mikban', chapterId: CHAPTER_ID, quote: QUOTE },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [2, 10]);
    return { housesUsed: [2, 10], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const direction = calc.resultFigure.qualities.direction.value;
    if (direction === 'upward') {
      return { outcome: 'descriptive', label: 'Business', interpretation: 'Business will fit you.', descriptiveAnswer: 'business' };
    }
    if (direction === 'downward') {
      return { outcome: 'descriptive', label: 'Handwork', interpretation: "It's through handwork that will help you become successful in life.", descriptiveAnswer: 'handwork' };
    }
    return { outcome: 'uncertain', label: 'Level star', interpretation: 'The resulting figure is neither clearly upward nor downward.' };
  },
};

const method2: MethodDefinition = {
  id: 'business-or-handwork-method-2',
  label: 'Method 2 (stability)',
  status: 'needs_review',
  reviewReasonCode: 'stability_classification_unsourced',
  reviewNote:
    "This alternate reading crosses on stability (unstable -> business, stable -> handwork) rather than direction — the `stability` axis has been `needs_review`, project-wide, since Prompt 1, and it could in principle disagree with Method 1's direction-based answer on a given chart.",
  source: { book: 'kanzul-mikban', chapterId: CHAPTER_ID, quote: QUOTE },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [2, 10]);
    return { housesUsed: [2, 10], steps: [trace.description], resultFigure: figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Stability not classified', interpretation: 'This project has no sourced stability classification for any figure.' }),
};

export const businessOrHandworkQuestion: QuestionDefinition = {
  id: 'if-it-s-business-or-handwork-that-will',
  title: 'Is business or handwork better for me?',
  categoryId: 'work-success',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1, method2],
};
