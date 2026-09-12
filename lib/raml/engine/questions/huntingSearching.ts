// Source: Kanzul Mikban, Chapter 4 — "Hunting in Water and on Land, and
// Searching for Anything" (id "hunting-in-water-and-on-land-and-searching").
// The chapter's single method decides the verdict entirely by which named
// figures show up in H10 — those figures were transcribed as
// "[figures omitted — symbols not preserved]". There is no other
// computable branch in this chapter, so this question has zero verified
// methods; it's still registered (rather than silently falling back) so a
// reader who picks it sees an honest "not enough to go on" reading with the
// source quote, instead of no acknowledgement at all.

import { CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'hunting-in-water-and-on-land-and-searching';

const method1: MethodDefinition = {
  id: 'hunting-method-1',
  label: 'Method 1',
  status: 'uncertain',
  reviewNote:
    'This method decides the verdict by which named figures show up in H10 — those figures were transcribed as "[figures omitted — symbols not preserved]" and cannot be identified.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, check h10. If you find the following stars, it means you will be successful in your search: [figures omitted — symbols not preserved in this transcription]. If it's any of the above stars, you will get whatever you are asking for or searching for — for example: job, money, title, promotion, marriage, etc.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 10);
    return { housesUsed: [10], steps: [trace.description], resultFigure: figure };
  },
  evaluate: () => ({
    outcome: 'uncertain',
    label: 'Not computable',
    interpretation: 'The figures that would confirm success here were not transcribed from the source.',
  }),
};

export const huntingSearchingQuestion: QuestionDefinition = {
  id: 'hunting-in-water-and-on-land-and-searching',
  title: 'Will my search or hunt succeed?',
  categoryId: 'lost-stolen',
  chapterId: CHAPTER_ID,
  methods: [method1],
};
