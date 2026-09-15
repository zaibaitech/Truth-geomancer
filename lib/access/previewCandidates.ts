// Free-preview CANDIDATES only (Prompt 25, section 8).
//
// None of these is activated as a production FreePreview. This file is a
// documented shortlist — not a decision. Choosing the final one-per-book
// preview is an editorial/product call the Prompt 24 audit explicitly
// deferred to the author, and this task does not make it either.
//
// If a FreePreview instance is ever needed to exercise the domain model
// (e.g. in a test), build it from one of these candidates and label it
// per the DEVELOPMENT_ONLY marker below — never present it as the real
// production choice.
import { MASTER_CANCELLING_METHOD_FEATURE, MASTER_COUNTING_METHOD_FEATURE } from './products';
import type { FreePreviewTarget } from './types';

export interface PreviewCandidate {
  bookId: string;
  chapterId: string;
  chapterLabel: string;
  target: FreePreviewTarget;
  /** Why this is technically suitable as a preview, per the Prompt 24 audit. */
  rationale: string;
  /** What, if anything, still needs an editorial/product decision. */
  decisionRequired: string;
}

export const PREVIEW_CANDIDATES: PreviewCandidate[] = [
  {
    bookId: 'kanzul-mikban',
    chapterId: 'if-you-will-own-a-house-in-your',
    chapterLabel: 'Chapter 146 — "Will I own a house in my life?"',
    target: { kind: 'method', bookId: 'kanzul-mikban', methodId: 'own-house-in-life-method-1' },
    rationale:
      'Single method (no multi-method conflict to explain to a first-time user); full clean 3-way ' +
      'fortune coverage (good/middle-good/bad all defined); no `uncertain` fallback branch — every ' +
      'chart a preview user casts produces a complete, satisfying result.',
    decisionRequired: 'Is this topic (home ownership) the right first impression for the book?',
  },
  {
    bookId: 'kanzul-mikban',
    chapterId: 'if-you-will-get-your-debts-deposit-or',
    chapterLabel: 'Chapter 144 — "Will I get my debts, deposit, or savings back?"',
    target: { kind: 'method', bookId: 'kanzul-mikban', methodId: 'debts-deposit-back-method-1' },
    rationale:
      'Also single-method, but has one `uncertain` branch (a "good" result that does not repeat ' +
      'elsewhere in the chart) — a preview user could land on an unresolved outcome on their one ' +
      'free try. Listed as a secondary candidate for this reason.',
    decisionRequired: 'Whether an occasional inconclusive preview outcome is acceptable.',
  },
  {
    bookId: 'master-of-geomancy-vol-1',
    chapterId: 'drawing-a-chart',
    chapterLabel: 'Chapter 1 — Cancelling Method',
    target: { kind: 'feature', bookId: 'master-of-geomancy-vol-1', featureKey: MASTER_CANCELLING_METHOD_FEATURE },
    rationale:
      'Visually immediate ("cancel pairs, see what is left") — mathematically equivalent to the ' +
      'engine’s own parity rule, likely the more intuitive of the book’s two casting-teaching ' +
      'methods for a first-time user.',
    decisionRequired: 'Whether Cancelling is preferred over Counting as the single free one.',
  },
  {
    bookId: 'master-of-geomancy-vol-1',
    chapterId: 'drawing-a-chart',
    chapterLabel: 'Chapter 1 — Counting Method',
    target: { kind: 'feature', bookId: 'master-of-geomancy-vol-1', featureKey: MASTER_COUNTING_METHOD_FEATURE },
    rationale:
      'Demonstrates the book’s own whole-star lookup convention directly from its worked examples ' +
      '— more source-authentic but requires slightly more explanation than Cancelling.',
    decisionRequired: 'Same as Cancelling Method, plus whether the lookup convention needs more onboarding text.',
  },
];
