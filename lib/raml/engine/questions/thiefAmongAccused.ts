// Source: Kanzul Mikban, Chapter 130 — "The Thief from Among the Accused
// People" (id "the-thief-from-among-the-accused-people"). Two source
// methods, naming an external physical setup (assigning named people to a
// side) that this engine cannot know about — same as every other Kanzul
// Mikban method that asks the geomancer to correlate a classical answer
// ("the person on the right" / "the East side") with a real person the
// querent placed there outside the casting itself; the app computes the
// classical side, exactly as it already does for compass directions
// (chapter 134) — it does not need a new contextual/product input to do so.
//
// Method 1: H4's "downward or stable star" / "upward or unstable star" idiom
// again, both branches stated — same direction/stability split as chapter
// 129, with the SAME full-binary direction reasoning (downward and upward
// each independently satisfy their own branch's OR, regardless of
// stability; only a level H4 needs the unsourced stability axis). "If there
// are many people, do this for all of them" is a usage note for repeated
// pairwise castings, not a second calculation this one reading needs to
// encode.
//
// Method 2 (directional): compares the total single-dot (opened-line) count
// of the Umuhat (h1-4) against the Banat (h5-8) — reusing COUNT_OPENED_LINES
// with the SAME Umuhat=East / Banat=West mapping chapter 134 states
// explicitly a few chapters later. A tie is not addressed.
// resultKind 'descriptive': identifying which side/position, not a
// favourable/unfavourable outcome.

import { CHECK_DIRECTION, CHECK_HOUSE, COUNT_OPENED_LINES } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'the-thief-from-among-the-accused-people';
const QUOTE_M1 =
  "Method 1: After drawing the chart, pick 2 people's names and place one on your right and one on your left. Then, after drawing the chart, check h4 — if it is a downward or stable star, then it's the person on the right; but if it's an upward or unstable star, it's the person on the left. If there are many people, do this for all of them.";
const QUOTE_M2 =
  "Method 2 (directional method): After drawing the chart with that intention, place the accused people's names one on the East side and the other on the West side (see the diagram of the four directions in the original notebook). Draw the chart and divide it into two: the Umuhat (houses 1-4) and any stars under them on one side, and the Banat (houses 5-8) and any stars under them on the other. Count the single dots of each star on each side and check which side has more dots. If the East side has more single dots, that is where the thief is, and vice versa.";

const method1a: MethodDefinition = {
  id: 'thief-among-accused-method-1-direction',
  label: 'Method 1 (direction)',
  status: 'verified',
  source: { book: 'kanzul-mikban', chapterId: CHAPTER_ID, quote: QUOTE_M1 },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 4);
    return { housesUsed: [4], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const direction = CHECK_DIRECTION(calc.resultFigure);
    if (direction === 'downward') {
      return { outcome: 'descriptive', label: 'H4 downward', interpretation: "It's the person on the right.", descriptiveAnswer: 'right-side' };
    }
    if (direction === 'upward') {
      return { outcome: 'descriptive', label: 'H4 upward', interpretation: "It's the person on the left.", descriptiveAnswer: 'left-side' };
    }
    return { outcome: 'uncertain', label: 'H4 level', interpretation: 'H4 is neither upward nor downward — direction alone cannot resolve this (stability could still decide it, but is unsourced).' };
  },
};

const method1b: MethodDefinition = {
  id: 'thief-among-accused-method-1-stability',
  label: 'Method 1 (stability)',
  status: 'needs_review',
  reviewReasonCode: 'stability_classification_unsourced',
  reviewNote: 'This alternate reading crosses on stability (stable -> right, unstable -> left) rather than direction — the `stability` axis has no sourced classification project-wide.',
  source: { book: 'kanzul-mikban', chapterId: CHAPTER_ID, quote: QUOTE_M1 },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 4);
    return { housesUsed: [4], steps: [trace.description], resultFigure: figure };
  },
  evaluate: () => ({ outcome: 'uncertain', label: 'Stability not classified', interpretation: 'This project has no sourced stability classification for any figure.' }),
};

const method2: MethodDefinition = {
  id: 'thief-among-accused-method-2',
  label: 'Method 2 (directional)',
  status: 'verified',
  source: { book: 'kanzul-mikban', chapterId: CHAPTER_ID, quote: QUOTE_M2 },
  calculate: (chart) => {
    const umuhat = COUNT_OPENED_LINES(chart, [1, 2, 3, 4]);
    const banat = COUNT_OPENED_LINES(chart, [5, 6, 7, 8]);
    const { figure } = CHECK_HOUSE(chart, 1);
    return {
      housesUsed: [1, 2, 3, 4, 5, 6, 7, 8],
      steps: [umuhat.trace.description, banat.trace.description],
      resultFigure: figure, // representative reference — this method compares dot totals, not a single figure
    };
  },
  evaluate: (_calc, chart) => {
    const umuhat = COUNT_OPENED_LINES(chart, [1, 2, 3, 4]).count;
    const banat = COUNT_OPENED_LINES(chart, [5, 6, 7, 8]).count;
    if (umuhat > banat) {
      return { outcome: 'descriptive', label: 'East (Umuhat) has more', interpretation: `Umuhat: ${umuhat} single dots vs. Banat: ${banat} — the East side has more, so that is where the thief is.`, descriptiveAnswer: 'east' };
    }
    if (banat > umuhat) {
      return { outcome: 'descriptive', label: 'West (Banat) has more', interpretation: `Banat: ${banat} single dots vs. Umuhat: ${umuhat} — the West side has more, so that is where the thief is.`, descriptiveAnswer: 'west' };
    }
    return { outcome: 'uncertain', label: 'Tied dot count', interpretation: `Umuhat and Banat both have ${umuhat} single dots — the source does not address a tie.` };
  },
};

export const thiefAmongAccusedQuestion: QuestionDefinition = {
  id: 'the-thief-from-among-the-accused-people',
  title: 'Which of the accused people is the thief?',
  categoryId: 'legal-conflict',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1a, method1b, method2],
};
