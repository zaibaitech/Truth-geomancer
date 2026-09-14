// "Try this method" — the practice/learning layer (Prompt 20). This file
// decides only two things, both by reading metadata that already exists:
// which methods are safe to practice, and where each one's paragraph lives
// in the chapter's own prose. It runs no geomancy of its own — practicing a
// method still goes through `runReading()` (lib/raml/engine), the exact
// pipeline the Reading flow uses. Nothing here parses arbitrary prose,
// infers a missing house number, or invents an operation: a method paragraph
// is matched to its method definition by an exact, literal prefix
// ("Method 1:") against that method's own already-known `label` — never by
// guessing from the surrounding words.
import { KM_CHAPTERS } from '@/content/manuscripts/kanzul-mikban';
import { QUESTION_REGISTRY } from './engine/questions';
import type { MethodDefinition } from './engine/types';
import { catalogEntry } from './questionCatalog';
import { listReadings, type ReadingRecord } from './history';
import { buildChart, type Chart } from './casting';

export interface PracticableMethod {
  questionId: string;
  chapterId: string;
  method: MethodDefinition;
  /** Index into the chapter's own `paragraphs` array whose text is this
   * method's source paragraph, or null when no paragraph could be matched
   * (the CTA then has nowhere safe to attach inline and is simply omitted
   * there — see ChapterMethodPractice.tsx). */
  paragraphIndex: number | null;
}

/** A method is safe to practice only when it is itself `verified` — the
 * same bar `COMPARE_RESULTS`/`ruleEngine.ts` already use to decide whether a
 * method counts toward a reading at all. A `needs_review`/`uncertain`
 * method's `calculate()` can throw (see e.g. money-method-4's Sirri Sa'ael),
 * so building a walkthrough around it would either crash or fabricate a
 * result the source does not actually support. This is the ONLY gate: no
 * separate "resultKind" exclusion, because a verified descriptive method
 * (e.g. "which direction") computes through the exact same, fully
 * structured pipeline as a verified outcome method — excluding it would be
 * arbitrary, not safety. */
function isPracticable(method: MethodDefinition): boolean {
  return method.status === 'verified';
}

/** Exact, literal match only — the one deterministic signal available
 * without parsing prose: every KM chapter paragraph that states a method
 * begins with that method's own `label` verbatim (confirmed across the
 * transcription, e.g. "Method 1: After drawing the chart, pick h1 and
 * h8..."). If a future chapter's wording ever doesn't follow this, the
 * method simply gets no inline CTA rather than a guessed one. */
function findParagraphIndex(paragraphs: string[], method: MethodDefinition): number | null {
  const prefix = `${method.label}:`;
  const i = paragraphs.findIndex((p) => p.trimStart().startsWith(prefix));
  return i === -1 ? null : i;
}

/** Every practicable method for one KM chapter, in method order. Empty for
 * a chapter with no engine question, no verified methods, or that resolves
 * (via a consolidated duplicate) to a question whose own chapter is
 * elsewhere — a duplicate passage is still text-only here; its canonical
 * chapter is where the practice CTA belongs. */
export function practicableMethodsForChapter(chapterId: string): PracticableMethod[] {
  const entry = catalogEntry(chapterId);
  if (!entry || entry.engineQuestionId === null) return [];
  // A consolidated duplicate resolves to another chapter's question; only
  // that question's OWN chapter gets the inline CTA, so this chapter's
  // prose is never wired to a method whose houses/paragraph don't actually
  // belong to it.
  if (entry.engineQuestionId !== chapterId) return [];

  const question = QUESTION_REGISTRY[entry.engineQuestionId];
  if (!question) return [];
  const chapter = KM_CHAPTERS.find((c) => c.id === chapterId);
  if (!chapter) return [];

  return question.methods.filter(isPracticable).map((method) => ({
    questionId: question.id,
    chapterId,
    method,
    paragraphIndex: findParagraphIndex(chapter.paragraphs, method),
  }));
}

/** Resolve one specific method for the practice route. Returns null for
 * anything not practicable — an unknown chapter, an unknown method id, or a
 * method that exists but is not `verified` — so the practice screen can
 * show its own honest "not available" state instead of ever executing an
 * unverified method. */
export function findPracticableMethod(chapterId: string, methodId: string): PracticableMethod | null {
  return practicableMethodsForChapter(chapterId).find((m) => m.method.id === methodId) ?? null;
}

/** Book + chapter number, formatted the same way the rest of the app does
 * (`reading.ts`'s `sourceLabelFor`), duplicated here in miniature because
 * this module only ever deals with Kanzul Mikban chapters (the only book
 * with engine-backed methods) — never a calculation, just a label. */
export function chapterSourceLabel(chapterId: string): string {
  const chapter = KM_CHAPTERS.find((c) => c.id === chapterId);
  return chapter?.number != null ? `Kanzul Mikban, Chapter ${chapter.number}` : 'Kanzul Mikban';
}

/** The most recently cast chart already on this device, if any — reused
 * exactly as `history.ts` reconstructs one for the History screen
 * (`buildChart(record.mothers)`), never a second casting/reduction
 * implementation. Every chart has the same 16 houses regardless of which
 * question (if any) it was originally cast for, so it is structurally
 * compatible with every verified method here; there is no chart shape a
 * method could require that an ordinary cast chart would lack. */
export function mostRecentChart(): { chart: Chart; record: ReadingRecord } | null {
  const [record] = listReadings();
  if (!record) return null;
  return { chart: buildChart(record.mothers), record };
}
