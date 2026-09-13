// Prompt 16 — reading history.
//
// Two things are being protected here. First, that a past reading always shows
// what it actually was: rebuilt from its own saved chart through the same
// engine, never a remembered verdict and never another question's rule.
// Second, that nothing a browser's storage can do to the app — corrupt JSON,
// half a record, no storage at all, a full quota — can lose a user's readings
// or crash the page.
//
// Nothing here asserts what a geomantic rule means; the engine's own
// invariants stay in source-reconciliation.test.ts and productUx.test.ts.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildChart } from './casting';
import { runReading } from './engine';
import { FIXTURE_MOTHERS } from './engine/__tests__/fixtures';
import {
  HISTORY_STORAGE_KEY,
  MAX_HISTORY,
  UNRECONSTRUCTABLE_MESSAGE,
  clearHistory,
  countReadings,
  deleteReading,
  describeHistory,
  describeReading,
  filterHistory,
  getReading,
  isHistoryAvailable,
  listReadings,
  parseHistory,
  saveReading,
  searchHistory,
  serializeHistory,
  sortNewestFirst,
  toRecord,
  type ReadingRecord,
} from './history';
import type { Pattern } from '@/content/stars';

// ---------------------------------------------------------------------------
// A localStorage stand-in, so the storage-bound behaviour is really exercised
// rather than mocked away.
// ---------------------------------------------------------------------------

class MemoryStorage {
  map = new Map<string, string>();
  failOnWrite = false;
  maxBytes = Infinity;
  getItem(key: string) {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  setItem(key: string, value: string) {
    if (this.failOnWrite) throw new DOMException('QuotaExceededError');
    if (value.length > this.maxBytes) throw new DOMException('QuotaExceededError');
    this.map.set(key, value);
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
  key() {
    return null;
  }
  get length() {
    return this.map.size;
  }
}

function install(store: MemoryStorage | null | 'throws'): MemoryStorage | null {
  if (store === 'throws') {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      get() {
        throw new Error('access to storage is blocked');
      },
    });
    return null;
  }
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: store ? { localStorage: store } : {},
  });
  return store;
}

function uninstall() {
  Reflect.deleteProperty(globalThis, 'window');
}

afterEach(uninstall);

const MOTHERS = FIXTURE_MOTHERS;
const OTHER_MOTHERS: [Pattern, Pattern, Pattern, Pattern] = [
  [1, 2, 2, 1],
  [2, 1, 1, 2],
  [1, 1, 2, 2],
  [2, 2, 1, 1],
];

function record(over: Partial<ReadingRecord> = {}): ReadingRecord {
  return {
    v: 1,
    id: 'r1',
    createdAt: '2026-09-12T10:00:00.000Z',
    questionId: 'if-you-want-to-know-if-you-will',
    mothers: MOTHERS,
    ...over,
  };
}

// One question per history state, all reachable on the fixture chart.
const STATE_FIXTURES = {
  favourable: 'if-you-want-to-know-if-you-will',
  unfavourable: 'business-profit-and-loss',
  mixed: 'if-you-will-win-a-case-in-court',
  descriptive: 'is-there-much-trees-water-sand-or-stones',
  insufficient: 'if-a-pregnancy-is-going-to-be-stable',
  'source-detail-missing': 'if-it-s-day-or-night-that-she',
  'not-defined-in-source': 'hunting-in-water-and-on-land-and-searching',
  'no-automatic-reading': 'dreams-and-their-interpretations',
  general: 'general',
} as const;

function repoFile(relative: string): string {
  return readFileSync(path.resolve(__dirname, '../..', relative), 'utf8');
}

// ---------------------------------------------------------------------------
// 1. Saving
// ---------------------------------------------------------------------------

describe('saving a completed reading', () => {
  it('stores an id, a timestamp, the question, the chart and the user’s own words', () => {
    const store = install(new MemoryStorage())!;
    const before = Date.now();
    const { record: saved, persisted } = saveReading({
      questionId: 'if-you-want-to-know-if-you-will',
      intentionText: '  Will the payment land today?  ',
      mothers: MOTHERS,
    });
    expect(persisted).toBe(true);
    expect(saved.id.length).toBeGreaterThan(0);
    expect(Date.parse(saved.createdAt)).toBeGreaterThanOrEqual(before);
    expect(saved.questionId).toBe('if-you-want-to-know-if-you-will');
    expect(saved.intentionText).toBe('Will the payment land today?');
    expect(saved.mothers).toEqual(MOTHERS);
    expect(saved.v).toBe(1);
    // …and it really went to the one local key, as plain JSON.
    expect(JSON.parse(store.getItem(HISTORY_STORAGE_KEY)!)[0].id).toBe(saved.id);
  });

  it('omits the intention entirely when the user typed nothing', () => {
    install(new MemoryStorage());
    const { record: saved } = saveReading({ questionId: 'general', intentionText: '   ', mothers: MOTHERS });
    expect('intentionText' in saved).toBe(false);
  });

  it('gives every reading its own id', () => {
    install(new MemoryStorage());
    const ids = new Set(
      Array.from({ length: 5 }, () => saveReading({ questionId: 'general', mothers: MOTHERS }).record.id),
    );
    expect(ids.size).toBe(5);
  });

  it('lists readings newest first', () => {
    install(new MemoryStorage());
    const older = record({ id: 'a', createdAt: '2026-01-01T00:00:00.000Z' });
    const newer = record({ id: 'b', createdAt: '2026-06-01T00:00:00.000Z' });
    expect(sortNewestFirst([older, newer]).map((r) => r.id)).toEqual(['b', 'a']);
    saveReading({ questionId: 'general', mothers: MOTHERS });
    saveReading({ questionId: 'business-profit-and-loss', mothers: MOTHERS });
    const listed = listReadings();
    expect(listed.length).toBe(2);
    expect(Date.parse(listed[0].createdAt)).toBeGreaterThanOrEqual(Date.parse(listed[1].createdAt));
  });

  it('keeps the list bounded', () => {
    expect(JSON.parse(serializeHistory(Array.from({ length: 150 }, (_, i) => record({ id: `r${i}` })))).length).toBe(
      MAX_HISTORY,
    );
  });
});

// ---------------------------------------------------------------------------
// 2. Replay — the heart of it
// ---------------------------------------------------------------------------

describe('replay', () => {
  it('reconstructs exactly the reading the user originally saw', () => {
    for (const questionId of Object.values(STATE_FIXTURES)) {
      if (questionId === 'general' || questionId === 'dreams-and-their-interpretations') continue;
      // The result as the user saw it, at casting time.
      const original = runReading(buildChart(MOTHERS), questionId)!;
      // The result as history rebuilds it, from storage alone.
      const roundTripped = parseHistory(serializeHistory([record({ questionId })]))[0];
      const replayed = describeReading(roundTripped).result;
      expect(replayed, questionId).toEqual(original);
    }
  });

  it('replays the chart that was saved, not a new one', () => {
    // buildChart stamps its own createdAt, so the houses are what identify a
    // chart. (That stamp is never shown to a reader — the date on a history
    // entry comes from the record, not from the rebuilt chart.)
    const a = describeReading(record({ mothers: MOTHERS })).chart!;
    const b = describeReading(record({ mothers: OTHER_MOTHERS })).chart!;
    expect(a.houses).toEqual(buildChart(MOTHERS).houses);
    expect(b.houses).toEqual(buildChart(OTHER_MOTHERS).houses);
    expect(a.houses).not.toEqual(b.houses);
  });

  it('is stable across repeated openings', () => {
    const r = record();
    expect(describeReading(r).result).toEqual(describeReading(r).result);
  });

  it('reports every result state in the reader’s own words', () => {
    for (const [expected, questionId] of Object.entries(STATE_FIXTURES)) {
      const entry = describeReading(record({ questionId }));
      expect(entry.stateKind, questionId).toBe(expected);
      expect(entry.stateLabel.trim().length, questionId).toBeGreaterThan(0);
      expect(entry.stateLabel, questionId).not.toMatch(/needs_review|insufficient_data|resultKind|uncertain$/);
    }
  });

  it('shows the actual answer for a descriptive reading rather than good/bad', () => {
    const entry = describeReading(record({ questionId: STATE_FIXTURES.descriptive }));
    expect(entry.stateLabel).toBe('Much trees');
    expect(entry.result!.descriptiveAnswer).toBe('Much trees');
  });

  it('says “Mixed / Conflicting indications” for a conflict', () => {
    expect(describeReading(record({ questionId: STATE_FIXTURES.mixed })).stateLabel).toBe(
      'Mixed / Conflicting indications',
    );
  });

  it('separates “source detail missing” from “not defined in the source”', () => {
    expect(describeReading(record({ questionId: STATE_FIXTURES['source-detail-missing'] })).stateLabel).toBe(
      'Source detail missing',
    );
    expect(describeReading(record({ questionId: STATE_FIXTURES['not-defined-in-source'] })).stateLabel).toBe(
      'Not defined in the source',
    );
  });

  it('fails safely — and silently produces no answer — when the question is gone', () => {
    const entry = describeReading(record({ questionId: 'a-question-that-no-longer-exists' }));
    expect(entry.stateKind).toBe('unreconstructable');
    expect(entry.result).toBeNull();
    expect(entry.interpretation).toBeNull();
    expect(entry.unavailableReason).toBe(UNRECONSTRUCTABLE_MESSAGE);
  });

  it('keeps a general reading openable as the chart it was', () => {
    const entry = describeReading(record({ questionId: 'general' }));
    expect(entry.title).toBe('General reading');
    expect(entry.chart).toEqual(buildChart(MOTHERS));
    expect(entry.result).toBeNull();
    expect(entry.unavailableReason).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. The question, the intention, and the chapter they came from
// ---------------------------------------------------------------------------

describe('what a history entry says about itself', () => {
  it('never lets the user’s own words stand in for the traditional question', () => {
    const entry = describeReading(
      record({ questionId: 'business-profit-and-loss', intentionText: 'I am thinking of opening a shop' }),
    );
    expect(entry.title).toBe('Business, profit, and loss');
    expect(entry.intentionText).toBe('I am thinking of opening a shop');
    expect(entry.title).not.toContain('shop');
  });

  it('keeps the chapter the reading was actually taken from', () => {
    expect(describeReading(record({ questionId: 'if-you-will-win-a-case-in-court' })).sourceLabel).toBe(
      'Kanzul Mikban, Chapter 19',
    );
  });

  it('keeps a consolidated entry’s own chapter, and says which method answered it', () => {
    const entry = describeReading(record({ questionId: 'if-a-sick-person-has-long-life-repeated' }));
    const canonical = describeReading(record({ questionId: 'if-a-sick-person-has-long-life-or' }));
    // Same rule, so the same verdict — but not the same provenance.
    expect(entry.stateLabel).toBe(canonical.stateLabel);
    expect(entry.sourceLabel).not.toBe(canonical.sourceLabel);
    expect(entry.consolidatedNote).toBeTruthy();
  });

  it('marks source material that never had an automatic reading', () => {
    const entry = describeReading(record({ questionId: STATE_FIXTURES['no-automatic-reading'] }));
    expect(entry.stateKind).toBe('no-automatic-reading');
    expect(entry.result).toBeNull();
    expect(entry.unavailableReason).toBeNull(); // it is a limit of the book, not of the save
    expect(entry.sourceLabel).toBe('Kanzul Mikban, Chapter 151');
  });
});

// ---------------------------------------------------------------------------
// 4. Corrupt, partial and absent storage
// ---------------------------------------------------------------------------

describe('storage safety', () => {
  it('treats empty, malformed and non-array storage as an empty history', () => {
    expect(parseHistory(null)).toEqual([]);
    expect(parseHistory('')).toEqual([]);
    expect(parseHistory('{ not json')).toEqual([]);
    expect(parseHistory('"a string"')).toEqual([]);
    expect(parseHistory('{"records":[]}')).toEqual([]);
    expect(parseHistory('null')).toEqual([]);
  });

  it('drops individual records it cannot trust, keeping the rest', () => {
    const good = record({ id: 'good' });
    const raw = JSON.stringify([
      good,
      null,
      42,
      { id: 'no-date', mothers: MOTHERS },
      { id: 'bad-date', createdAt: 'whenever', mothers: MOTHERS },
      { id: 'no-mothers', createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'bad-mothers', createdAt: '2026-01-01T00:00:00.000Z', mothers: [[1, 2], [3, 4]] },
      { id: '', createdAt: '2026-01-01T00:00:00.000Z', mothers: MOTHERS },
    ]);
    expect(parseHistory(raw).map((r) => r.id)).toEqual(['good']);
  });

  it('rejects a record whose chart is not four real figures', () => {
    expect(toRecord({ id: 'x', createdAt: '2026-01-01T00:00:00.000Z', mothers: [[1, 1, 1, 3], [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]] })).toBeNull();
    expect(toRecord({ id: 'x', createdAt: '2026-01-01T00:00:00.000Z', mothers: 'nope' })).toBeNull();
  });

  it('works when the browser has no storage at all', () => {
    install(null);
    expect(isHistoryAvailable()).toBe(false);
    expect(listReadings()).toEqual([]);
    expect(countReadings()).toBe(0);
    expect(getReading('anything')).toBeUndefined();
    expect(deleteReading('anything')).toBe(false);
    expect(clearHistory()).toBe(false);
    const { record: saved, persisted } = saveReading({ questionId: 'general', mothers: MOTHERS });
    expect(persisted).toBe(false);
    expect(saved.id.length).toBeGreaterThan(0); // the reading itself still happened
  });

  it('survives a browser that throws on touching storage', () => {
    install('throws');
    expect(isHistoryAvailable()).toBe(false);
    expect(() => listReadings()).not.toThrow();
    expect(saveReading({ questionId: 'general', mothers: MOTHERS }).persisted).toBe(false);
  });

  it('sheds the oldest readings rather than failing when the quota is exceeded', () => {
    const store = install(new MemoryStorage())!;
    for (let i = 0; i < 8; i++) saveReading({ questionId: 'general', mothers: MOTHERS });
    expect(listReadings().length).toBe(8);
    // Only a much smaller payload will now fit.
    store.maxBytes = serializeHistory(listReadings()).length / 2;
    const { persisted } = saveReading({ questionId: 'business-profit-and-loss', mothers: MOTHERS });
    expect(persisted).toBe(true);
    const kept = listReadings();
    expect(kept.length).toBeGreaterThan(0);
    expect(kept.length).toBeLessThan(9);
    expect(kept[0].questionId).toBe('business-profit-and-loss'); // the new one survived
  });

  it('reports failure instead of throwing when nothing can be written at all', () => {
    const store = install(new MemoryStorage())!;
    store.failOnWrite = true;
    expect(() => saveReading({ questionId: 'general', mothers: MOTHERS })).not.toThrow();
    expect(saveReading({ questionId: 'general', mothers: MOTHERS }).persisted).toBe(false);
  });

  it('describes a whole corrupt history without throwing', () => {
    install(new MemoryStorage())!.setItem(HISTORY_STORAGE_KEY, '[[[');
    expect(describeHistory(listReadings())).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 5. Migration — an existing user keeps their castings
// ---------------------------------------------------------------------------

describe('migration from the pre-history records', () => {
  const legacy = {
    id: 'legacy-1',
    createdAt: '2026-03-04T09:30:00.000Z',
    question: 'Will the shop work out?',
    mothers: MOTHERS,
    intentionId: 'business-profit-and-loss',
  };

  it('reads an old casting as a reading, with the question and the words in the right places', () => {
    const migrated = toRecord(legacy)!;
    expect(migrated.questionId).toBe('business-profit-and-loss');
    expect(migrated.intentionText).toBe('Will the shop work out?');
    expect(migrated.v).toBe(1);
    expect(migrated.mothers).toEqual(MOTHERS);
  });

  it('treats an old casting with no chosen question as a general reading', () => {
    expect(toRecord({ ...legacy, intentionId: undefined })!.questionId).toBe('general');
  });

  it('replays a migrated casting into a full reading', () => {
    const entry = describeReading(toRecord(legacy)!);
    expect(entry.title).toBe('Business, profit, and loss');
    expect(entry.intentionText).toBe('Will the shop work out?');
    expect(entry.result).toEqual(runReading(buildChart(MOTHERS), 'business-profit-and-loss'));
  });

  it('persists the migration once, in place, without losing anything', () => {
    const store = install(new MemoryStorage())!;
    store.setItem(HISTORY_STORAGE_KEY, JSON.stringify([legacy]));
    const listed = listReadings();
    expect(listed.length).toBe(1);
    const rewritten = JSON.parse(store.getItem(HISTORY_STORAGE_KEY)!);
    expect(rewritten[0].questionId).toBe('business-profit-and-loss');
    expect(rewritten[0].intentionText).toBe('Will the shop work out?');
    expect(rewritten[0].id).toBe('legacy-1');
  });

  it('keeps the migrated data even when the rewrite cannot be saved', () => {
    const store = install(new MemoryStorage())!;
    store.setItem(HISTORY_STORAGE_KEY, JSON.stringify([legacy]));
    store.failOnWrite = true;
    expect(listReadings()[0].questionId).toBe('business-profit-and-loss');
  });
});

// ---------------------------------------------------------------------------
// 6. Deleting
// ---------------------------------------------------------------------------

describe('deleting', () => {
  it('removes one reading and leaves the others', () => {
    const store = install(new MemoryStorage())!;
    const a = saveReading({ questionId: 'general', mothers: MOTHERS }).record;
    const b = saveReading({ questionId: 'business-profit-and-loss', mothers: MOTHERS }).record;
    expect(deleteReading(a.id)).toBe(true);
    expect(listReadings().map((r) => r.id)).toEqual([b.id]);
    expect(getReading(a.id)).toBeUndefined();
    // and nothing of it is left behind in storage
    expect(store.getItem(HISTORY_STORAGE_KEY)).not.toContain(a.id);
  });

  it('clears everything', () => {
    const store = install(new MemoryStorage())!;
    saveReading({ questionId: 'general', mothers: MOTHERS });
    saveReading({ questionId: 'general', mothers: MOTHERS });
    expect(clearHistory()).toBe(true);
    expect(listReadings()).toEqual([]);
    expect(countReadings()).toBe(0);
    expect(store.getItem(HISTORY_STORAGE_KEY)).toBe('[]');
  });

  it('is a no-op for an id that is not there', () => {
    install(new MemoryStorage());
    const kept = saveReading({ questionId: 'general', mothers: MOTHERS }).record;
    deleteReading('not-an-id');
    expect(listReadings().map((r) => r.id)).toEqual([kept.id]);
  });
});

// ---------------------------------------------------------------------------
// 7. Finding a past reading
// ---------------------------------------------------------------------------

describe('search and filters', () => {
  const entries = describeHistory([
    record({ id: '1', questionId: STATE_FIXTURES.favourable, intentionText: 'rent due friday' }),
    record({ id: '2', questionId: STATE_FIXTURES.unfavourable }),
    record({ id: '3', questionId: STATE_FIXTURES.mixed }),
    record({ id: '4', questionId: STATE_FIXTURES.descriptive }),
    record({ id: '5', questionId: STATE_FIXTURES['source-detail-missing'] }),
    record({ id: '6', questionId: STATE_FIXTURES['not-defined-in-source'] }),
  ]);

  it('returns everything for an empty query', () => {
    expect(searchHistory(entries, '').length).toBe(entries.length);
    expect(searchHistory(entries, '  ').length).toBe(entries.length);
  });

  it('finds a reading by its question', () => {
    expect(searchHistory(entries, 'money').map((e) => e.record.id)).toEqual(['1']);
  });

  it('finds a reading by the words the user typed', () => {
    expect(searchHistory(entries, 'rent').map((e) => e.record.id)).toEqual(['1']);
  });

  it('finds a reading by its chapter', () => {
    expect(searchHistory(entries, 'chapter 19').map((e) => e.record.id)).toEqual(['3']);
  });

  it('finds nothing rather than guessing', () => {
    expect(searchHistory(entries, 'zzzz')).toEqual([]);
  });

  it('filters by result state', () => {
    expect(filterHistory(entries, 'all').length).toBe(6);
    expect(filterHistory(entries, 'favourable').map((e) => e.record.id)).toEqual(['1']);
    expect(filterHistory(entries, 'unfavourable').map((e) => e.record.id)).toEqual(['2']);
    expect(filterHistory(entries, 'mixed').map((e) => e.record.id)).toEqual(['3']);
    expect(filterHistory(entries, 'descriptive').map((e) => e.record.id)).toEqual(['4']);
    // The "source does not say" states are one thing to a reader.
    expect(filterHistory(entries, 'unresolved').map((e) => e.record.id)).toEqual(['5', '6']);
  });
});

// ---------------------------------------------------------------------------
// 8. Local only
// ---------------------------------------------------------------------------

describe('history stays on the device', () => {
  it('sends nothing anywhere', () => {
    for (const file of ['lib/raml/history.ts', 'app/raml/history/page.tsx', 'app/raml/history/[id]/page.tsx', 'components/raml/HistoryCard.tsx']) {
      expect(repoFile(file), file).not.toMatch(/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|navigator\.send|axios|https?:\/\//);
    }
  });

  it('touches one storage key and no other storage mechanism', () => {
    const source = repoFile('lib/raml/history.ts');
    expect(source).toContain("HISTORY_STORAGE_KEY = 'truth-geomancer:castings'");
    // Every read and write goes through the single key constant.
    expect(source.match(/getItem\(|setItem\(/g)?.every(() => true)).toBe(true);
    expect(source).not.toMatch(/sessionStorage|indexedDB|openDatabase|caches\./);
    for (const call of source.match(/(getItem|setItem)\([^)]*/g) ?? []) {
      expect(call, call).toContain('HISTORY_STORAGE_KEY');
    }
  });

  it('says only what is true about where a reading is kept', () => {
    const flow = repoFile('components/raml/CastingFlow.tsx');
    expect(flow).toContain('Saved on this device');
    expect(flow).not.toMatch(/cloud|synced|backed up|account/i);
    // And when the browser refuses, the screen says that instead.
    expect(flow).toContain('would not let the app save');
  });
});

// ---------------------------------------------------------------------------
// 9. The screens
// ---------------------------------------------------------------------------

describe('history screen contracts', () => {
  const list = repoFile('app/raml/history/page.tsx');
  const detail = repoFile('app/raml/history/[id]/page.tsx');
  const card = repoFile('components/raml/HistoryCard.tsx');

  it('offers an empty state that invites a reading instead of faking one', () => {
    expect(list).toContain('Your readings will appear here.');
    expect(list).toContain('Start a Reading');
    expect(list).not.toMatch(/sample|example reading|demo/i);
  });

  it('confirms before clearing everything, and can be cancelled', () => {
    expect(list).toContain('confirmingClear');
    expect(list).toMatch(/Tap again to delete all readings/);
    expect(list).toContain('Cancel');
  });

  it('labels every destructive control', () => {
    expect(card).toMatch(/aria-label=\{`Delete the reading/);
    expect(detail).toMatch(/aria-label="Delete this reading from this device"/);
  });

  it('announces list changes and labels its search', () => {
    expect(list).toMatch(/aria-label="Search your past readings"/);
    expect(list).toMatch(/aria-live="polite"/);
    expect(list).toMatch(/aria-pressed=\{filter === f\.id\}/);
  });

  it('never communicates a result by colour alone', () => {
    // Each badge renders its own words and an icon next to them.
    expect(card).toContain('{entry.stateLabel}');
    expect(card).toContain('STATE_ICON[entry.stateKind]');
  });

  it('opens a saved reading by replaying it, never by re-casting', () => {
    expect(detail).toContain('describeReading');
    expect(detail).toContain('getReading');
    expect(detail).not.toContain('CastingBoard');
    expect(detail).toContain('entry.chart');
  });

  it('shows the unreconstructable case honestly instead of a result', () => {
    expect(detail).toContain('entry.unavailableReason');
    expect(detail).toContain('entry.stateLabel');
    // The branch is on the state, not merely on whether a chart could be
    // rebuilt: an unknown question must never fall through to the ordinary
    // result screen, even though its chart is perfectly intact.
    expect(detail).toContain("entry.stateKind !== 'unreconstructable' && entry.chart");
    // …and that intact chart is still offered rather than discarded.
    expect(detail).toContain('The chart you cast that day is intact');
  });

  it('leads a finished reading to its history and to a new one', () => {
    const flow = repoFile('components/raml/CastingFlow.tsx');
    expect(flow).toContain('href="/raml/history"');
    expect(flow).toContain('New reading');
    // Saving is automatic, so there is no misleading "Save" button.
    expect(flow).not.toMatch(/>\s*Save\s*</);
  });

  it('uses two columns on a wide screen without becoming a table', () => {
    expect(list).toContain('sm:grid-cols-2');
    expect(list).not.toMatch(/<table|<thead|<tbody/);
  });
});
