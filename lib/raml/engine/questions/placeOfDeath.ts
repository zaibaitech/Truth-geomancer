// Source: Kanzul Mikban, Chapter 97 — "Where One Will Die (Place of
// Death)" (id "where-one-will-die-place-of-death"). Same shape as chapter
// 94: "check h8" is well-defined, but every one of its ~13 branches has
// its trigger figure(s) omitted from the transcription while the meaning
// itself survives in full. Registered `uncertain`, matching the Prompt 8
// Group A precedent exactly.

import { CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'where-one-will-die-place-of-death';

const method1: MethodDefinition = {
  id: 'place-of-death-method-1',
  label: 'Method 1',
  status: 'uncertain',
  reviewNote:
    'Every branch follows "If it is [figure omitted], one will die in..." — the meanings (hometown/mosque, village, farm, etc.) survive in full, but the transcription never preserved which named figure(s) trigger which branch.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, check h8. If it is or, one will die in his/her hometown, in a masjid/mosque, or where they teach Qur'an (Makaranta)... [full figure list omitted — symbols not preserved in this transcription; see the source manuscript for the complete branch list].",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 8);
    return { housesUsed: [8], steps: [trace.description], resultFigure: figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Trigger figures omitted', interpretation: "This chapter's branch-trigger figures were not preserved in this transcription." }),
};

export const placeOfDeathQuestion: QuestionDefinition = {
  id: 'where-one-will-die-place-of-death',
  title: 'Where will they die?',
  categoryId: 'health-hardships',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
