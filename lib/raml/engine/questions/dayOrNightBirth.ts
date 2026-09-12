// Source: Kanzul Mikban, Chapter 83 — "If It's Day or Night That She Will
// Put to Bed" (id "if-it-s-day-or-night-that-she"). One method: the
// calculation (h1+h5) is fully computable, but the verdict hinges on
// classifying the resulting figure as a "day star" or "night star" — the
// `dayNight` axis on FigureQualities has been `needs_review` project-wide
// since Prompt 1 (see types.ts: "the source's own edition note names
// these as real qualities the book uses, but never tabulates which figure
// carries which"). This is the FIRST method any prompt has actually
// needed that axis for — chapters 1-80 never hit it. No classification
// was invented; new `reviewReasonCode: 'day_night_classification_unsourced'`
// documents this specific, distinct gap (parallel to
// gender_classification_unsourced, a different axis with the same shape
// of problem).

import { ADD_MULTIPLE_HOUSES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-it-s-day-or-night-that-she';

const method1: MethodDefinition = {
  id: 'day-or-night-birth-method-1',
  label: 'Method 1',
  status: 'needs_review',
  reviewReasonCode: 'day_night_classification_unsourced',
  reviewNote:
    'The verdict hinges on classifying the resulting figure as a "day star" or "night star" — this chapter never defines which figures are day/night, and no chapter reviewed so far in either manuscript tabulates it either. The `dayNight` axis has been `needs_review`, project-wide, since Prompt 1.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "After drawing the chart, pick h1 and h5 and add them. If it's a day star, she will deliver in the daytime; if it's a night star, she will put to bed at night.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [1, 5]);
    return { housesUsed: [1, 5], steps: [trace.description], resultFigure: figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Day/night not classified', interpretation: 'This project has no sourced day/night classification for any figure.' }),
};

export const dayOrNightBirthQuestion: QuestionDefinition = {
  id: 'if-it-s-day-or-night-that-she',
  title: 'Will she put to bed in the daytime or at night?',
  categoryId: 'family-loved-ones',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
