// Source: Kanzul Mikban, Chapter 94 — "The Lifespan and When Someone Will
// Die" (id "the-lifespan-and-when-someone-will-die"). One method: check h8
// and read off the stage of life for the figure found there. The fifteen
// figure -> stage pairs were restored from the author-confirmed final edition
// (see ../kanzulFinalEditionFigures.ts). The edition gives no stage for Yunus,
// so that one figure is reported as not addressed rather than guessed.
// resultKind 'descriptive': a stage of life is a factual answer.

import { CHECK_HOUSE, MATCH_FIGURE } from '../operations';
import { CH94_LIFESPAN } from '../kanzulFinalEditionFigures';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'the-lifespan-and-when-someone-will-die';

const method1: MethodDefinition = {
  id: 'lifespan-when-death-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After casting the chart, check h8. If it is Ayuba, it means very long life, until old age. If it's Sulemana, it means within his/her old age. If it's Adam, it means after old age the person will die. If it is Umar, it means early young age — man or lady, will be the time he/she will die. If it is Usman, it means at the end of puberty time. If it is Nuhu, it means at his/her youthful time. If it is Yussif, it means at his/her first year at puberty. If it is Ali, it means in the middle of his/her puberty time. If it is Musah, it means at the beginning of his/her puberty time. If it is Iddris, it means at the age of 10 years. If it is Issah, it means he/she will die while still small. If it is Hassan & Hussein, it means the same — he/she will die as a small boy/girl. If it is Ibrahim, it means before he/she attains puberty time. If it is Kalla Allahu, it means in the middle of his/her life — that's from 40 and above. If it is Mahadi, it means in the middle of his/her youthful age/time.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 8);
    return { housesUsed: [8], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const entry = CH94_LIFESPAN.entries.find((e) => e.figures.some((f) => MATCH_FIGURE(calc.resultFigure, f.starId)));
    if (!entry) {
      return { outcome: 'uncertain', label: `${calc.resultFigure.figureName} at H8`, interpretation: 'The source gives no lifespan stage for this figure.' };
    }
    return {
      outcome: 'descriptive',
      label: `${calc.resultFigure.figureName} at H8`,
      interpretation: `${entry.text.charAt(0).toUpperCase()}${entry.text.slice(1)}`,
      descriptiveAnswer: entry.figures.map((f) => f.starId).join('+'),
    };
  },
};

export const lifespanWhenDeathQuestion: QuestionDefinition = {
  id: 'the-lifespan-and-when-someone-will-die',
  title: 'What is their lifespan?',
  categoryId: 'health-hardships',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
