// Source: Kanzul Mikban, Chapter 149 — "Which Day a Pregnant Woman Will Put
// to Bed" (id "which-day-a-pregnant-woman-will-put-to"). One method: count
// every dot of H1, H4, H5, H7, H15 (COUNT_TOTAL_DOTS), cast out by 7s
// (CAST_OUT_BY). The source itself carries an explicit transcription
// caveat: "1 is Sunday; 2 is Monday; 3 is Tuesday; and so on through the
// week to Saturday. [The full day-by-day list runs off the edge of the
// scanned page — only the first three days are legible; please check the
// original for days 4-7.]" The bracketed note is the TRANSCRIBER's own
// admission that they could not actually confirm the source text for
// results 4-7 — "and so on through the week" may be the transcriber's own
// paraphrase smoothing over that exact gap, not verified original wording.
// Per this project's discipline (never infer a missing branch, even one
// that looks obvious), only the three explicitly legible results (1, 2, 3)
// are implemented; results 4-7 are left `uncertain` rather than assumed to
// continue Wednesday-Saturday in calendar order. resultKind 'descriptive':
// a day of the week is a neutral fact, not a favourable/unfavourable
// outcome.

import { CAST_OUT_BY, CHECK_HOUSE, COUNT_TOTAL_DOTS } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'which-day-a-pregnant-woman-will-put-to';
const HOUSES = [1, 4, 5, 7, 15];
const DAYS: Record<number, string> = { 1: 'Sunday', 2: 'Monday', 3: 'Tuesday' };

const method1: MethodDefinition = {
  id: 'pregnant-woman-put-to-bed-day-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, count all the dots of h1, h4, h5, h7, and h15, and start subtracting 7, 7. If it's 1, that's Sunday; 2 is Monday; 3 is Tuesday; and so on through the week to Saturday. [The full day-by-day list runs off the edge of the scanned page — only the first three days are legible; please check the original for days 4-7.]",
  },
  calculate: (chart) => {
    const { total, trace } = COUNT_TOTAL_DOTS(chart, HOUSES);
    const reduced = CAST_OUT_BY(total, 7);
    const { figure } = CHECK_HOUSE(chart, 1); // representative reference figure only — this method reduces a dot count, not a single figure
    return { housesUsed: HOUSES, steps: [trace.description, `Cast out by 7s: ${total} -> ${reduced}`], resultFigure: figure };
  },
  evaluate: (_calc, chart) => {
    const { total } = COUNT_TOTAL_DOTS(chart, HOUSES);
    const reduced = CAST_OUT_BY(total, 7);
    const day = DAYS[reduced];
    if (day) {
      return { outcome: 'descriptive', label: day, interpretation: `${total} dots (H1/H4/H5/H7/H15), cast out by 7s = ${reduced} — ${day}.`, descriptiveAnswer: day.toLowerCase() };
    }
    return { outcome: 'uncertain', label: `Result ${reduced} (day 4-7)`, interpretation: 'Only Sunday (1), Monday (2), and Tuesday (3) survive legibly in this transcription — the source itself flags days 4-7 as unconfirmed.' };
  },
};

export const pregnantWomanPutToBedDayQuestion: QuestionDefinition = {
  id: 'which-day-a-pregnant-woman-will-put-to',
  title: 'Which day will the pregnant woman put to bed?',
  categoryId: 'family-loved-ones',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
