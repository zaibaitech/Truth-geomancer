// Prompt 18 — reading comfort.
//
// Two things are guarded here: that a reader's chosen text size is remembered
// safely and can never stop the app loading, and that the reading surfaces
// really use the one shared scale rather than drifting back to 11px. Nothing
// in this stage may touch a geomancy value, so the assertions are all about
// presentation and storage.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_READER_SIZE,
  READER_SIZES,
  READER_SIZE_ATTRIBUTE,
  READER_SIZE_BOOTSTRAP,
  READER_SIZE_KEY,
  applyReaderSize,
  isReaderSize,
  readReaderSize,
  setReaderSize,
} from './readerSize';

class MemoryStorage {
  map = new Map<string, string>();
  failOnWrite = false;
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    if (this.failOnWrite) throw new DOMException('QuotaExceededError');
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

class FakeElement {
  attrs = new Map<string, string>();
  setAttribute(k: string, v: string) {
    this.attrs.set(k, v);
  }
  getAttribute(k: string) {
    return this.attrs.get(k) ?? null;
  }
}

function install({ storage, doc }: { storage?: MemoryStorage | 'throws' | null; doc?: boolean } = {}) {
  if (storage === 'throws') {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      get() {
        throw new Error('storage is blocked');
      },
    });
  } else {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: storage ? { localStorage: storage } : {},
    });
  }
  const element = new FakeElement();
  if (doc !== false) {
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      writable: true,
      value: { documentElement: element },
    });
  }
  return element;
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window');
  Reflect.deleteProperty(globalThis, 'document');
});

function repoFile(relative: string): string {
  return readFileSync(path.resolve(__dirname, '../..', relative), 'utf8');
}

const GLOBALS = repoFile('app/globals.css');
const CONTROL = repoFile('components/settings/ReaderSizeControl.tsx');

// ---------------------------------------------------------------------------
// 1. Three sizes, remembered
// ---------------------------------------------------------------------------

describe('the reading size preference', () => {
  it('offers exactly three steps', () => {
    expect(READER_SIZES.map((s) => s.id)).toEqual(['standard', 'large', 'xlarge']);
    for (const size of READER_SIZES) {
      expect(size.label.trim().length).toBeGreaterThan(0);
      expect(size.hint.trim().length).toBeGreaterThan(0);
    }
    expect(DEFAULT_READER_SIZE).toBe('standard');
  });

  it('stores the choice on the device and reads it back', () => {
    const store = new MemoryStorage();
    const root = install({ storage: store });
    expect(setReaderSize('large')).toBe(true);
    expect(store.getItem(READER_SIZE_KEY)).toBe('large');
    expect(readReaderSize()).toBe('large');
    expect(root.getAttribute(READER_SIZE_ATTRIBUTE)).toBe('large');
  });

  it('survives a reload — the stored value is what comes back', () => {
    const store = new MemoryStorage();
    install({ storage: store });
    setReaderSize('xlarge');
    // A fresh "page load" over the same storage.
    install({ storage: store });
    expect(readReaderSize()).toBe('xlarge');
  });

  it('falls back to Standard for anything unexpected in storage', () => {
    const store = new MemoryStorage();
    install({ storage: store });
    for (const junk of ['', 'HUGE', '{"size":"large"}', 'null', '12', 'Large']) {
      store.map.set(READER_SIZE_KEY, junk);
      expect(readReaderSize(), junk).toBe('standard');
    }
  });

  it('falls back to Standard when the preference was never set', () => {
    install({ storage: new MemoryStorage() });
    expect(readReaderSize()).toBe('standard');
  });

  it('works with no storage at all, and says so instead of failing', () => {
    install({ storage: null });
    expect(readReaderSize()).toBe('standard');
    // The size still applies for this visit; only remembering it fails.
    expect(setReaderSize('large')).toBe(false);
  });

  it('survives a browser that throws on touching storage', () => {
    install({ storage: 'throws' });
    expect(() => readReaderSize()).not.toThrow();
    expect(readReaderSize()).toBe('standard');
    expect(() => setReaderSize('xlarge')).not.toThrow();
  });

  it('never throws when there is no document to mark', () => {
    Reflect.deleteProperty(globalThis, 'document');
    Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: {} });
    expect(() => applyReaderSize('large')).not.toThrow();
  });

  it('recognises only the three real values', () => {
    expect(isReaderSize('standard')).toBe(true);
    expect(isReaderSize('large')).toBe(true);
    expect(isReaderSize('xlarge')).toBe(true);
    for (const junk of [null, undefined, 0, 'big', {}, []]) expect(isReaderSize(junk)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. The preference reaches the page before it is painted
// ---------------------------------------------------------------------------

describe('applying the preference', () => {
  it('runs from the document head, wrapped, and only for real values', () => {
    expect(READER_SIZE_BOOTSTRAP).toContain(READER_SIZE_KEY);
    expect(READER_SIZE_BOOTSTRAP).toContain('try{');
    expect(READER_SIZE_BOOTSTRAP).toContain('catch');
    expect(READER_SIZE_BOOTSTRAP).toMatch(/v==='large'\|\|v==='xlarge'/);
    expect(repoFile('app/layout.tsx')).toContain('READER_SIZE_BOOTSTRAP');
  });

  it('scales only the reading type scale, through one variable', () => {
    expect(GLOBALS).toContain('--reader-scale: 1;');
    expect(GLOBALS).toContain("html[data-reader-size='large']");
    expect(GLOBALS).toContain("html[data-reader-size='xlarge']");
    // Every reading size is the base size times the reader's choice…
    for (const token of ['type-section', 'type-method', 'type-quote', 'type-body', 'type-evidence', 'type-verdict', 'type-meta', 'type-label', 'type-title']) {
      const rule = GLOBALS.slice(GLOBALS.indexOf(`.${token} {`), GLOBALS.indexOf('}', GLOBALS.indexOf(`.${token} {`)));
      expect(rule, token).toMatch(/font-size: calc\([\d.]+rem \* var\(--reader-scale\)\)/);
    }
    // …and nothing else uses it, so glyphs, charts and icons keep their size.
    expect((GLOBALS.match(/var\(--reader-scale\)/g) ?? []).length).toBe(9);
  });

  it('keeps the smallest reading label at 14px before any scaling', () => {
    const label = GLOBALS.slice(GLOBALS.indexOf('.type-label {'), GLOBALS.indexOf('}', GLOBALS.indexOf('.type-label {')));
    expect(label).toContain('0.875rem');
  });
});

// ---------------------------------------------------------------------------
// 3. The control itself
// ---------------------------------------------------------------------------

describe('the text-size control', () => {
  it('lives in Settings, not in the casting flow', () => {
    expect(repoFile('app/settings/page.tsx')).toContain('ReaderSizeControl');
    for (const file of ['components/raml/CastingBoard.tsx', 'components/raml/CastingFlow.tsx']) {
      expect(repoFile(file), file).not.toContain('ReaderSizeControl');
    }
  });

  it('is a real radio group with three options and no CSS jargon', () => {
    expect(CONTROL).toContain('role="radiogroup"');
    expect(CONTROL).toContain('role="radio"');
    expect(CONTROL).toContain('aria-checked={selected}');
    expect(CONTROL).toContain('aria-label="Text size"');
    // No CSS vocabulary in what a reader actually sees (class names are not
    // user-facing, so this looks at the rendered strings only).
    const rendered = (CONTROL.match(/>[^<>{}]+</g) ?? []).join(' ') + READER_SIZES.map((s) => `${s.label} ${s.hint}`).join(' ');
    expect(rendered).not.toMatch(/font-size|\brem\b|\bpx\b|CSS|typography/i);
  });

  it('announces the change and shows what the choice looks like', () => {
    expect(CONTROL).toContain('aria-live="polite"');
    expect(CONTROL).toContain('Text size set to');
    expect(CONTROL).toContain('Preview');
  });

  it('is honest when the browser will not remember it', () => {
    expect(CONTROL).toContain('won’t let the app remember the setting');
  });
});

// ---------------------------------------------------------------------------
// 4. The reading surfaces use the scale
// ---------------------------------------------------------------------------

describe('reading surfaces', () => {
  const FILES = [
    'components/raml/CastingFlow.tsx',
    'components/raml/CastingBoard.tsx',
    'components/raml/IntentionPicker.tsx',
    'components/raml/QuestionCard.tsx',
    'components/raml/ReadingTab.tsx',
    'components/raml/ResultTabs.tsx',
    'components/raml/HistoryCard.tsx',
    'components/raml/CastingResultView.tsx',
    'components/raml/reading/CalculationDetails.tsx',
    'components/raml/reading/OutcomeCard.tsx',
    'components/raml/reading/InsufficientNotice.tsx',
    'components/raml/reading/FigureCard.tsx',
    'components/raml/reading/MethodConsistencyCard.tsx',
    'components/raml/reading/ReadingHeader.tsx',
    'components/raml/reading/SupportingIndicators.tsx',
    'components/raml/reading/ResultSummaryCard.tsx',
    'components/raml/reading/VerificationNotice.tsx',
    'app/raml/history/page.tsx',
    'app/raml/history/[id]/page.tsx',
    'app/settings/page.tsx',
  ];

  it('has no fixed small text left anywhere a reading happens', () => {
    for (const file of FILES) {
      const source = repoFile(file);
      expect(source, file).not.toMatch(/text-\[\d+(\.\d+)?px\]/);
      expect(source, file).not.toMatch(/\btext-xs\b/);
    }
  });

  it('scales with the reader’s choice rather than being pinned in px', () => {
    for (const file of FILES) {
      expect(repoFile(file), file).toMatch(/type-(label|meta|body|evidence|quote|verdict|section|method|title)/);
    }
  });

  it('keeps a card’s question larger than its own metadata', () => {
    const card = repoFile('components/raml/QuestionCard.tsx');
    expect(card).toMatch(/type-body font-medium text-sand-light">\{entry\.title\}/);
    expect(card).toMatch(/type-label[^"]*">\{entry\.sourceTitle\}/);
    const history = repoFile('components/raml/HistoryCard.tsx');
    expect(history).toMatch(/type-body font-medium text-sand-light">\{entry\.title\}/);
  });
});

// ---------------------------------------------------------------------------
// 5. Contrast and focus
// ---------------------------------------------------------------------------

describe('legibility', () => {
  // Measured against this app's own palette: sand at 35% over the card is
  // 2.23:1, at 60% it is 4.27:1, at 65% 4.66:1, at 70% 5.19:1.
  it('never renders text below the agreed contrast floor', () => {
    const files = [
      'components/raml/CastingFlow.tsx',
      'components/raml/CastingBoard.tsx',
      'components/raml/IntentionPicker.tsx',
      'components/raml/QuestionCard.tsx',
      'components/raml/HistoryCard.tsx',
      'components/raml/ResultTabs.tsx',
      'components/raml/CastingResultView.tsx',
      'components/raml/reading/CalculationDetails.tsx',
      'components/raml/reading/FigureCard.tsx',
      'components/raml/reading/MethodConsistencyCard.tsx',
      'components/raml/reading/ReadingHeader.tsx',
      'components/raml/reading/ResultSummaryCard.tsx',
      'components/raml/reading/SupportingIndicators.tsx',
      'components/raml/reading/OutcomeCard.tsx',
      'components/raml/reading/InsufficientNotice.tsx',
      'components/raml/reading/VerificationNotice.tsx',
      'app/raml/history/page.tsx',
      'app/raml/history/[id]/page.tsx',
      'app/settings/page.tsx',
    ];
    for (const file of files) {
      const faint = repoFile(file).match(/text-sand\/(\d+)/g) ?? [];
      for (const token of faint) {
        const alpha = Number(token.split('/')[1]);
        expect(alpha, `${file}: ${token}`).toBeGreaterThanOrEqual(60);
      }
    }
  });

  it('gives the keyboard a visible landing place', () => {
    expect(GLOBALS).toContain(':focus-visible');
    expect(GLOBALS).toMatch(/outline: 2px solid #d97b4c/);
    // The text inputs used to remove the outline entirely.
    for (const file of ['components/raml/IntentionPicker.tsx', 'app/raml/history/page.tsx', 'components/raml/CastingFlow.tsx']) {
      expect(repoFile(file), file).not.toContain('focus:outline-none');
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Nothing from the earlier stages moved
// ---------------------------------------------------------------------------

describe('earlier guarantees still hold', () => {
  it('keeps the casting board’s accessible names and its silence about counts', () => {
    const board = repoFile('components/raml/CastingBoard.tsx');
    expect(board).toContain('. Tap to register a mark.');
    expect(board).toContain('tap registered.');
    expect(board).not.toMatch(/\{drawTaps\[lineIndex\]\}/);
    expect(board).not.toContain('FigureGlyph');
  });

  it('keeps reduced motion, the result heading and the disclosure control', () => {
    expect(GLOBALS).toContain('@media (prefers-reduced-motion: reduce)');
    expect(repoFile('components/raml/reading/ReadingHeader.tsx')).toMatch(/<h2/);
    expect(repoFile('components/raml/reading/ReadingHeader.tsx')).toContain('role="status"');
    expect(repoFile('components/raml/EngineReadingView.tsx')).toContain('aria-expanded={showCalculation}');
  });

  it('changes no geomancy value — the size control touches presentation only', () => {
    const module = repoFile('lib/raml/readerSize.ts');
    expect(module).not.toMatch(/reduceCount|buildChart|runReading|QUESTION_REGISTRY|Pattern/);
    expect(CONTROL).not.toMatch(/reduceCount|buildChart|runReading/);
  });
});
