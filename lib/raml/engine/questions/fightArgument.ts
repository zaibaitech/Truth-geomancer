// Source: Kanzul Mikban, Chapter 26 — "If There Will Be a Fight, Argument,
// etc" (id "if-there-will-be-a-fight-argument-etc"). Every single decisive
// condition in this chapter depends on a named/drawn figure the source
// transcription omitted (h1/h2, Sirri Sa'ael, h8, h12, h14, and even the
// h9 "peace" branch itself lost its figure token) — nothing here is
// computable. Registered anyway, per project convention, so this reading is
// honestly acknowledged rather than silently absent.

import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-there-will-be-a-fight-argument-etc';

const method1: MethodDefinition = {
  id: 'fight-argument-method-1',
  label: 'Method 1',
  status: 'uncertain',
  reviewNote:
    'Every branch of this chapter (h1/h2, Sirri Sa\'ael, h8, h12, h9, h14) is decided by named figures the source transcription omitted or dropped entirely — including the h9 "peace" branch, whose figure token was lost along with the others. Nothing here is computable without those symbols.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, check h2 and h1. If you found: [figures omitted — symbols not preserved in this transcription] it means there will be a fight or misunderstanding in the family or between some people in town. But if you found:, in h9, it means there will be peace. If you draw a chart and your Sirri Sa'ael (Damir) is [figures omitted — symbols not preserved in this transcription] it means you will have a fight with, or disagreement with, someone.",
  },
  calculate: () => {
    throw new Error('Every branch of this chapter depends on named figures the source transcription omitted.');
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Not computable', interpretation: 'This method cannot currently be verified against the source.' }),
};

export const fightArgumentQuestion: QuestionDefinition = {
  id: 'if-there-will-be-a-fight-argument-etc',
  title: 'Will there be a fight or argument?',
  categoryId: 'legal-conflict',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
