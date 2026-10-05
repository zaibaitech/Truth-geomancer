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
//
// PROMPT 27 EDIT (protected-content migration): this module used to import
// the full, protected Kanzul Mikban chapter text (`KM_CHAPTERS`, every
// chapter's complete paragraphs) just to (a) confirm a chapter id exists
// and (b) look up its `.number` for `chapterSourceLabel`. Neither needs the
// actual chapter text, so both now read the public `KM_CHAPTER_META`
// export instead. Paragraph MATCHING (`findParagraphIndex`, needed only by
// the book reader's inline CTA placement) is now something the CALLER
// supplies explicitly via an optional `paragraphs` argument, rather than
// this module fetching it itself — the caller that actually has authorized
// access to the chapter text (the server-rendered reader) already holds
// it; a caller that doesn't need paragraph matching (e.g.
// MethodPracticeFlow.tsx, a 'use client' component) simply omits it and
// gets `paragraphIndex: null`, with no chapter text ever entering its
// import graph. This is a structural fix, not a policy change: every
// method's own `status === 'verified'` gate, and every other output shape,
// is unchanged.
import { KM_CHAPTER_META } from '@/content/manuscripts/kanzulMikbanMeta';
// Prompt 27C (server-side reading execution migration): this module used to
// import the engine's own QUESTION_REGISTRY (every question's full
// MethodDefinition, including its protected source.quote and its
// calculate()/evaluate() functions) just to check a method's id/label/
// verified-status — none of which needs the quote or the functions. Reading
// the precomputed public metadata instead means every client-reachable
// caller of this module (MethodPracticeFlow.tsx, lib/access/products.ts,
// lib/offline/bookOfflineUrls.ts) no longer pulls the full engine into its
// import graph. A caller that genuinely needs the quote and a live
// computed result (MethodPracticeFlow.tsx) now fetches it from the server
// practice route instead — see lib/server/raml/practiceService.ts.
import { QUESTION_REGISTRY_META, type PublicMethodMeta } from './questionRegistryMeta';
import { catalogEntry } from './questionCatalog';
import { listReadings, saveReading, type PracticeRef, type ReadingRecord } from './history';
import { buildChart, type Chart } from './casting';
import type { Pattern } from '@/content/stars';
import { resolveQuestionCasting } from './engine/castingRequirement';
import { resolveEngineQuestionId } from './questionAvailability';
// Type-only — erased at compile time, so this adds nothing to the client
// bundle (unlike importing a value from engine/reading.ts, which this file
// deliberately avoids elsewhere for that reason). Needed only to type
// `practiceResultState`'s parameter below.
import type { ReadingMethodRow } from './engine/reading';

export interface PracticableMethod {
  questionId: string;
  chapterId: string;
  method: PublicMethodMeta;
  /** Index into the chapter's own `paragraphs` array whose text is this
   * method's source paragraph, or null when no paragraph could be matched,
   * OR when the caller didn't supply `paragraphs` at all (see module
   * comment) — the CTA then has nowhere safe to attach inline and is
   * simply omitted there (see ChapterMethodPractice.tsx). */
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
function isPracticable(method: PublicMethodMeta): boolean {
  return method.status === 'verified';
}

/** Exact, literal match only — the one deterministic signal available
 * without parsing prose: every KM chapter paragraph that states a method
 * begins with that method's own `label` verbatim (confirmed across the
 * transcription, e.g. "Method 1: After drawing the chart, pick h1 and
 * h8..."). If a future chapter's wording ever doesn't follow this, the
 * method simply gets no inline CTA rather than a guessed one. */
function findParagraphIndex(paragraphs: string[], method: PublicMethodMeta): number | null {
  const prefix = `${method.label}:`;
  const i = paragraphs.findIndex((p) => p.trimStart().startsWith(prefix));
  return i === -1 ? null : i;
}

/** Every practicable method for one KM chapter, in method order. Empty for
 * a chapter with no engine question, no verified methods, or that resolves
 * (via a consolidated duplicate) to a question whose own chapter is
 * elsewhere — a duplicate passage is still text-only here; its canonical
 * chapter is where the practice CTA belongs.
 *
 * `paragraphs` is optional: pass the chapter's own paragraph array (from
 * an authorized, server-side source) to get real `paragraphIndex` values
 * for inline CTA placement; omit it to get every practicable method with
 * `paragraphIndex: null` — the right shape for a caller that only needs
 * method ids/definitions (e.g. offline URL enumeration, the practice
 * route itself) and must never receive the protected chapter text. */
export function practicableMethodsForChapter(chapterId: string, paragraphs?: string[]): PracticableMethod[] {
  const entry = catalogEntry(chapterId);
  if (!entry || entry.engineQuestionId === null) return [];
  // A consolidated duplicate resolves to another chapter's question; only
  // that question's OWN chapter gets the inline CTA, so this chapter's
  // prose is never wired to a method whose houses/paragraph don't actually
  // belong to it.
  if (entry.engineQuestionId !== chapterId) return [];

  const question = QUESTION_REGISTRY_META[entry.engineQuestionId];
  if (!question) return [];
  if (!KM_CHAPTER_META.some((c) => c.id === chapterId)) return [];

  return question.methods.filter(isPracticable).map((method) => ({
    questionId: question.id,
    chapterId,
    method,
    paragraphIndex: paragraphs ? findParagraphIndex(paragraphs, method) : null,
  }));
}

/** Phase 1 (practice discoverability): every practicable method's entry
 * point(s) in its own chapter, split in two.
 *
 * `inline` — the existing, unchanged placement: the first method whose own
 *   label literally prefixes a paragraph gets the "Try this method" button
 *   right after that paragraph.
 * `fallback` — every other practicable method (no literal label match, a
 *   label the source doesn't print, a chapter whose body is rendered by a
 *   figure-specific component, or two methods resolving to one paragraph).
 *   These get a "Practise this method" link at the end of the chapter.
 *
 * Together the two lists always cover exactly `practicableMethodsForChapter`
 * — same methods, same registry order, nothing added — so a verified method
 * can never silently end up with no visible way in. Nothing here reads or
 * changes the source wording; the split is decided from the same
 * `paragraphIndex` the inline button already used. */
export interface ChapterPracticeEntryPoints {
  inline: Map<number, PracticableMethod>;
  fallback: PracticableMethod[];
}

export function practiceEntryPointsForChapter(chapterId: string, paragraphs?: string[]): ChapterPracticeEntryPoints {
  const inline = new Map<number, PracticableMethod>();
  const fallback: PracticableMethod[] = [];
  for (const m of practicableMethodsForChapter(chapterId, paragraphs)) {
    if (m.paragraphIndex !== null && !inline.has(m.paragraphIndex)) inline.set(m.paragraphIndex, m);
    else fallback.push(m);
  }
  return { inline, fallback };
}

/** The practice route for one method — the single place its URL is built. */
export function practiceHref(m: Pick<PracticableMethod, 'chapterId' | 'method'>): string {
  return `/raml/practice/${m.chapterId}/${m.method.id}`;
}

/** Resolve one specific method for the practice route. Returns null for
 * anything not practicable — an unknown chapter, an unknown method id, or a
 * method that exists but is not `verified` — so the practice screen can
 * show its own honest "not available" state instead of ever executing an
 * unverified method. */
export function findPracticableMethod(chapterId: string, methodId: string, paragraphs?: string[]): PracticableMethod | null {
  return practicableMethodsForChapter(chapterId, paragraphs).find((m) => m.method.id === methodId) ?? null;
}

/** Book + chapter number, formatted the same way the rest of the app does
 * (`reading.ts`'s `sourceLabelFor`), duplicated here in miniature because
 * this module only ever deals with Kanzul Mikban chapters (the only book
 * with engine-backed methods) — never a calculation, just a label. */
export function chapterSourceLabel(chapterId: string): string {
  const chapter = KM_CHAPTER_META.find((c) => c.id === chapterId);
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

/** Phase 1: a chart cast from inside the practice flow is saved through the
 * SAME `saveReading()` the Reading flow uses (no second store), filed under
 * the method's own question id, so it immediately becomes the "current
 * chart" (`mostRecentChart`) for every other method the user practises next.
 * The chart itself is rebuilt from the saved Mothers with the same
 * `buildChart()` the History screen uses. `persisted` is false when the
 * browser refuses to store it; the chart is still returned so the user can
 * finish this method. */
export function savePracticeChart(
  questionId: string,
  mothers: [Pattern, Pattern, Pattern, Pattern],
  practice?: PracticeRef,
): { chart: Chart; record: ReadingRecord; persisted: boolean } {
  // Practice polish: `practice` marks the record as a METHOD PRACTICE so Past
  // Readings shows that one method's result, not the whole question's.
  const { record, persisted } = saveReading({ questionId, mothers, ...(practice ? { practice } : {}) });
  return { chart: buildChart(record.mothers), record, persisted };
}

/** Phase 1: true when a computed method row reads the chart as a whole
 * rather than named houses — the engine reports that as an empty
 * `housesUsed`. Such a row's `resultFigure` is only a representative
 * reference figure (see e.g. willItRain.ts / enemiesHowMany.ts comments),
 * so the practice UI must not show a house-selection step or present that
 * figure as the method's result. Reads the row only; decides nothing about
 * the geomancy. */
export function isWholeChartRow(row: Pick<ReadingMethodRow, 'housesUsed'>): boolean {
  return row.housesUsed.length === 0;
}

/** Prompt 54 — the three states a Practice walkthrough's result row can be
 * in, pulled out of MethodPracticeFlow.tsx as a small, pure, non-DOM
 * function so the decision itself is directly testable.
 *
 * 'failure' — a genuine technical problem: no row at all, or a row whose
 *   calculation never even produced a figure (`resultPattern === null`,
 *   i.e. `calculate()` threw, or the request itself failed).
 * 'uncertain' — the method WAS fully, correctly computed, but its own
 *   verdict was `outcome: 'uncertain'` (reading.ts's `counted` is exactly
 *   `verdict !== null && outcome !== 'uncertain'` — the same flag
 *   COMPARE_RESULTS/ruleEngine.ts already use to decide what counts toward
 *   cross-method consensus). This is a real, source-faithful answer — the
 *   rule simply doesn't define an outcome for this chart — and must never
 *   be presented as a failure, nor as an invented negative ("no rain",
 *   "unfavourable", etc.).
 * 'result' — a normal counted verdict; the existing walkthrough/result
 *   screens apply unchanged. */
export type PracticeResultState = 'failure' | 'uncertain' | 'result';

export function practiceResultState(row: ReadingMethodRow | null): PracticeResultState {
  if (!row || row.resultPattern === null) return 'failure';
  if (!row.counted) return 'uncertain';
  return 'result';
}

/** Phase 1 corrective QA (C): what kind of chart the "current chart" is,
 * read only from what it was saved for — never from its figures.
 *
 * 'mothers_only' — saved for a question whose own public casting metadata
 *   reads only the four Mothers and their pairing (Chapter 151's Dream
 *   reading today; the same generic rule CastingFlow already uses for the
 *   board wording, never a question-id check). The saved Mothers still
 *   rebuild a full 16-house chart, but the user cast it for a reading that
 *   never showed one, so a full-chart method must not use it without the
 *   user explicitly choosing to.
 * 'general'      — a plain chart reading.
 * 'question'     — cast for any other traditional question. */
export type CurrentChartKind = 'mothers_only' | 'general' | 'question';

export function isMothersOnlyQuestion(questionId: string): boolean {
  const casting = resolveQuestionCasting(QUESTION_REGISTRY_META[resolveEngineQuestionId(questionId)]);
  return casting.showPairingWorking && !casting.showFullShieldTabs;
}

export function currentChartKind(record: Pick<ReadingRecord, 'questionId'>): CurrentChartKind {
  if (!record.questionId || record.questionId === 'general') return 'general';
  return isMothersOnlyQuestion(record.questionId) ? 'mothers_only' : 'question';
}

/** True when the current chart should NOT be the default for this method:
 * it was cast for a Mothers-only (Dream) reading and this method is not
 * itself a Mothers-only method. The user can still choose it explicitly. */
export function needsExplicitChartChoice(record: Pick<ReadingRecord, 'questionId'>, practiceQuestionId: string): boolean {
  return currentChartKind(record) === 'mothers_only' && !isMothersOnlyQuestion(practiceQuestionId);
}

/** Phase 1 corrective QA (H): the second chart a recast method reads, for
 * DISPLAY. The engine's RECAST_FROM_HOUSES builds it as
 * buildChart(the figures already in `motherHouses`); this rebuilds exactly
 * that from the method row's own public `recastMotherHouses`, with the same
 * unchanged buildChart(), so the user can see the chart the engine read.
 * No rule is evaluated here. Null when the row is not a recast method. */
export function recastChartFor(chart: Chart, row: Pick<ReadingMethodRow, 'casting'>): Chart | null {
  const houses = row.casting.recastMotherHouses;
  if (row.casting.inspects !== 'recast' || !houses || houses.length !== 4) return null;
  const mothers = houses.map((n) => chart.houses[n - 1].pattern) as [Pattern, Pattern, Pattern, Pattern];
  return buildChart(mothers);
}
