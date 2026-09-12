// Source: Kanzul Mikban, Chapter 107 — "If You Will See What You Are
// Searching For or Not (Nazir)" (id "if-you-will-see-what-you-are-
// searching"). One method: the very first step ("pick the constant
// figure of Nazir") cannot be computed at all — Nazir is one of several
// named "constant figure" techniques the book's own front matter
// (KM_EDITION_NOTE) lists (alongside Sirri Sa'ael, Itisal, Ifusal) as
// real, recurring checks, but its actual dot-pattern is never given
// anywhere in either manuscript. Blocked at the first step, so nothing
// past it (the house-quarter timing explanation) is computable either.

import { CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-will-see-what-you-are-searching';

const method1: MethodDefinition = {
  id: 'see-what-searching-for-method-1',
  label: 'Method 1',
  status: 'uncertain',
  reviewReasonCode: 'constant_figure_undefined',
  reviewNote:
    "The calculation starts by adding the \"constant figure of Nazir\" to H1's own figure, but Nazir's dot-pattern is never defined anywhere in either manuscript (it's named only in the book's own front matter, alongside Sirri Sa'ael, Itisal, and Ifusal, as a recurring technique — never with a value).",
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, pick the constant figure of Nazir and add it to any star found in house 1. If the star is found in the chart, you will see it, and the vice versa. If it's found in the first 4 houses in the chart (Umuhat), you will see it within some seconds or days. If it's found in the second 4 houses (Banat), you will see it within some minutes or weeks. If it's found in the third 4 houses (Hafidat), you will see it within some hours or months. And if you found it in the last 4 houses (Sumurakat), you may not see it again, or you may see it within many hours or years.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 1);
    return { housesUsed: [1], steps: [trace.description, "Nazir's own dot-pattern is undefined — the calculation cannot proceed past H1."], resultFigure: figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Nazir undefined', interpretation: "The constant figure of Nazir is never defined in either manuscript." }),
};

export const seeWhatSearchingForQuestion: QuestionDefinition = {
  id: 'if-you-will-see-what-you-are-searching',
  title: 'Will I see what I am searching for?',
  categoryId: 'lost-stolen',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
