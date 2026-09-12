// Source: Kanzul Mikban, Chapter 85 — "How the Future of Two People's
// Friendship Will Be" (id "how-the-future-of-two-people-s-friendship").
// One calculation (h1+h11), but the source gives TWO independent ways to
// read the resulting figure — one crossing fortune with DIRECTION (4
// branches, fully computable, direction is a verified axis) and one
// crossing fortune with STABILITY (4 more branches, all blocked — the
// `stability` axis has been `needs_review` project-wide since Prompt 1,
// and chapters 1-80 never actually needed it). Following the Chapter
// 18/86 precedent ("implement alternate scholarly rules as separate
// methods, don't hide one inside the other"), these are two methods
// sharing one calculation rather than one method with 8 branches. Neither
// pass addresses a middle-good result.

import { ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'how-the-future-of-two-people-s-friendship';
const QUOTE =
  "After casting the chart, pick h1 and h11 and add them. If it's a good and upward star, their friendship will be good but short — they won't follow each other for a long time, and will go their separate ways peacefully. If it's a good and downward star, their friendship will be good forever. If it's a bad and upward star, their friendship will not go far, and they will separate with anger. If it's a bad and downward star, their friendship will keep long, but they will be angry with each other in secret. If it's a stable and a bad star, their friendship will be long, but there will be problems between them all the time. If it's a good and stable star, their friendship will be longer and successful. If it's a good and unstable star, their friendship will be on and off. If it's a bad and unstable star, their friendship will be bad and they cannot stay together.";

const method1: MethodDefinition = {
  id: 'friendship-future-method-1',
  label: 'Method 1 (direction)',
  status: 'verified',
  source: { book: 'kanzul-mikban', chapterId: CHAPTER_ID, quote: QUOTE },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 11]);
    return { housesUsed: [1, 11], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    const direction = calc.resultFigure.qualities.direction.value;
    if (fortune === 'good' && direction === 'upward') {
      return { outcome: 'mixed', label: 'Good and upward', interpretation: "Their friendship will be good but short — they will part ways peacefully." };
    }
    if (fortune === 'good' && direction === 'downward') {
      return { outcome: 'favourable', label: 'Good and downward', interpretation: 'Their friendship will be good forever.' };
    }
    if (fortune === 'bad' && direction === 'upward') {
      return { outcome: 'unfavourable', label: 'Bad and upward', interpretation: 'Their friendship will not go far, and they will separate with anger.' };
    }
    if (fortune === 'bad' && direction === 'downward') {
      return { outcome: 'mixed', label: 'Bad and downward', interpretation: 'Their friendship will keep long, but they will be angry with each other in secret.' };
    }
    return { outcome: 'uncertain', label: 'Middle-good, or level', interpretation: 'This method only addresses good/bad crossed with upward/downward — this is not addressed.' };
  },
};

const method2: MethodDefinition = {
  id: 'friendship-future-method-2',
  label: 'Method 2 (stability)',
  status: 'needs_review',
  reviewReasonCode: 'stability_classification_unsourced',
  reviewNote:
    "This alternate reading crosses fortune with stability (stable/unstable) rather than direction — the `stability` axis has been `needs_review`, project-wide, since Prompt 1. No chapter reviewed before chapter 85 ever actually needed it.",
  source: { book: 'kanzul-mikban', chapterId: CHAPTER_ID, quote: QUOTE },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 11]);
    return { housesUsed: [1, 11], steps: [trace.description], resultFigure: figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Stability not classified', interpretation: 'This project has no sourced stability classification for any figure.' }),
};

export const friendshipFutureQuestion: QuestionDefinition = {
  id: 'how-the-future-of-two-people-s-friendship',
  title: "How will our friendship turn out?",
  categoryId: 'family-loved-ones',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
