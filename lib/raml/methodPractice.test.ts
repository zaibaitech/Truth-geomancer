// Tests for the "Try this method" eligibility/context layer (Prompt 20).
// This module makes no geomantic decision of its own — every test here
// checks that it correctly READS metadata the engine and content layers
// already expose (method.status, chapter paragraphs, question registry),
// never that it calculates anything.
import { afterEach, describe, expect, it } from 'vitest';
import {
  chapterSourceLabel,
  findPracticableMethod,
  mostRecentChart,
  practicableMethodsForChapter,
} from './methodPractice';
import { QUESTION_REGISTRY } from './engine/questions';
import { KM_CHAPTERS } from '@/content/manuscripts/kanzul-mikban';
import { saveReading } from './history';
import type { Pattern } from '@/content/stars';

const MONEY_CHAPTER = 'if-you-want-to-know-if-you-will';
const TRAVEL_CHAPTER = 'traveling-business-and-if-you-will-return-from';

// ---------------------------------------------------------------------------
// 1. A method with executable house selections gets a practicable entry
// ---------------------------------------------------------------------------

describe('practicableMethodsForChapter — eligible methods', () => {
  it('lists every verified method for the money chapter, in method order, each matched to its own paragraph', () => {
    const methods = practicableMethodsForChapter(MONEY_CHAPTER);
    expect(methods.map((m) => m.method.id)).toEqual(['money-method-1', 'money-method-2', 'money-method-3']);
    expect(methods.map((m) => m.paragraphIndex)).toEqual([0, 1, 2]);
    for (const m of methods) {
      expect(m.method.status).toBe('verified');
      expect(m.questionId).toBe(MONEY_CHAPTER);
      expect(m.chapterId).toBe(MONEY_CHAPTER);
    }
  });

  it('never includes a non-verified method (money-method-4, Sirri Sa’ael) — no fake practice CTA', () => {
    const methods = practicableMethodsForChapter(MONEY_CHAPTER);
    expect(methods.some((m) => m.method.id === 'money-method-4')).toBe(false);
    const m4 = QUESTION_REGISTRY[MONEY_CHAPTER].methods.find((m) => m.id === 'money-method-4')!;
    expect(m4.status).not.toBe('verified');
  });

  // ---------------------------------------------------------------------
  // 2/3/9. Multiple methods in one chapter — each launches its OWN context
  // ---------------------------------------------------------------------
  it('gives each method of a multi-method chapter its own distinct, correctly matched context', () => {
    const methods = practicableMethodsForChapter(TRAVEL_CHAPTER);
    expect(methods.length).toBeGreaterThanOrEqual(2);
    const ids = methods.map((m) => m.method.id);
    expect(new Set(ids).size).toBe(ids.length); // no duplicates
    for (const m of methods) {
      // Selecting "money-method-2" must never resolve to method 1's houses.
      const found = findPracticableMethod(TRAVEL_CHAPTER, m.method.id);
      expect(found?.method.id).toBe(m.method.id);
      expect(found?.method.source.quote).toBe(m.method.source.quote);
    }
  });

  it('matches each paragraph to the method whose own label literally prefixes it — never a guess', () => {
    const chapter = KM_CHAPTERS.find((c) => c.id === MONEY_CHAPTER)!;
    const methods = practicableMethodsForChapter(MONEY_CHAPTER);
    for (const m of methods) {
      expect(m.paragraphIndex).not.toBeNull();
      expect(chapter.paragraphs[m.paragraphIndex!].startsWith(`${m.method.label}:`)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 9. Unresolved method — no misleading practice CTA
// ---------------------------------------------------------------------------

describe('findPracticableMethod — unresolved and unknown methods are refused', () => {
  it('returns null for a non-verified method id, even though it exists in the registry', () => {
    expect(findPracticableMethod(MONEY_CHAPTER, 'money-method-4')).toBeNull();
  });

  it('returns null for an unknown method id', () => {
    expect(findPracticableMethod(MONEY_CHAPTER, 'does-not-exist')).toBeNull();
  });

  it('returns null for an unknown chapter id', () => {
    expect(findPracticableMethod('not-a-real-chapter', 'money-method-1')).toBeNull();
    expect(practicableMethodsForChapter('not-a-real-chapter')).toEqual([]);
  });

  it('returns nothing for a chapter with no automatic reading at all', () => {
    // "Dreams and Their Interpretations" is registered as 'no-automatic-reading'
    // (lib/raml/questionAvailability.ts) — no engine question backs it.
    expect(practicableMethodsForChapter('dreams-and-their-interpretations')).toEqual([]);
  });

  it('returns nothing for a consolidated duplicate chapter — the CTA belongs only on the canonical chapter', () => {
    // 'about-a-pregnancy-if-it-s-a-boy' is consolidated into
    // 'if-it-s-a-male-or-female-child' (questionAvailability.ts).
    expect(practicableMethodsForChapter('about-a-pregnancy-if-it-s-a-boy')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Source label
// ---------------------------------------------------------------------------

describe('chapterSourceLabel', () => {
  it('names the book and chapter number for a numbered chapter', () => {
    expect(chapterSourceLabel(MONEY_CHAPTER)).toBe('Kanzul Mikban, Chapter 2');
  });

  it('falls back to the book alone for an unrecognised chapter id', () => {
    expect(chapterSourceLabel('not-a-real-chapter')).toBe('Kanzul Mikban');
  });
});

// ---------------------------------------------------------------------------
// 5. A completed chart is returned to the practice flow
// ---------------------------------------------------------------------------

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
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: store ? { localStorage: store } : {},
  });
}
afterEach(() => Reflect.deleteProperty(globalThis, 'window'));

const MOTHERS: [Pattern, Pattern, Pattern, Pattern] = [
  [1, 2, 1, 2],
  [2, 1, 2, 1],
  [1, 1, 2, 2],
  [2, 2, 1, 1],
];

describe('mostRecentChart', () => {
  it('is null when nothing has been cast on this device', () => {
    install(new MemoryStorage());
    expect(mostRecentChart()).toBeNull();
  });

  it('reconstructs the most recently saved chart exactly via the same buildChart() the history screen uses', () => {
    install(new MemoryStorage());
    saveReading({ questionId: MONEY_CHAPTER, mothers: MOTHERS });
    const result = mostRecentChart();
    expect(result).not.toBeNull();
    expect(result!.chart.houses).toHaveLength(16);
    expect(result!.chart.houses[0].pattern).toEqual(MOTHERS[0]);
    expect(result!.record.mothers).toEqual(MOTHERS);
  });

  it('is null when storage access itself is unavailable, never throws', () => {
    install(null);
    expect(() => mostRecentChart()).not.toThrow();
  });
});
