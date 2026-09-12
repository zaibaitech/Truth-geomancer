// Source: Kanzul Mikban, Chapter 94 — "The Lifespan and When Someone Will
// Die" (id "the-lifespan-and-when-someone-will-die"). One method: "check
// h8" is a real, well-defined instruction, but every one of its ~15
// branches follows the pattern "If it is, it means X" with the TRIGGER
// FIGURE itself omitted (never the meaning — X is always given in full).
// This is the same "figures omitted by transcription" shape as chapters
// 2/4/5/6/7/9/13/17/19/21/26/27 (Prompt 8's own audit Group A) —
// registered `uncertain` so H8 is still shown, its actual branch withheld.

import { CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'the-lifespan-and-when-someone-will-die';

const method1: MethodDefinition = {
  id: 'lifespan-when-death-method-1',
  label: 'Method 1',
  status: 'uncertain',
  reviewNote:
    'Every branch follows "If it is, it means X" with the trigger figure itself omitted from the transcription (the meanings X survive in full, but never which named figure triggers which) — H8 is shown, but which of its ~15 branches applies cannot be determined.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, check h8. If it is, it means very long life, until old age... [full figure list omitted — symbols not preserved in this transcription; see the source manuscript for the complete branch list]. Note (in the original): Almighty Allah knows best — the beginning and the end of every living thing.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 8);
    return { housesUsed: [8], steps: [trace.description], resultFigure: figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Trigger figures omitted', interpretation: "This chapter's ~15 branch-trigger figures were not preserved in this transcription." }),
};

export const lifespanWhenDeathQuestion: QuestionDefinition = {
  id: 'the-lifespan-and-when-someone-will-die',
  title: 'What is their lifespan?',
  categoryId: 'health-hardships',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
