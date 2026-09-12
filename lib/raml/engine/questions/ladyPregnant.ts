// Source: Kanzul Mikban, Chapter 47 — "If a Lady Is Pregnant or Not" (id
// "if-a-lady-is-pregnant-or-not"), Methods 1-2, PLUS the unnumbered
// "Additional Methods — If You Want to Know If She's Pregnant" fragment
// that immediately follows Chapter 56 in the source (id
// "s-if-you-want-to-know-if-she"), Methods 1-2 only — that fragment
// explicitly extends THIS exact question ("If You Want to Know If She's
// Pregnant"), so its first two methods are registered here as Method 3/4
// rather than left stranded under their own unnumbered, unregistered
// intention. Its own Method 3 (predicting the BABY'S sex via a male/female
// star classification) answers a different question — see
// childGender.ts — and is not repeated here.
//
// Chapter 47's own two methods each state only a POSITIVE trigger ("if you
// found Mahadi/Ibrahim, she's pregnant") with no defined negative branch,
// so the "neither figure present" case is left uncertain rather than
// assumed to mean "not pregnant" — same pattern as willItRain.ts. The
// fragment's two methods are the more complete pair, covering both
// directions/fortunes.
//
// resultKind is 'descriptive': pregnancy is a factual yes/no answer, not a
// favourable/unfavourable value judgment the source itself never makes.

import { ADD_MULTIPLE_HOUSES, CHECK_DIRECTION, CHECK_HOUSE, MATCH_FIGURE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-a-lady-is-pregnant-or-not';
const FRAGMENT_ID = 's-if-you-want-to-know-if-she';

const method1: MethodDefinition = {
  id: 'lady-pregnant-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "After casting the chart, check h5. If you found Mahadi, it means she's pregnant.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 5);
    return { housesUsed: [5], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const matches = MATCH_FIGURE(calc.resultFigure, 'mahadi');
    return matches
      ? { outcome: 'descriptive', label: 'Pregnant', interpretation: "Mahadi is at H5 — she's pregnant.", descriptiveAnswer: 'pregnant' }
      : { outcome: 'uncertain', label: 'Not Mahadi at H5', interpretation: 'The source only defines the "Mahadi at H5" trigger — this is not addressed.' };
  },
};

const method2: MethodDefinition = {
  id: 'lady-pregnant-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "If you also found Ibrahim in h5, it means she's pregnant.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 5);
    return { housesUsed: [5], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const matches = MATCH_FIGURE(calc.resultFigure, 'ibrahim');
    return matches
      ? { outcome: 'descriptive', label: 'Pregnant', interpretation: "Ibrahim is at H5 — she's pregnant.", descriptiveAnswer: 'pregnant' }
      : { outcome: 'uncertain', label: 'Not Ibrahim at H5', interpretation: 'The source only defines the "Ibrahim at H5" trigger — this is not addressed.' };
  },
};

const method3: MethodDefinition = {
  id: 'lady-pregnant-method-3',
  label: 'Method 3',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: FRAGMENT_ID,
    quote: "Pick h5 and h15 and add them. If it's an upward star, she's not pregnant; but if it's a downward star, she's pregnant.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [5, 15]);
    return { housesUsed: [5, 15], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const direction = CHECK_DIRECTION(calc.resultFigure);
    if (direction === 'downward') return { outcome: 'descriptive', label: 'Pregnant', interpretation: "Downward star — she's pregnant.", descriptiveAnswer: 'pregnant' };
    if (direction === 'upward') return { outcome: 'descriptive', label: 'Not pregnant', interpretation: "Upward star — she's not pregnant.", descriptiveAnswer: 'not-pregnant' };
    return { outcome: 'uncertain', label: 'Level star', interpretation: 'This method only addresses a clearly upward or downward result.' };
  },
};

const method4: MethodDefinition = {
  id: 'lady-pregnant-method-4',
  label: 'Method 4',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: FRAGMENT_ID,
    quote: "After casting the chart, pick h7 and h10 and add them. If it's a good star, she's pregnant; but if it's a bad star, she's not.",
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [7, 10]);
    return { housesUsed: [7, 10], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'descriptive', label: 'Pregnant', interpretation: "Good star — she's pregnant.", descriptiveAnswer: 'pregnant' };
    if (fortune === 'bad') return { outcome: 'descriptive', label: 'Not pregnant', interpretation: "Bad star — she's not.", descriptiveAnswer: 'not-pregnant' };
    return { outcome: 'uncertain', label: 'Middle-good star', interpretation: 'This method only addresses clearly good or bad results.' };
  },
};

export const ladyPregnantQuestion: QuestionDefinition = {
  id: 'if-a-lady-is-pregnant-or-not',
  title: 'Is she pregnant?',
  categoryId: 'family-loved-ones',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1, method2, method3, method4],
};
