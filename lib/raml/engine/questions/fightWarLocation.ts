// Source: Kanzul Mikban, Chapter 5 — "If You Will Win a Fight, War, or
// Court Case" (id "if-you-will-win-a-fight-war-or"). A separate, more
// complete chapter (19, "if-you-will-win-a-case-in-court" — see
// questions/courtCase.ts) covers the same real-world question with mostly
// computable methods; this shorter chapter is its own selectable intention
// in content/intentions.ts, but both of its branches depend on named
// figures the transcription marked "[figures omitted]", so neither is
// computable here.

import { CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-will-win-a-fight-war-or';

const method1: MethodDefinition = {
  id: 'fight-war-location-method-1',
  label: 'Method 1',
  status: 'uncertain',
  reviewNote:
    'Decides the verdict by which named figures land in H6 — those figures were transcribed as "[figures omitted — symbols not preserved]" and cannot be identified.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'After drawing the chart, check h6. If you see any of the following stars there, it means you will win it: [figures omitted — symbols not preserved in this transcription].',
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 6);
    return { housesUsed: [6], steps: [trace.description], resultFigure: figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Not computable', interpretation: 'The winning figures for H6 were not transcribed from the source.' }),
};

const method2: MethodDefinition = {
  id: 'fight-war-location-method-2',
  label: 'Method 2',
  status: 'uncertain',
  reviewNote:
    'Decides the verdict by which named figures land in H1 and H8 — those figures were transcribed as "[figures omitted — symbols not preserved]" and cannot be identified.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "If you found any of the following stars in h1 and h8, it means it's not good and it will be difficult to succeed. They are as follows: [figures omitted — symbols not preserved in this transcription]",
  },
  calculate: (chart) => {
    // "found in h1 AND h8" checks each house individually for a named
    // figure, not their sum — not an addition method.
    const h1 = CHECK_HOUSE(chart, 1);
    const h8 = CHECK_HOUSE(chart, 8);
    return { housesUsed: [1, 8], steps: [h1.trace.description, h8.trace.description], resultFigure: h1.figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Not computable', interpretation: 'The unfavourable figures for H1/H8 were not transcribed from the source.' }),
};

export const fightWarLocationQuestion: QuestionDefinition = {
  id: 'if-you-will-win-a-fight-war-or',
  title: 'Will I win a fight, war, or court case? (H6/H1+H8 method)',
  categoryId: 'legal-conflict',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
