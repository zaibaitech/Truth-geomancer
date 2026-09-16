// Server-only Kanzul method-practice execution (Prompt 27C). Reuses
// lib/raml/questionCatalog.ts's existing chapter->question resolution
// (catalogEntry — unchanged) and lib/raml/engine's existing runReading()
// (unchanged) — this file adds no calculation or matching logic of its
// own, only a server-side, entitlement-gated call site for them.
//
// ACCESS: unlike readingService.ts (the free Overview flow), Kanzul method
// PRACTICE has always required its own entitlement — see
// app/raml/practice/[chapterId]/[methodId]/page.tsx's existing page-level
// canAccessForUser({kind:'method',...}) gate. That page-level gate alone
// didn't stop the method corpus from entering the client bundle (the actual
// Prompt 27B/27C leak); this service closes that by making the quote and
// the computed result available ONLY through this gated server call,
// never through a client-side import of the registry.
import { QUESTION_REGISTRY } from '@/lib/raml/engine/questions';
import { runReading } from '@/lib/raml/engine';
import type { ReadingMethodRow } from '@/lib/raml/engine/reading';
import type { Chart } from '@/lib/raml/casting';
import { catalogEntry } from '@/lib/raml/questionCatalog';
import { canAccessForUser } from '../accessService';
import type { Db } from '../db';

export type PracticeMethodResult =
  | {
      ok: true;
      questionId: string;
      label: string;
      sourceQuote: string;
      sourceLabel: string;
      /** Only present when a chart was supplied — the same per-method row
       * ResultTabs/ReadingTab already render via ReadingMethodRow, computed
       * by the SAME runReading() the free Overview flow uses. */
      row: ReadingMethodRow | null;
    }
  | { ok: false; reason: 'unknown-method' | 'unauthorized' };

/** Resolves one Kanzul chapter+method for the practice screen. `chart` is
 * optional: omitted for the intro screen (before a chart exists — quote/
 * label/sourceLabel only), supplied once the user has cast one (adds the
 * computed walkthrough row). Both cases require the same entitlement. */
export function getPracticeMethodForUser(
  db: Db,
  userId: string,
  chapterId: string,
  methodId: string,
  chart: Chart | null,
): PracticeMethodResult {
  const entry = catalogEntry(chapterId);
  if (!entry || entry.engineQuestionId === null || entry.engineQuestionId !== chapterId) {
    return { ok: false, reason: 'unknown-method' };
  }
  const question = QUESTION_REGISTRY[entry.engineQuestionId];
  const method = question?.methods.find((m) => m.id === methodId && m.status === 'verified');
  if (!question || !method) return { ok: false, reason: 'unknown-method' };

  if (!canAccessForUser(db, userId, { kind: 'method', bookId: 'kanzul-mikban', methodId })) {
    return { ok: false, reason: 'unauthorized' };
  }

  const sourceLabel = entry.chapterNumber !== null ? `Kanzul Mikban, Chapter ${entry.chapterNumber}` : 'Kanzul Mikban';

  let row: ReadingMethodRow | null = null;
  if (chart) {
    const reading = runReading(chart, question.id);
    row = reading?.methodResults.find((m) => m.id === method.id) ?? null;
  }

  return { ok: true, questionId: question.id, label: method.label, sourceQuote: method.source.quote, sourceLabel, row };
}
