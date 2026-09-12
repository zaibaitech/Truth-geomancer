// Source: Kanzul Mikban, Chapter 133 — "How Deep Something Is Buried" (id
// "how-deep-something-is-buried"). One method: count every single dot
// (opened line) from H1 to H15 ONLY — H16 is deliberately excluded by the
// source's own wording ("count all the single dots from h1 to h15"), unlike
// every other whole-chart dot count in this project, which spans all 16
// houses. Cast out by 12s (CAST_OUT_BY, already used for other moduli at
// chapters 56/98), then bucket the 1-12 result into three equal ranges. Full
// coverage — CAST_OUT_BY(x, 12) always returns 1-12, and all three ranges
// (1-4, 5-8, 9-12) are addressed, no gap. resultKind 'descriptive': a
// measurement, not a favourable/unfavourable outcome.

import { CAST_OUT_BY, CHECK_HOUSE, COUNT_OPENED_LINES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'how-deep-something-is-buried';
const HOUSES_1_TO_15 = Array.from({ length: 15 }, (_, i) => i + 1);

const method1: MethodDefinition = {
  id: 'how-deep-buried-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, count all the single dots from h1 to h15 and start subtracting 12, 12. If your result is from 1 to 4, it means it is an inch deep. If your result is from 5 to 8, it means an arm's length or a cubit deep. If your result is from 9 to 12, it means the height of a human being (stature/height deep).",
  },
  calculate: (chart) => {
    const { count, trace } = COUNT_OPENED_LINES(chart, HOUSES_1_TO_15);
    const reduced = CAST_OUT_BY(count, 12);
    const { figure } = CHECK_HOUSE(chart, 1); // representative reference figure only — this method reduces a dot count, not a single figure
    return { housesUsed: HOUSES_1_TO_15, steps: [trace.description, `Cast out by 12s: ${count} -> ${reduced}`], resultFigure: figure };
  },
  evaluate: (_calc, chart) => {
    const { count } = COUNT_OPENED_LINES(chart, HOUSES_1_TO_15);
    const reduced = CAST_OUT_BY(count, 12);
    if (reduced >= 1 && reduced <= 4) {
      return { outcome: 'descriptive', label: 'An inch deep', interpretation: `${count} single dots (H1-H15), cast out by 12s = ${reduced} — an inch deep.`, descriptiveAnswer: 'inch' };
    }
    if (reduced >= 5 && reduced <= 8) {
      return { outcome: 'descriptive', label: "An arm's length (cubit) deep", interpretation: `${count} single dots (H1-H15), cast out by 12s = ${reduced} — an arm's length or a cubit deep.`, descriptiveAnswer: 'cubit' };
    }
    return { outcome: 'descriptive', label: 'A human height deep', interpretation: `${count} single dots (H1-H15), cast out by 12s = ${reduced} — the height/stature of a human being deep.`, descriptiveAnswer: 'human-height' };
  },
};

export const howDeepBuriedQuestion: QuestionDefinition = {
  id: 'how-deep-something-is-buried',
  title: 'How deep is it buried?',
  categoryId: 'lost-stolen',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
