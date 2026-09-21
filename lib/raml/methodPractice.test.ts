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
  practiceResultState,
} from './methodPractice';
import { QUESTION_REGISTRY } from './engine/questions';
import type { ReadingMethodRow } from './engine/reading';
import { publicCastingDefault } from './engine/castingRequirement';
// Prompt 27: the full chapter text is now server-only. A test file runs in
// Node, never in a client bundle, so importing it directly here to exercise
// the paragraph-matching path is safe and appropriate — this is exactly
// the kind of "authorized, server-side caller" the new optional
// `paragraphs` parameter is designed for (see methodPractice.ts's own
// module comment).
import { KM_CHAPTERS } from '@/lib/server/content/kanzulMikban';
import { saveReading } from './history';
import type { Pattern } from '@/content/stars';

const MONEY_CHAPTER = 'if-you-want-to-know-if-you-will';
const TRAVEL_CHAPTER = 'traveling-business-and-if-you-will-return-from';

// ---------------------------------------------------------------------------
// 1. A method with executable house selections gets a practicable entry
// ---------------------------------------------------------------------------

const MONEY_PARAGRAPHS = KM_CHAPTERS.find((c) => c.id === MONEY_CHAPTER)!.paragraphs;
const TRAVEL_PARAGRAPHS = KM_CHAPTERS.find((c) => c.id === TRAVEL_CHAPTER)!.paragraphs;

describe('practicableMethodsForChapter — eligible methods', () => {
  it('lists every verified method for the money chapter, in method order, each matched to its own paragraph when paragraphs are supplied', () => {
    const methods = practicableMethodsForChapter(MONEY_CHAPTER, MONEY_PARAGRAPHS);
    expect(methods.map((m) => m.method.id)).toEqual(['money-method-1', 'money-method-2', 'money-method-3']);
    expect(methods.map((m) => m.paragraphIndex)).toEqual([0, 1, 2]);
    for (const m of methods) {
      expect(m.method.status).toBe('verified');
      expect(m.questionId).toBe(MONEY_CHAPTER);
      expect(m.chapterId).toBe(MONEY_CHAPTER);
    }
  });

  it('gives every method paragraphIndex: null when the caller supplies no paragraphs — the shape a client-side caller (e.g. MethodPracticeFlow) gets, with no chapter text in its own import graph', () => {
    const methods = practicableMethodsForChapter(MONEY_CHAPTER);
    expect(methods.map((m) => m.method.id)).toEqual(['money-method-1', 'money-method-2', 'money-method-3']);
    expect(methods.every((m) => m.paragraphIndex === null)).toBe(true);
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
    const methods = practicableMethodsForChapter(TRAVEL_CHAPTER, TRAVEL_PARAGRAPHS);
    expect(methods.length).toBeGreaterThanOrEqual(2);
    const ids = methods.map((m) => m.method.id);
    expect(new Set(ids).size).toBe(ids.length); // no duplicates
    expect(new Set(methods.map((m) => m.paragraphIndex)).size).toBe(ids.length); // no shared paragraph
    for (const m of methods) {
      // Selecting "money-method-2" must never resolve to method 1's houses.
      const found = findPracticableMethod(TRAVEL_CHAPTER, m.method.id);
      expect(found?.method.id).toBe(m.method.id);
      expect(found?.method.label).toBe(m.method.label);
      expect(found?.method.sourceChapterId).toBe(m.method.sourceChapterId);
    }
  });

  it('matches each paragraph to the method whose own label literally prefixes it — never a guess', () => {
    const methods = practicableMethodsForChapter(MONEY_CHAPTER, MONEY_PARAGRAPHS);
    for (const m of methods) {
      expect(m.paragraphIndex).not.toBeNull();
      expect(MONEY_PARAGRAPHS[m.paragraphIndex!].startsWith(`${m.method.label}:`)).toBe(true);
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
    // 'How to Make One Win Over the Other Opponents' is registered as
    // 'no-automatic-reading' (lib/raml/questionAvailability.ts) — no engine
    // question backs it, unlike Chapter 151 or the Gift/Visitor Figures
    // continuation (see the tests below), whose procedures ARE registered.
    expect(practicableMethodsForChapter('how-to-make-one-win-over-the-other')).toEqual([]);
  });

  it('returns the real practicable method for Chapter 151, now that its author-clarified procedure is registered', () => {
    const methods = practicableMethodsForChapter('dreams-and-their-interpretations');
    expect(methods.length).toBe(1);
    expect(methods[0].questionId).toBe('dreams-and-their-interpretations');
    expect(methods[0].method.status).toBe('verified');
  });

  it('returns the real practicable method for the Gift/Visitor Figures continuation, now that eight of its result figures are recovered', () => {
    const methods = practicableMethodsForChapter('continued-from-chapter-twenty-eight');
    expect(methods.length).toBe(1);
    expect(methods[0].questionId).toBe('continued-from-chapter-twenty-eight');
    expect(methods[0].method.status).toBe('verified');
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

// ---------------------------------------------------------------------------
// Prompt 54 — practiceResultState: distinguishing a valid `uncertain`
// verdict from a genuine computation failure. This is the exact decision
// MethodPracticeFlow.tsx's walkthrough gate makes, pulled out as a pure
// function so it's testable without a rendering framework (this repo has
// no jsdom/@testing-library/react — see vitest.config.ts's `environment:
// 'node'` and `.ts`-only `include`). Minimal, realistic ReadingMethodRow-
// shaped fixtures below stand in for what practiceService.ts's real
// runReading() call actually produces — the "real chart, real row" version
// of this same contract is covered end-to-end in
// lib/server/raml/practiceService.test.ts (Prompt 54 additions).
// ---------------------------------------------------------------------------

function row(overrides: Partial<ReadingMethodRow>): ReadingMethodRow {
  return {
    id: 'some-method-1',
    label: 'Method 1',
    status: 'verified',
    counted: true,
    agreesWithOverall: null,
    outcome: 'favourable',
    outcomeLabel: 'Favourable',
    interpretation: 'Some source-backed statement.',
    reviewNote: null,
    housesUsed: [4],
    calculationSteps: ['H4 = Yussif'],
    resultFigureName: 'Yussif',
    resultPattern: [1, 1, 2, 1],
    resultElement: 'Fire',
    resultFortune: null,
    resultDirection: null,
    sourceQuote: 'After drawing the chart, check h4.',
    sourceLabel: 'Kanzul Mikban, Chapter 32',
    casting: publicCastingDefault(),
    ...overrides,
  };
}

describe('practiceResultState — Test A/B: uncertain is not a computation failure', () => {
  it('TEST A — a row with counted: false, outcome: "uncertain", a real resultPattern, and a real interpretation is "uncertain", never "failure"', () => {
    const r = row({
      counted: false,
      outcome: 'uncertain',
      outcomeLabel: 'Uncertain',
      interpretation: 'The source only defines the "Ali follows Ali" trigger — this is not addressed.',
      resultPattern: [1, 1, 1, 1], // a real reference figure, never null
    });
    expect(practiceResultState(r)).toBe('uncertain');
    // Sanity: the fields the "uncertain" UI branch actually reads are present.
    expect(r.interpretation).not.toBeNull();
    expect(r.outcomeLabel).not.toBeNull();
  });

  it('TEST B — genuine failure remains failure: a null row', () => {
    expect(practiceResultState(null)).toBe('failure');
  });

  it('TEST B — genuine failure remains failure: a row whose calculation never produced a figure (resultPattern: null)', () => {
    // This is the shape ruleEngine.ts produces when a verified method's own
    // calculate() throws (calculation: null, verdict: null) — a real
    // technical failure, distinct in every way from a computed `uncertain`.
    const r = row({ counted: false, outcome: null, outcomeLabel: null, interpretation: null, resultPattern: null });
    expect(practiceResultState(r)).toBe('failure');
  });

  it('a normal counted result (favourable/unfavourable/mixed) is "result" — the existing walkthrough is unaffected', () => {
    expect(practiceResultState(row({ counted: true, outcome: 'favourable' }))).toBe('result');
    expect(practiceResultState(row({ counted: true, outcome: 'unfavourable' }))).toBe('result');
    expect(practiceResultState(row({ counted: true, outcome: 'mixed' }))).toBe('result');
  });
});
