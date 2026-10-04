// Source: Kanzul Mikban, Chapter 5 — "If You Will Win a Fight, War, or
// Court Case" (id "if-you-will-win-a-fight-war-or"). A separate, more
// complete chapter (19, "if-you-will-win-a-case-in-court" — see
// questions/courtCase.ts) covers the same real-world question with mostly
// computable methods; this shorter chapter is its own selectable intention
// in content/intentions.ts. Both of its branches depend on named figures the
// transcription marked "[figures omitted]"; Prompt 58 restored them from the
// manuscript scan (see ../kanzulRestoredFigures.ts). The source states only
// the two positive triggers, so a non-matching figure stays uncertain.

import { CHECK_HOUSE, MATCH_FIGURE } from '../operations';
import { CH5_H1_H8_DIFFICULT, CH5_H6_WIN, starIdsOf } from '../kanzulRestoredFigures';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-you-will-win-a-fight-war-or';

const method1: MethodDefinition = {
  id: 'fight-war-location-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'After drawing the chart, check h6. If you see any of the following stars there, it means you will win it: Kalla Allahu, Ayuba, Musah, Mahadi, Adam, Ibrahim, Yunus.',
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 6);
    return { housesUsed: [6], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) =>
    starIdsOf(CH5_H6_WIN).some((id) => MATCH_FIGURE(calc.resultFigure, id))
      ? { outcome: 'favourable', label: `${calc.resultFigure.figureName} at H6`, interpretation: 'You will win it.' }
      : { outcome: 'uncertain', label: `${calc.resultFigure.figureName} at H6`, interpretation: 'The source only lists the winning figures for H6 — this figure is not addressed.' },
};

const method2: MethodDefinition = {
  id: 'fight-war-location-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "If you found any of the following stars in h1 and h8, it means it's not good and it will be difficult to succeed. They are as follows: Hassan & Hussein, Issah, Yunus, Ayuba",
  },
  calculate: (chart) => {
    // "found in h1 AND h8" checks each house individually for a named
    // figure, not their sum — not an addition method.
    // The source says "any of the following stars in h1 and h8": a listed
    // figure in EITHER house triggers it; the first matching house is reported.
    const h1 = CHECK_HOUSE(chart, 1);
    const h8 = CHECK_HOUSE(chart, 8);
    const listed = starIdsOf(CH5_H1_H8_DIFFICULT);
    const hit = [h1, h8].find((h) => listed.includes(h.figure.figureId));
    return { housesUsed: [1, 8], steps: [h1.trace.description, h8.trace.description], resultFigure: (hit ?? h1).figure };
  },
  evaluate: (calc) =>
    starIdsOf(CH5_H1_H8_DIFFICULT).some((id) => MATCH_FIGURE(calc.resultFigure, id))
      ? { outcome: 'unfavourable', label: `${calc.resultFigure.figureName} at H${calc.resultFigure.sourceHouses[0]}`, interpretation: "It's not good and it will be difficult to succeed." }
      : { outcome: 'uncertain', label: 'No listed figure at H1 or H8', interpretation: 'The source only lists the difficult figures for H1/H8 — no stated reading for any other figure.' },
};

export const fightWarLocationQuestion: QuestionDefinition = {
  id: 'if-you-will-win-a-fight-war-or',
  title: 'Will I win a fight, war, or court case? (H6/H1+H8 method)',
  categoryId: 'legal-conflict',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
