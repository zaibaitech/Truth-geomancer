// Free-preview POLICY — the production decision previewCandidates.ts
// explicitly deferred (Prompt 29). Exactly one preview per book, built
// from the FreePreview/FreePreviewTarget shapes already defined in
// types.ts (Prompt 25) and already enforced atomically by
// lib/server/previews.ts's consumePreviewUse (Prompt 26) — nothing here
// invents a new persistence shape or a new limit-tracking mechanism.
//
// `limit` is read from `preview.maxUses`, never hard-coded elsewhere in
// the app — a future "3 free uses" or "promotional preview" policy is a
// one-line change to the FreePreview objects below, not a redesign of the
// database, the consumption function, or any route.
//
// Candidate verification (Prompt 29, Phase 3), checked against the real
// QUESTION_REGISTRY/content at the time this policy was written:
//  - Kanzul: 'own-house-in-life-method-1' (chapter 'if-you-will-own-a-
//    house-in-your', Kanzul Mikban Chapter 146) — status 'verified', full
//    3-way outcome coverage, single method (no multi-method conflict to
//    explain on a first try). Matches previewCandidates.ts's primary
//    Kanzul candidate.
//  - Master: the Counting Method feature (MASTER_COUNTING_METHOD_FEATURE)
//    — chosen over Cancelling Method (previewCandidates.ts's other
//    candidate) as the book's own first-taught, source-authentic
//    procedure. Both remain editorially valid per previewCandidates.ts;
//    this is the one implementation decision this prompt makes. Neither
//    Master procedure computes anything from user input (both are fixed
//    walkthroughs of the source's own two worked examples — see
//    components/books/practice/CountingMethodPractice.tsx), so "free
//    preview" for Master means one-time SERVER-AUTHORIZED access to view
//    that already-existing, always-public walkthrough — not a new
//    calculation.
import { MASTER_COUNTING_METHOD_FEATURE } from './products';
import type { FreePreview } from './types';

export interface PreviewPolicy {
  bookId: string;
  preview: FreePreview;
  /** UI-facing label only — never used for any access decision. */
  label: string;
}

const KANZUL_PREVIEW: FreePreview = {
  id: 'preview-kanzul-mikban-v1',
  target: { kind: 'method', bookId: 'kanzul-mikban', methodId: 'own-house-in-life-method-1' },
  maxUses: 1,
  active: true,
};

const MASTER_PREVIEW: FreePreview = {
  id: 'preview-master-of-geomancy-vol-1-v1',
  target: { kind: 'feature', bookId: 'master-of-geomancy-vol-1', featureKey: MASTER_COUNTING_METHOD_FEATURE },
  maxUses: 1,
  active: true,
};

export const PREVIEW_POLICIES: Record<string, PreviewPolicy> = {
  'kanzul-mikban': {
    bookId: 'kanzul-mikban',
    preview: KANZUL_PREVIEW,
    label: '"Will I own a house in my life?" (Chapter 146)',
  },
  'master-of-geomancy-vol-1': {
    bookId: 'master-of-geomancy-vol-1',
    preview: MASTER_PREVIEW,
    label: 'The Counting Method (Chapter 1)',
  },
};

export function getPreviewPolicy(bookId: string): PreviewPolicy | undefined {
  return PREVIEW_POLICIES[bookId];
}
