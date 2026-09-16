// Server-only free-preview execution (Prompt 29). Composes three already-
// existing, unmodified pieces — canAccessForUser() (entitlement override,
// Phase 7), consumePreviewUse() (atomic consumption, Phase 6, unchanged
// since Prompt 26), and the engine's own runReading() (the SAME
// calculation path every paying Kanzul practice request uses) — into one
// server-side decision. This file adds no new persistence shape and no
// new geomancy rule: it only decides WHICH already-verified method/
// feature a preview request is allowed to reach, derived ENTIRELY from
// lib/access/previewPolicy.ts, never from anything the client sends.
import { QUESTION_REGISTRY } from '@/lib/raml/engine/questions';
import { runReading } from '@/lib/raml/engine';
import type { ReadingMethodRow } from '@/lib/raml/engine/reading';
import type { Chart } from '@/lib/raml/casting';
import { KM_CHAPTER_META } from '@/content/manuscripts/kanzulMikbanMeta';
import { getPreviewPolicy } from '@/lib/access/previewPolicy';
import { canAccessForUser } from './accessService';
import { consumePreviewUse, getPreviewUsage } from './previews';
import type { Db } from './db';

export type PreviewStatus = 'entitled' | 'available' | 'consumed' | 'unconfigured';

/** Read-only — never consumes, never mutates. Safe to call from a Server
 * Component page render (Phase 12: the UI may display status, but must
 * fail closed rather than assume "available"). */
export async function getPreviewStatusForUser(db: Db, userId: string, bookId: string): Promise<PreviewStatus> {
  if (await canAccessForUser(db, userId, { kind: 'book', bookId })) return 'entitled';

  const policy = getPreviewPolicy(bookId);
  if (!policy) return 'unconfigured';

  const usage = await getPreviewUsage(db, userId, policy.preview.id);
  return usage && usage.status === 'exhausted' ? 'consumed' : 'available';
}

/** Finds the verified method a preview's methodId points at, scanning the
 * real QUESTION_REGISTRY the same way practiceService.ts's own lookup
 * does — never a second, separately maintained method list. A linear scan
 * over ~140 questions, run only for the one configured preview method, so
 * performance is not a concern. */
function findPreviewMethod(methodId: string) {
  for (const question of Object.values(QUESTION_REGISTRY)) {
    const method = question.methods.find((m) => m.id === methodId && m.status === 'verified');
    if (method) return { question, method };
  }
  return null;
}

export type PreviewExecuteResult =
  | { ok: true; entitled: true }
  | {
      ok: true;
      entitled: false;
      kind: 'method';
      questionId: string;
      label: string;
      sourceQuote: string;
      sourceLabel: string;
      row: ReadingMethodRow | null;
    }
  | { ok: true; entitled: false; kind: 'feature'; featureKey: string }
  | { ok: false; reason: 'unconfigured-book' | 'inactive-preview' | 'exhausted' | 'chart-required' };

/**
 * The one entry point a preview route should call. `chart` is required
 * only when the configured preview target is a method (Kanzul); ignored
 * for a feature target (Master — see previewPolicy.ts's own comment on
 * why the Master procedures compute nothing from user input).
 *
 * ENTITLEMENT OVERRIDE (Phase 7): checked FIRST, before anything preview-
 * related is even looked up — an entitled user never touches the preview
 * system at all, so a preview can never be consumed by, granted to, or
 * taken away from someone who already has real access.
 *
 * VALIDATION BEFORE CONSUMPTION (Phase 6/9): a method-preview request
 * missing its required chart is rejected BEFORE consumePreviewUse() is
 * ever called — a malformed request must never burn the user's one use.
 */
export async function executeBookPreview(db: Db, userId: string, bookId: string, chart: Chart | null): Promise<PreviewExecuteResult> {
  if (await canAccessForUser(db, userId, { kind: 'book', bookId })) {
    return { ok: true, entitled: true };
  }

  const policy = getPreviewPolicy(bookId);
  if (!policy || !policy.preview.active) return { ok: false, reason: 'unconfigured-book' };

  const target = policy.preview.target;

  if (target.kind === 'method') {
    if (!chart) return { ok: false, reason: 'chart-required' };

    const found = findPreviewMethod(target.methodId);
    if (!found) return { ok: false, reason: 'unconfigured-book' }; // defensive: policy references a method no longer in the registry

    const consume = await consumePreviewUse(db, userId, policy.preview);
    if (!consume.ok) {
      return { ok: false, reason: consume.reason === 'inactive-preview' ? 'inactive-preview' : 'exhausted' };
    }

    const chapterMeta = KM_CHAPTER_META.find((c) => c.id === found.question.id);
    const sourceLabel = chapterMeta?.number != null ? `Kanzul Mikban, Chapter ${chapterMeta.number}` : 'Kanzul Mikban';

    const reading = runReading(chart, found.question.id);
    const row = reading?.methodResults.find((m) => m.id === found.method.id) ?? null;

    return {
      ok: true,
      entitled: false,
      kind: 'method',
      questionId: found.question.id,
      label: found.method.label,
      sourceQuote: found.method.source.quote,
      sourceLabel,
      row,
    };
  }

  // target.kind === 'feature' — no calculation, no chart needed (see
  // previewPolicy.ts's comment). Consuming the preview IS the "execution":
  // it is the one-time server authorization to view the already-existing,
  // always-public walkthrough component.
  const consume = await consumePreviewUse(db, userId, policy.preview);
  if (!consume.ok) {
    return { ok: false, reason: consume.reason === 'inactive-preview' ? 'inactive-preview' : 'exhausted' };
  }

  return { ok: true, entitled: false, kind: 'feature', featureKey: target.featureKey };
}
