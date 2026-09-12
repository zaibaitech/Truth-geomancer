// Source: Kanzul Mikban, Chapter 64 — "If a Marriage Will Last Forever" (id
// "if-a-marriage-will-last-forever"). Method 1 is fully computable via the
// existing good/middle-good/bad classification. Method 2's own source
// text gives the calculation (H4+H11+H7+H14) but the sentence stops at
// "check if it's a good, middle-good, or a bad star" — it never states
// what any of the three results actually MEANS for this question. That's
// a different gap from an omitted figure (the calculation is complete)
// and from an ambiguous split (there's no stated interpretation to be
// ambiguous about): the passage itself was never finished. Left uncertain
// rather than assumed to mean the same thing as Method 1 — that would be
// inventing a "same as above" rule the source never actually states.
//
// The unnumbered "Someone's Behavior (also see Chapter Forty-Three)"
// fragment that follows this chapter uses the identical H3+H7+H11+H14,
// +H12 calculation already implemented as futureSpouseCharacter.ts's own
// Method 1 (chapter 43) — its own title cross-references chapter 43
// directly, confirming it's a restatement, not a new rule. Not registered
// separately; see COVERAGE.md.

import { ADD_MULTIPLE_HOUSES, CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-a-marriage-will-last-forever';

const method1: MethodDefinition = {
  id: 'marriage-last-forever-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      "After drawing the chart, check h3. If it's a good star, it will last forever. If it's a middle-good star, they will have disagreements all the time, or no peace in the marriage. If it's a bad star, it won't last forever.",
  },
  calculate: (chart) => {
    const { figure, trace } = CHECK_HOUSE(chart, 3);
    return { housesUsed: [3], steps: [trace.description], resultFigure: figure };
  },
  evaluate: (calc) => {
    const fortune = calc.resultFigure.qualities.fortune.value;
    if (fortune === 'good') return { outcome: 'favourable', label: 'Good star', interpretation: 'It will last forever.' };
    if (fortune === 'middleGood') return { outcome: 'mixed', label: 'Middle-good star', interpretation: 'They will have disagreements all the time, or no peace in the marriage.' };
    return { outcome: 'unfavourable', label: 'Bad star', interpretation: "It won't last forever." };
  },
};

const method2: MethodDefinition = {
  id: 'marriage-last-forever-method-2',
  label: 'Method 2',
  status: 'uncertain',
  reviewReasonCode: 'interpretation_not_stated',
  reviewNote:
    'The source gives the full calculation (H4+H11+H7+H14, added) and says to check if the result is good/middle-good/bad, but the passage ends there — it never states what any of the three results means for this question. Withheld rather than assumed to match Method 1\'s own interpretation, which the source never says either.',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'After the chart is drawn, pick h4, h11, h7 and 14 and add them. Check if it\'s a good, middle-good, or a bad star.',
  },
  calculate: (chart) => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [4, 11, 7, 14]);
    return { housesUsed: [4, 11, 7, 14], steps: [trace.description], resultFigure: figure };
  },
  evaluate: () => ({
    outcome: 'uncertain',
    label: 'Interpretation not stated',
    interpretation: 'This method cannot currently be verified — see the review note.',
  }),
};

export const marriageLastForeverQuestion: QuestionDefinition = {
  id: 'if-a-marriage-will-last-forever',
  title: 'Will this marriage last forever?',
  categoryId: 'love-couple',
  chapterId: CHAPTER_ID,
  methods: [method1, method2],
};
