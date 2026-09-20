// Reading history (Prompt 16) — local-first, replay-based.
//
// Two ideas hold this together:
//
// 1. A saved reading stores only what cannot be recomputed: when it happened,
//    which question was asked, the user's own words if they typed any, and the
//    four Mothers. The engine is deterministic (asserted in productUx.test.ts),
//    so the full reading — verdict, indicators, methods, evidence, source — is
//    reconstructed by re-running it, not copied into storage. Nothing about a
//    past reading can drift out of step with the engine, and no stale verdict
//    can ever be shown.
//
// 2. Storage is treated as hostile. Everything that comes back out of
//    localStorage is validated field by field before it is used; anything that
//    does not survive validation is dropped rather than rendered, and a
//    reading whose question no longer exists is reported as such instead of
//    being answered with some other question's rule.
//
// STORAGE (reads/writes the one localStorage key) remains entirely local-
// only, exactly as before. REPLAY no longer is: PROMPT 27C moved the actual
// recomputation (describeReading/describeHistory, below) to the server
// reading route, because re-running the engine locally required bundling
// the ENTIRE question corpus — every question's protected source text, not
// just the one being viewed — into the client, which is the leak this
// migration closes. A saved reading still stores only the four Mothers +
// questionId (idea 1 above is completely unchanged: nothing is cached,
// nothing can go stale) — describeReading now fetches the recomputed
// result instead of calling the engine in-process. The one real,
// deliberate behavior change: viewing a past reading's full result now
// needs connectivity; see the 'network-required' HistoryStateKind below,
// which is an honest, explicit state (never a fabricated result) for
// exactly that case — offline visitors still see their history LIST
// (title/date/question, all locally known), just not a REPLAYED verdict
// until they're back online. See the Prompt 27C final report's "Offline
// verification" section for the full reasoning.
import { buildChart, type Chart } from './casting';
import type { ReadingResult } from './engine/reading';
import { catalogEntry } from './questionCatalog';
import { summariseReading } from './readingSummary';
import { isSourceSilentReading } from './resultPresentation';
import { METHOD_STATUS_LABEL, SOURCE_SILENT_HEADING } from './statusLanguage';
import type { Pattern } from '@/content/stars';

export const HISTORY_STORAGE_KEY = 'truth-geomancer:castings';
export const MAX_HISTORY = 100;
export const SCHEMA_VERSION = 1;

/** The stored shape. Deliberately small: everything else is recomputed. */
export interface ReadingRecord {
  v: typeof SCHEMA_VERSION;
  id: string;
  /** ISO timestamp. */
  createdAt: string;
  /** The traditional question that was asked — 'general' for a plain chart
   * reading. Kept separate from the user's own words on purpose. */
  questionId: string;
  /** The user's own free text, if they typed any. Never used as the question. */
  intentionText?: string;
  /** The four Mothers — the whole chart is derived from these. */
  mothers: [Pattern, Pattern, Pattern, Pattern];
}

/** The pre-Prompt-16 record, still in some users' browsers: `question` held
 * the free text and `intentionId` the chosen question. */
interface LegacyRecord {
  id: string;
  createdAt: string;
  question?: string;
  mothers: unknown;
  intentionId?: string;
}

// ---------------------------------------------------------------------------
// Validation, migration, serialisation — pure, so they can be tested without
// a browser and reused wherever storage is not available.
// ---------------------------------------------------------------------------

function isPattern(value: unknown): value is Pattern {
  return Array.isArray(value) && value.length === 4 && value.every((n) => n === 1 || n === 2);
}

function isMothers(value: unknown): value is [Pattern, Pattern, Pattern, Pattern] {
  return Array.isArray(value) && value.length === 4 && value.every(isPattern);
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value));
}

/** Turns one unknown stored object into a record, or null if it cannot be
 * trusted. Legacy records are migrated here rather than anywhere else. */
export function toRecord(value: unknown): ReadingRecord | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<ReadingRecord> & LegacyRecord;
  if (typeof raw.id !== 'string' || raw.id.length === 0) return null;
  if (!isIsoDate(raw.createdAt)) return null;
  if (!isMothers(raw.mothers)) return null;

  // v1 record, or a legacy one: `intentionId` was the question, `question`
  // was the free text. Both spellings are accepted so an existing user keeps
  // their castings.
  const questionId =
    typeof raw.questionId === 'string' && raw.questionId.length > 0
      ? raw.questionId
      : typeof raw.intentionId === 'string' && raw.intentionId.length > 0
        ? raw.intentionId
        : 'general';
  const intentionText =
    typeof raw.intentionText === 'string' && raw.intentionText.trim()
      ? raw.intentionText.trim()
      : typeof raw.question === 'string' && raw.question.trim()
        ? raw.question.trim()
        : undefined;

  return {
    v: SCHEMA_VERSION,
    id: raw.id,
    createdAt: raw.createdAt,
    questionId,
    ...(intentionText ? { intentionText } : {}),
    mothers: raw.mothers,
  };
}

/** Newest first, junk dropped. Never throws, whatever is in storage. */
export function parseHistory(raw: string | null): ReadingRecord[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const records = parsed.map(toRecord).filter((r): r is ReadingRecord => r !== null);
  return sortNewestFirst(records);
}

export function sortNewestFirst(records: ReadingRecord[]): ReadingRecord[] {
  return [...records].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function serializeHistory(records: ReadingRecord[]): string {
  return JSON.stringify(records.slice(0, MAX_HISTORY));
}

/** True when the stored text differs from what this version would write —
 * i.e. a migration or a clean-up is worth persisting. */
export function needsRewrite(raw: string | null, records: ReadingRecord[]): boolean {
  return raw !== null && raw !== serializeHistory(records);
}

// ---------------------------------------------------------------------------
// Replay — a stored reading is re-derived, never remembered
// ---------------------------------------------------------------------------

/** How a past reading turned out, in the same words the result screen uses.
 * `kind` exists for filtering and for choosing an icon; `label` is what a
 * person reads, and never depends on colour alone. */
export type HistoryStateKind =
  | 'favourable'
  | 'unfavourable'
  | 'mixed'
  | 'descriptive'
  | 'insufficient'
  | 'source-detail-missing'
  | 'not-defined-in-source'
  | 'no-automatic-reading'
  | 'general'
  | 'unreconstructable'
  // Prompt 27C: distinct from 'unreconstructable' — the saved reading is
  // completely intact and WILL show its real result again once the server
  // reading route is reachable; nothing about it was lost or invalidated.
  | 'network-required';

export interface HistoryEntry {
  record: ReadingRecord;
  /** The traditional question, in plain language. */
  title: string;
  /** The manuscript's own heading, when it differs from the title. */
  sourceTitle: string | null;
  /** e.g. "Kanzul Mikban, Chapter 19" — this entry's OWN chapter, even when
   * the calculation is consolidated under another chapter's rule. */
  sourceLabel: string | null;
  chapterNumber: number | null;
  /** Set when this entry's question is read under another chapter's method. */
  consolidatedNote: string | null;
  stateKind: HistoryStateKind;
  stateLabel: string;
  /** The engine's own one-line answer, when there is one. */
  interpretation: string | null;
  /** The user's own words, kept distinct from the question. */
  intentionText: string | null;
  /** Null only when the reading cannot be reconstructed. */
  result: ReadingResult | null;
  chart: Chart | null;
  /** Why it cannot be reconstructed, in words a reader can act on. */
  unavailableReason: string | null;
  /** Lowercased text the history search matches against. */
  haystack: string;
}

export const UNRECONSTRUCTABLE_MESSAGE =
  'This reading can no longer be reconstructed from the saved information.';

export const NETWORK_REQUIRED_MESSAGE =
  "This reading's result couldn't be recalculated right now — check your connection and try again. Nothing was lost.";

function insufficientStateFor(result: ReadingResult): { kind: HistoryStateKind; label: string } {
  if (isSourceSilentReading(result)) {
    return { kind: 'insufficient', label: SOURCE_SILENT_HEADING };
  }
  const statuses = new Set(result.methodResults.filter((m) => m.status !== 'verified').map((m) => m.status));
  if (statuses.size === 1 && statuses.has('needs_review')) {
    return { kind: 'source-detail-missing', label: METHOD_STATUS_LABEL.needs_review };
  }
  if (statuses.size === 1 && statuses.has('uncertain')) {
    return { kind: 'not-defined-in-source', label: METHOD_STATUS_LABEL.uncertain };
  }
  return { kind: 'insufficient', label: 'Insufficient information' };
}

/** Fetches the recomputed reading result for a chart+question from the
 * server reading route (the same one ResultTabs/ReadingTab use) — never
 * calls the engine in-process. Returns null on any failure (offline, the
 * route unreachable, a malformed response) so the caller can show an
 * honest 'network-required' state rather than a guessed result. */
async function fetchReadingResult(chart: Chart, intentionId: string): Promise<ReadingResult | null> {
  try {
    const res = await fetch('/api/raml/reading', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intentionId, chart }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result: ReadingResult };
    return data.result;
  } catch {
    return null;
  }
}

/** Rebuilds one saved reading from its chart and question. The chart is always
 * rebuilt from the stored Mothers — a history entry is never re-cast. */
export async function describeReading(record: ReadingRecord): Promise<HistoryEntry> {
  const entry = catalogEntry(record.questionId);
  const intentionText = record.intentionText ?? null;

  let chart: Chart | null = null;
  try {
    chart = buildChart(record.mothers);
  } catch {
    chart = null;
  }

  const base = {
    record,
    intentionText,
    sourceTitle: entry && entry.hasShortTitle ? entry.sourceTitle : null,
    chapterNumber: entry?.chapterNumber ?? null,
    consolidatedNote:
      entry?.availability.kind === 'consolidated' ? entry.availability.note : null,
  };

  // A general reading is a real, complete thing — the chart itself — it simply
  // has no single verdict to show in a list.
  if (record.questionId === 'general') {
    return {
      ...base,
      title: 'General reading',
      sourceLabel: null,
      stateKind: chart ? 'general' : 'unreconstructable',
      stateLabel: chart ? 'Chart reading' : UNRECONSTRUCTABLE_MESSAGE,
      interpretation: null,
      result: null,
      chart,
      unavailableReason: chart ? null : UNRECONSTRUCTABLE_MESSAGE,
      haystack: ['general reading', intentionText ?? ''].join(' ').toLowerCase(),
    };
  }

  // The question was removed, renamed, or never existed in this build. Say so
  // rather than answering with a different question's rule.
  if (!entry || !chart) {
    return {
      ...base,
      title: entry?.title ?? 'Unknown question',
      sourceLabel: null,
      stateKind: 'unreconstructable',
      stateLabel: 'Cannot be reconstructed',
      interpretation: null,
      result: null,
      chart,
      unavailableReason: UNRECONSTRUCTABLE_MESSAGE,
      haystack: [entry?.title ?? '', intentionText ?? ''].join(' ').toLowerCase(),
    };
  }

  const sourceLabel =
    entry.chapterNumber !== null ? `Kanzul Mikban, Chapter ${entry.chapterNumber}` : 'Kanzul Mikban';

  if (entry.availability.kind === 'no-automatic-reading') {
    return {
      ...base,
      title: entry.title,
      sourceLabel,
      stateKind: 'no-automatic-reading',
      stateLabel: 'No automatic reading',
      interpretation: entry.availability.note,
      result: null,
      chart,
      unavailableReason: null,
      haystack: [entry.title, entry.sourceTitle, sourceLabel, intentionText ?? ''].join(' ').toLowerCase(),
    };
  }

  // The catalogue already resolves a consolidated duplicate to the engine
  // question that implements its rule; the entry keeps its OWN chapter for
  // provenance (Prompt 16, section 17).
  if (!entry.engineQuestionId) {
    return {
      ...base,
      title: entry.title,
      sourceLabel,
      stateKind: 'unreconstructable',
      stateLabel: 'Cannot be reconstructed',
      interpretation: null,
      result: null,
      chart,
      unavailableReason: UNRECONSTRUCTABLE_MESSAGE,
      haystack: [entry.title, entry.sourceTitle, sourceLabel, intentionText ?? ''].join(' ').toLowerCase(),
    };
  }

  const result = await fetchReadingResult(chart, entry.engineQuestionId);
  if (!result) {
    return {
      ...base,
      title: entry.title,
      sourceLabel,
      stateKind: 'network-required',
      stateLabel: 'Reconnect to view',
      interpretation: null,
      result: null,
      chart,
      unavailableReason: NETWORK_REQUIRED_MESSAGE,
      haystack: [entry.title, entry.sourceTitle, sourceLabel, intentionText ?? ''].join(' ').toLowerCase(),
    };
  }

  const summary = summariseReading(result);
  const state: { kind: HistoryStateKind; label: string } = result.isInsufficient
    ? insufficientStateFor(result)
    : result.conflictingIndicators
      ? { kind: 'mixed', label: 'Mixed / Conflicting indications' }
      : result.resultKind === 'descriptive'
        ? { kind: 'descriptive', label: summary.status }
        : result.overallOutcome === 'favourable'
          ? { kind: 'favourable', label: 'Favourable' }
          : result.overallOutcome === 'unfavourable'
            ? { kind: 'unfavourable', label: 'Unfavourable' }
            : { kind: 'mixed', label: summary.status };

  return {
    ...base,
    title: entry.title,
    sourceLabel,
    stateKind: state.kind,
    stateLabel: state.label,
    interpretation: summary.interpretation,
    result,
    chart,
    unavailableReason: null,
    haystack: [entry.title, entry.sourceTitle, sourceLabel, state.label, intentionText ?? '']
      .join(' ')
      .toLowerCase(),
  };
}

export function describeHistory(records: ReadingRecord[]): Promise<HistoryEntry[]> {
  return Promise.all(records.map(describeReading));
}

/** Local search over saved readings only — question, the user's own words,
 * chapter, and the result state. Nothing leaves the device. */
export function searchHistory(entries: HistoryEntry[], query: string): HistoryEntry[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return entries;
  return entries.filter((entry) => terms.every((term) => entry.haystack.includes(term)));
}

export type HistoryFilter = 'all' | 'favourable' | 'unfavourable' | 'mixed' | 'descriptive' | 'unresolved';

/** The unresolved bucket deliberately gathers every "the source does not say"
 * state: they are one thing from a reader's point of view. */
export function filterHistory(entries: HistoryEntry[], filter: HistoryFilter): HistoryEntry[] {
  if (filter === 'all') return entries;
  if (filter === 'unresolved') {
    return entries.filter((e) =>
      [
        'insufficient',
        'source-detail-missing',
        'not-defined-in-source',
        'no-automatic-reading',
        'unreconstructable',
        'network-required',
      ].includes(e.stateKind),
    );
  }
  return entries.filter((e) => e.stateKind === filter);
}

// ---------------------------------------------------------------------------
// Storage — the only place this module touches the browser
// ---------------------------------------------------------------------------

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    // Accessing localStorage can itself throw when cookies/site data are
    // blocked. A reading still works; it just will not be remembered.
    return null;
  }
}

export function isHistoryAvailable(): boolean {
  return storage() !== null;
}

function readRaw(): string | null {
  const store = storage();
  if (!store) return null;
  try {
    return store.getItem(HISTORY_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Writes, shedding the oldest entries if the browser refuses on quota.
 * Returns false when nothing could be written — never throws. */
function writeRecords(records: ReadingRecord[]): boolean {
  const store = storage();
  if (!store) return false;
  let candidate = records.slice(0, MAX_HISTORY);
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      store.setItem(HISTORY_STORAGE_KEY, serializeHistory(candidate));
      return true;
    } catch {
      if (candidate.length <= 1) break;
      candidate = candidate.slice(0, Math.floor(candidate.length / 2));
    }
  }
  try {
    // One last attempt at an empty list, so a full store does not keep a
    // corrupt or oversized value around.
    store.setItem(HISTORY_STORAGE_KEY, serializeHistory([]));
  } catch {
    // Nothing more can be done; the session still works without history.
  }
  return false;
}

/** Every saved reading, newest first. Migrates legacy records and persists the
 * migration once, best-effort. */
export function listReadings(): ReadingRecord[] {
  const raw = readRaw();
  const records = parseHistory(raw);
  if (needsRewrite(raw, records)) writeRecords(records);
  return records;
}

export function getReading(id: string): ReadingRecord | undefined {
  return listReadings().find((r) => r.id === id);
}

function makeId(): string {
  try {
    if (typeof window !== 'undefined' && window.crypto && 'randomUUID' in window.crypto) {
      return window.crypto.randomUUID();
    }
  } catch {
    // fall through to the timestamp id
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Saves a completed reading. Returns the record even when it could not be
 * persisted, so the caller can tell the user the truth. */
export function saveReading(input: {
  questionId: string;
  intentionText?: string;
  mothers: [Pattern, Pattern, Pattern, Pattern];
}): { record: ReadingRecord; persisted: boolean } {
  const text = input.intentionText?.trim();
  const record: ReadingRecord = {
    v: SCHEMA_VERSION,
    id: makeId(),
    createdAt: new Date().toISOString(),
    questionId: input.questionId || 'general',
    ...(text ? { intentionText: text } : {}),
    mothers: input.mothers,
  };
  const persisted = writeRecords([record, ...listReadings()]);
  return { record, persisted };
}

export function deleteReading(id: string): boolean {
  return writeRecords(listReadings().filter((r) => r.id !== id));
}

export function clearHistory(): boolean {
  return writeRecords([]);
}

export function countReadings(): number {
  return listReadings().length;
}
