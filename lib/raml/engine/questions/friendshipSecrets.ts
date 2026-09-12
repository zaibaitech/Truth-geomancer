// Source: Kanzul Mikban, unnumbered fragment after Chapter 85 — "Additional
// Topic — Secrets Between Two Friends Who Follow Each Other in the Chart"
// (id "secrets-between-two-friends-who-follow-each-other"). One method.
// The source's own condition is an OR across two different axes: "both
// houses are good stars, OR stable stars". The fortune half is verified
// and checked directly; the stability half can never be verified (see
// friendshipFuture.ts). Because both halves lead to the SAME verdict
// (secrets kept), a true fortune-check is decisive on its own — but a
// FALSE fortune-check is NOT decisive, since the unverifiable stability
// half could still independently be true. So: both-good -> a real
// verified "secrets kept" answer; anything else -> uncertain, not
// "secrets come out" (that would silently assume the stability half is
// also false, which this project cannot know). resultKind 'descriptive':
// a fact about a friendship's discretion, not itself favourable/
// unfavourable.

import { CHECK_HOUSE } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';

const CHAPTER_ID = 'secrets-between-two-friends-who-follow-each-other';

const method1: MethodDefinition = {
  id: 'friendship-secrets-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote:
      'After casting the chart, check h4 and h15. If both houses are good stars, or stable stars, then there can be a lot of secrets, and neither will tell the secrets to anyone. But if not, the secrets will come out all the time.',
  },
  calculate: (chart) => {
    const h4 = CHECK_HOUSE(chart, 4);
    const h15 = CHECK_HOUSE(chart, 15);
    return { housesUsed: [4, 15], steps: [h4.trace.description, h15.trace.description], resultFigure: h15.figure };
  },
  evaluate: (_calc, chart) => {
    const bothGood = [4, 15].every((n) => CHECK_HOUSE(chart, n).figure.qualities.fortune.value === 'good');
    if (bothGood) {
      return { outcome: 'descriptive', label: 'Secrets kept', interpretation: 'There can be a lot of secrets, and neither will tell them to anyone.', descriptiveAnswer: 'secrets-kept' };
    }
    return {
      outcome: 'uncertain',
      label: 'Not both good',
      interpretation:
        "H4 and H15 are not both good stars — this rule's other, unverifiable path (both stable stars) could still apply, so no confident answer either way.",
    };
  },
};

export const friendshipSecretsQuestion: QuestionDefinition = {
  id: 'secrets-between-two-friends-who-follow-each-other',
  title: 'Will our secrets stay between us?',
  categoryId: 'family-loved-ones',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
