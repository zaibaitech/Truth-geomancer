// Source: Kanzul Mikban, Chapter 131 — "If Something Was Buried, or Has Been
// Buried, in a Particular Place" (id "if-something-was-buried-or-has-been-buried").
// Three methods.
//
// Method 1: H4 and H6 direction only, fully binary — "if both are downward,
// buried; but if they are not [both downward], nothing was buried" covers
// every case (no gap).
//
// Method 2: H4 and H6 must be BOTH good (verified) AND stable (unsourced) —
// an AND, not an OR, so fortune alone cannot confirm the positive branch.
// It CAN confirm the negative branch whenever either house's fortune isn't
// good (the AND already fails regardless of stability) — "and vice versa"
// in the source's own wording. Kept as one method (not split into direction/
// stability sub-methods like the OR-shaped chapters, since there is no
// direction leg here at all) with an internal uncertain branch for the
// fortune-good/stability-unknown case, matching the chapter 101/125
// precedent for partially-resolvable verified methods.
//
// Method 3: H6 and H8 direction only, positive-trigger-only (no stated
// negative branch this time).
// resultKind 'descriptive': the source's own language is an existence claim
// ("something was buried there" / "nothing was buried there"), not a
// favourable/unfavourable outcome.

import { CHECK_DIRECTION, CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'if-something-was-buried-or-has-been-buried';

const method1: MethodDefinition = {
  id: 'something-buried-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'Method 1: After drawing the chart, check h4 and h6. If both are downward stars, it means something was buried there; but if they are not, nothing was buried there.',
  },
  calculate: (chart) => {
    const h4 = CHECK_HOUSE(chart, 4);
    const h6 = CHECK_HOUSE(chart, 6);
    return { housesUsed: [4, 6], steps: [h4.trace.description, h6.trace.description], resultFigure: h4.figure };
  },
  evaluate: (_calc, chart) => {
    const h4 = CHECK_HOUSE(chart, 4).figure;
    const h6 = CHECK_HOUSE(chart, 6).figure;
    const bothDownward = CHECK_DIRECTION(h4) === 'downward' && CHECK_DIRECTION(h6) === 'downward';
    return bothDownward
      ? { outcome: 'descriptive', label: 'H4 and H6 both downward', interpretation: 'Something was buried there.', descriptiveAnswer: 'buried' }
      : { outcome: 'descriptive', label: 'Not both downward', interpretation: 'Nothing was buried there.', descriptiveAnswer: 'not-buried' };
  },
};

const method2: MethodDefinition = {
  id: 'something-buried-method-2',
  label: 'Method 2',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'Method 2: Also, if h6 and h4 are good and stable stars, then something is buried there, and vice versa.',
  },
  calculate: (chart) => {
    const h4 = CHECK_HOUSE(chart, 4);
    const h6 = CHECK_HOUSE(chart, 6);
    return { housesUsed: [4, 6], steps: [h4.trace.description, h6.trace.description], resultFigure: h6.figure };
  },
  evaluate: (_calc, chart) => {
    const h4 = CHECK_HOUSE(chart, 4).figure.qualities.fortune.value;
    const h6 = CHECK_HOUSE(chart, 6).figure.qualities.fortune.value;
    if (h4 === 'good' && h6 === 'good') {
      return { outcome: 'uncertain', label: 'Both good — stability unknown', interpretation: 'Both H4 and H6 are good, but this rule also requires both to be stable, which this project has no sourced classification for.' };
    }
    return { outcome: 'descriptive', label: 'Not both good', interpretation: "H4 and H6 aren't both good stars, so the AND-condition fails regardless of stability — nothing is buried there.", descriptiveAnswer: 'not-buried' };
  },
};

const method3: MethodDefinition = {
  id: 'something-buried-method-3',
  label: 'Method 3',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: 'Method 3: Also, check h6 and h8. If both are downward stars, then something is buried there.',
  },
  calculate: (chart) => {
    const h6 = CHECK_HOUSE(chart, 6);
    const h8 = CHECK_HOUSE(chart, 8);
    return { housesUsed: [6, 8], steps: [h6.trace.description, h8.trace.description], resultFigure: h6.figure };
  },
  evaluate: (_calc, chart) => {
    const h6 = CHECK_HOUSE(chart, 6).figure;
    const h8 = CHECK_HOUSE(chart, 8).figure;
    const bothDownward = CHECK_DIRECTION(h6) === 'downward' && CHECK_DIRECTION(h8) === 'downward';
    if (bothDownward) {
      return { outcome: 'descriptive', label: 'H6 and H8 both downward', interpretation: 'Something is buried there.', descriptiveAnswer: 'buried' };
    }
    return { outcome: 'uncertain', label: 'Not both downward', interpretation: 'This method only states the positive trigger (both H6 and H8 downward) — the negative case is not addressed.' };
  },
};

export const somethingBuriedQuestion: QuestionDefinition = {
  id: 'if-something-was-buried-or-has-been-buried',
  title: 'Was something buried in this place?',
  categoryId: 'lost-stolen',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1, method2, method3],
};
