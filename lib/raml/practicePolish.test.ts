// Practice polish — (1) house labels never split mid-word, (2) a saved method
// practice is its own kind of Past Readings entry, (3) the source question is
// shown as context, never as a question the user asked. Normal readings
// (general, Dream, ordinary Kanzul questions) must be unchanged.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runReading } from './engine';
import { buildChart } from './casting';
import { HOUSES } from './houses';
import { describeReading, listReadings, parseHistory, saveReading, serializeHistory, toRecord, type HistoryEntry } from './history';
import { savePracticeChart } from './methodPractice';
import { catalogEntry } from './questionCatalog';
import { HistoryCard } from '@/components/raml/HistoryCard';
import { HouseSelector, hyphenateHouseTitle } from '@/components/raml/practice/HouseSelector';
import type { Pattern } from '@/content/stars';

function repoFile(relative: string): string {
  return readFileSync(path.resolve(__dirname, '..', '..', relative), 'utf8');
}

const CH1 = 'traveling-business-and-if-you-will-return-from';
const MOTHERS: [Pattern, Pattern, Pattern, Pattern] = [
  [1, 2, 1, 2],
  [2, 1, 2, 1],
  [1, 1, 2, 2],
  [2, 2, 1, 1],
];

class MemoryStorage {
  map = new Map<string, string>();
  getItem(key: string) {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  setItem(key: string, value: string) {
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
function install(store: MemoryStorage | null) {
  Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: store ? { localStorage: store } : {} });
}

// Both server routes are stubbed with the SAME engine call each route makes,
// so the test checks which route a record is replayed through.
const calls: string[] = [];
beforeEach(() => {
  calls.length = 0;
  vi.stubGlobal('fetch', async (url: string, init: { body: string }) => {
    calls.push(url);
    const body = JSON.parse(init.body);
    if (url === '/api/raml/practice') {
      const row = runReading(body.chart, body.chapterId)?.methodResults.find((m) => m.id === body.methodId) ?? null;
      return { ok: true, json: async () => ({ row }) };
    }
    if (url === '/api/raml/reading') {
      return { ok: true, json: async () => ({ result: runReading(body.chart, body.intentionId) }) };
    }
    throw new Error(`unexpected fetch ${url}`);
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(globalThis, 'window');
});

describe('2/3. storage: a method practice is a distinct, optional field on the existing record', () => {
  it('keeps a valid practice reference and drops a malformed one; records without it are unchanged', () => {
    const base = { v: 1, id: 'a', createdAt: new Date().toISOString(), questionId: CH1, mothers: MOTHERS };
    expect(toRecord({ ...base, practice: { chapterId: CH1, methodId: 'travel-method-1' } })?.practice).toEqual({
      chapterId: CH1,
      methodId: 'travel-method-1',
    });
    expect(toRecord({ ...base, practice: { chapterId: '<script>', methodId: 'x' } })?.practice).toBeUndefined();
    expect(toRecord({ ...base, practice: 'nope' })?.practice).toBeUndefined();
    const plain = toRecord(base)!;
    expect('practice' in plain).toBe(false);
    // An existing history string round-trips byte-for-byte: nothing is rewritten.
    const raw = serializeHistory([plain]);
    expect(serializeHistory(parseHistory(raw))).toBe(raw);
  });

  it('a practice cast saves the method reference; an ordinary reading saves none', () => {
    install(new MemoryStorage());
    savePracticeChart(CH1, MOTHERS, { chapterId: CH1, methodId: 'travel-method-1' });
    saveReading({ questionId: CH1, mothers: MOTHERS });
    const [ordinary, practice] = listReadings();
    expect(practice.practice).toEqual({ chapterId: CH1, methodId: 'travel-method-1' });
    expect(ordinary.practice).toBeUndefined();
  });
});

describe('2. Past Readings describes a practice by that ONE method, via the practice route', () => {
  it('shows the method heading, its own verdict and figure, and the source question as context', async () => {
    install(new MemoryStorage());
    savePracticeChart(CH1, MOTHERS, { chapterId: CH1, methodId: 'travel-method-1' });
    const entry = await describeReading(listReadings()[0]);
    expect(calls).toEqual(['/api/raml/practice']);
    expect(entry.practice?.heading).toBe('Kanzul Mikban · Chapter 1 · Method 1');
    expect(entry.practice?.sourceQuestion).toBe(catalogEntry(CH1)!.title);
    expect(entry.result).toBeNull(); // never the whole-question replay
    const row = runReading(buildChart(MOTHERS), CH1)!.methodResults.find((m) => m.id === 'travel-method-1')!;
    expect(entry.practice?.row?.resultFigureName).toBe(row.resultFigureName);
    expect(entry.stateLabel).not.toMatch(/Mixed|Conflicting/);
    if (row.counted && row.outcome === 'favourable') expect(entry.stateLabel).toBe('Favourable');
    if (row.counted && row.outcome === 'unfavourable') expect(entry.stateLabel).toBe('Unfavourable');
    if (!row.counted) expect(entry.stateLabel).toBe('Condition not met');
  });

  it('an unreachable practice route gives an honest "unavailable" state, never a guessed verdict', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, json: async () => ({}) }));
    install(new MemoryStorage());
    savePracticeChart(CH1, MOTHERS, { chapterId: CH1, methodId: 'travel-method-1' });
    const entry = await describeReading(listReadings()[0]);
    expect(entry.stateKind).toBe('network-required');
    expect(entry.unavailableReason).toContain('Nothing was lost');
    expect(entry.practice?.row).toBeNull();
  });

  it('ordinary question, general and Dream readings are replayed exactly as before', async () => {
    install(new MemoryStorage());
    saveReading({ questionId: CH1, mothers: MOTHERS });
    const question = await describeReading(listReadings()[0]);
    expect(calls).toEqual(['/api/raml/reading']);
    expect(question.practice).toBeNull();
    expect(question.title).toBe(catalogEntry(CH1)!.title);
    expect(question.result).not.toBeNull();

    calls.length = 0;
    const general = await describeReading(toRecord({ v: 1, id: 'g', createdAt: new Date().toISOString(), questionId: 'general', mothers: MOTHERS })!);
    expect(calls).toEqual([]);
    expect(general.title).toBe('General reading');
    expect(general.practice).toBeNull();

    const dream = await describeReading(
      toRecord({ v: 1, id: 'd', createdAt: new Date().toISOString(), questionId: 'dreams-and-their-interpretations', mothers: MOTHERS })!,
    );
    expect(calls).toEqual(['/api/raml/reading']);
    expect(dream.practice).toBeNull();
    expect(dream.title).toBe(catalogEntry('dreams-and-their-interpretations')!.title);
  });
});

describe('2/3. what the reader sees', () => {
  it('the history card labels a practice as "Method practice" with a "Source question:" line', async () => {
    install(new MemoryStorage());
    savePracticeChart(CH1, MOTHERS, { chapterId: CH1, methodId: 'travel-method-1' });
    const entry = await describeReading(listReadings()[0]);
    const html = renderToStaticMarkup(createElement(HistoryCard, { entry }));
    expect(html).toContain('Method practice');
    expect(html).toContain('Kanzul Mikban · Chapter 1 · Method 1');
    expect(html).toContain(`Source question: “${catalogEntry(CH1)!.title}”`);
  });

  it('an ordinary reading card is unchanged: the question is the title, no practice labels', async () => {
    install(new MemoryStorage());
    saveReading({ questionId: CH1, mothers: MOTHERS });
    const entry: HistoryEntry = await describeReading(listReadings()[0]);
    const html = renderToStaticMarkup(createElement(HistoryCard, { entry }));
    expect(html).toContain(catalogEntry(CH1)!.title);
    expect(html).not.toContain('Method practice');
    expect(html).not.toContain('Source question:');
  });

  it('the detail page and the current-chart preview present the question as the SOURCE question for a practice', () => {
    const detail = repoFile('app/raml/history/[id]/page.tsx');
    expect(detail).toContain('entry.practice ?');
    expect(detail).toContain('Source question: “{entry.practice.sourceQuestion}”');
    expect(detail).toContain('<PracticeChartPanel chart={entry.chart} row={entry.practice.row} />');
    const preview = repoFile('components/raml/practice/CurrentChartPreview.tsx');
    expect(preview).toContain("'Method practice chart'");
    expect(preview).toContain('Source question: “${castFor}”');
  });
});

describe('1. house labels: only legitimate break points, wording unchanged', () => {
  it('soft hyphens are invisible: every title reads exactly as in lib/raml/houses.ts', () => {
    for (const h of HOUSES) expect(hyphenateHouseTitle(h.title).replace(/­/g, '')).toBe(h.title);
  });

  it('the long words carry dictionary break points and no character-level breaking is used', () => {
    expect(hyphenateHouseTitle('Transformation')).toBe('Trans­for­ma­tion');
    for (const w of ['Children', 'Marriage', 'Enemies']) expect(hyphenateHouseTitle(w)).toContain('­');
    const selector = repoFile('components/raml/practice/HouseSelector.tsx');
    expect(selector).not.toMatch(/overflow-wrap:anywhere|break-all/);
    expect(selector).toContain('hyphens-manual');
  });

  it('the grid renders the hyphenated titles while the accessible names keep the plain wording', () => {
    const html = renderToStaticMarkup(
      createElement(HouseSelector, { chart: buildChart(MOTHERS), required: [8], selected: new Set<number>(), onToggle: () => {} }),
    );
    expect(html).toContain('Trans­for­ma­tion');
    expect(html).toContain('aria-label="House 8, Transformation.');
  });
});
