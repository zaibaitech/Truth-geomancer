// Phase 1 — Kanzul practice workflow & discoverability.
//
// A. every verified/practisable method has a visible practice entry point
// B. the existing inline "Try this method" buttons still work
// C. methods without an inline label are still reachable (fallback links)
// D. an existing saved chart is detected, previewed and offered first
// E. without one, casting is offered, the practice cast is saved and the
//    user returns to the selected method
// F. whole-chart methods get no fake house selection and no stand-in figure
// G. right-to-left guidance appears on the casting board
// H. the protected engine/source files do not depend on any of this
//
// Like practiceUi.test.ts, screen wiring is checked against the shipped
// component source (no DOM harness in this repo); the reader's links are
// checked by rendering the REAL chapter components to HTML, the way
// kanzulStarText.test.ts does.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { KM_CHAPTERS } from '@/lib/server/content/kanzulMikban';
import { ChapterMethodPractice, ChapterPracticeLinks } from '@/components/books/ChapterMethodPractice';
import { QUESTION_REGISTRY } from './engine/questions';
import { runReading } from './engine';
import { buildChart, castRandomChart } from './casting';
import { listReadings } from './history';
import {
  findPracticableMethod,
  isWholeChartRow,
  mostRecentChart,
  practiceEntryPointsForChapter,
  practiceHref,
  savePracticeChart,
} from './methodPractice';
import type { Pattern } from '@/content/stars';

function repoFile(relative: string): string {
  return readFileSync(path.resolve(__dirname, '..', '..', relative), 'utf8');
}

const READER = repoFile('app/books/[id]/read/page.tsx');
const FLOW = repoFile('components/raml/practice/MethodPracticeFlow.tsx');
const PREVIEW = repoFile('components/raml/practice/CurrentChartPreview.tsx');
const BOARD = repoFile('components/raml/CastingBoard.tsx');

/** The chapters whose body the reader renders with a figure-specific
 * component instead of ChapterMethodPractice — read from the reader page
 * itself, so this test follows the page if that list ever changes. */
const FIGURE_BODY_CHAPTERS = new Set(
  Array.from(
    READER.slice(READER.indexOf('chapter.id === "dreams-and-their-interpretations"'), READER.indexOf('<FigureBody')).matchAll(
      /chapter\.id\s*===\s*"([^"]+)"/g,
    ),
  ).map((m) => m[1]),
);

/** Renders a chapter exactly the way the reader page does and returns the
 * practice hrefs a reader can actually see. */
function visiblePracticeHrefs(chapter: (typeof KM_CHAPTERS)[number]): string[] {
  const html = FIGURE_BODY_CHAPTERS.has(chapter.id)
    ? renderToStaticMarkup(createElement(ChapterPracticeLinks, { chapterId: chapter.id }))
    : renderToStaticMarkup(createElement(ChapterMethodPractice, { chapterId: chapter.id, paragraphs: chapter.paragraphs }));
  return Array.from(html.matchAll(/href="(\/raml\/practice\/[^"]+)"/g)).map((m) => m[1]);
}

const verifiedMethods = Object.values(QUESTION_REGISTRY).flatMap((q) =>
  q.methods.filter((m) => m.status === 'verified').map((m) => ({ question: q, method: m })),
);

describe('A. every verified/practisable method has a discoverable practice entry point', () => {
  const visible = new Map<string, number>();
  for (const c of KM_CHAPTERS) for (const href of visiblePracticeHrefs(c)) visible.set(href, (visible.get(href) ?? 0) + 1);

  it('the reader page really mounts the fallback links for the figure-body chapters', () => {
    expect(FIGURE_BODY_CHAPTERS.size).toBeGreaterThan(0);
    expect(READER).toContain('<ChapterPracticeLinks chapterId={chapter.id} />');
  });

  it('every verified method in the registry is linked, visibly, from its own chapter in the book', () => {
    expect(verifiedMethods.length).toBeGreaterThan(0);
    const missing = verifiedMethods
      .map(({ question, method }) => `/raml/practice/${question.chapterId}/${method.id}`)
      .filter((href) => !visible.has(href));
    expect(missing).toEqual([]);
  });

  it('each method gets exactly one entry point — no duplicate buttons', () => {
    const duplicated = Array.from(visible).filter(([, n]) => n > 1);
    expect(duplicated).toEqual([]);
  });

  it('every visible link opens a method the practice route actually resolves (no invented methods)', () => {
    expect(visible.size).toBe(verifiedMethods.length);
    for (const href of Array.from(visible.keys())) {
      const [, , , chapterId, methodId] = href.split('/');
      expect(findPracticableMethod(chapterId, methodId), href).not.toBeNull();
    }
  });
});

describe('B/C. inline buttons are unchanged; everything else falls back to a link', () => {
  it('inline + fallback are exactly the practicable methods, disjoint, in registry order', () => {
    for (const c of KM_CHAPTERS) {
      const { inline, fallback } = practiceEntryPointsForChapter(c.id, c.paragraphs);
      const inlineIds = Array.from(inline.values()).map((m) => m.method.id);
      const fallbackIds = fallback.map((m) => m.method.id);
      expect(inlineIds.filter((id) => fallbackIds.includes(id)), c.id).toEqual([]);
      const question = QUESTION_REGISTRY[c.id];
      const expected = question && question.chapterId === c.id ? question.methods.filter((m) => m.status === 'verified').map((m) => m.id) : [];
      expect([...inlineIds, ...fallbackIds].sort(), c.id).toEqual([...expected].sort());
      // Fallback keeps the registry's own method order.
      expect(fallbackIds, c.id).toEqual(expected.filter((id) => fallbackIds.includes(id)));
    }
  });

  it('an inline button still sits right after its own source paragraph, whose text starts with the method label', () => {
    let inlineCount = 0;
    for (const c of KM_CHAPTERS) {
      const { inline } = practiceEntryPointsForChapter(c.id, c.paragraphs);
      for (const [i, m] of Array.from(inline)) {
        inlineCount += 1;
        expect(c.paragraphs[i].trimStart().startsWith(`${m.method.label}:`)).toBe(true);
      }
    }
    expect(inlineCount).toBeGreaterThan(0);
    const money = KM_CHAPTERS.find((c) => c.number === 2)!;
    const html = renderToStaticMarkup(createElement(ChapterMethodPractice, { chapterId: money.id, paragraphs: money.paragraphs }));
    expect(html).toContain('Try this method');
  });

  it('a chapter whose source has no "Method N:" label (Chapter 4) is reachable through the fallback link', () => {
    const c = KM_CHAPTERS.find((x) => x.number === 4)!;
    const { inline, fallback } = practiceEntryPointsForChapter(c.id, c.paragraphs);
    expect(inline.size).toBe(0);
    expect(fallback.length).toBeGreaterThan(0);
    const html = renderToStaticMarkup(createElement(ChapterMethodPractice, { chapterId: c.id, paragraphs: c.paragraphs }));
    expect(html).toContain('Practise this method');
    expect(html).toContain(`href="${practiceHref(fallback[0])}"`);
    expect(html).not.toContain('Try this method');
  });

  it('a figure-body chapter (Chapter 151) gets its link even though its paragraphs are not rendered by ChapterMethodPractice', () => {
    const html = renderToStaticMarkup(createElement(ChapterPracticeLinks, { chapterId: 'dreams-and-their-interpretations' }));
    expect(html).toContain('/raml/practice/dreams-and-their-interpretations/');
  });

  it('the source wording is never rewritten — the fallback list is added after the paragraphs, not into them', () => {
    const c = KM_CHAPTERS.find((x) => x.number === 4)!;
    const html = renderToStaticMarkup(createElement(ChapterMethodPractice, { chapterId: c.id, paragraphs: c.paragraphs }));
    expect(html.indexOf('Practise this method')).toBeGreaterThan(html.lastIndexOf('manuscript-paragraph'));
  });
});

// --- localStorage stand-in (same approach as methodPractice.test.ts) -------
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
afterEach(() => Reflect.deleteProperty(globalThis, 'window'));

const MOTHERS: [Pattern, Pattern, Pattern, Pattern] = [
  [1, 2, 1, 2],
  [2, 1, 2, 1],
  [1, 1, 2, 2],
  [2, 2, 1, 1],
];

describe('D. an existing saved chart is the normal starting point', () => {
  it('is detected after mount (no server/client mismatch) and previewed before anything is applied', () => {
    expect(FLOW).toMatch(/useEffect\(\(\) => \{\s*setExisting\(mostRecentChart\(\)\);\s*setExistingChecked\(true\);/);
    expect(FLOW).not.toContain('useMemo(() => mostRecentChart()');
    expect(FLOW).toContain('Your current chart');
    expect(FLOW).toMatch(/<CurrentChartPreview chart=\{existing\.chart\} record=\{existing\.record\} \/>/);
    expect(PREVIEW).toContain('chart.houses.map');
    expect(PREVIEW).toContain('FigureGlyph');
  });

  it('offers "Apply to current chart" as the primary action and keeps "Cast a new chart" available', () => {
    const existingBlock = FLOW.slice(FLOW.indexOf('Your current chart'), FLOW.indexOf('Create a chart'));
    expect(existingBlock).toContain('onClick={useExistingChart}');
    expect(existingBlock).toContain('Apply to current chart');
    expect(existingBlock).toContain('Use the chart you already cast.');
    expect(existingBlock).toContain('Cast a new chart');
    expect(existingBlock.indexOf('Apply to current chart')).toBeLessThan(existingBlock.indexOf('Cast a new chart'));
    expect(existingBlock).toMatch(/bg-clay[^"]*"\s*>\s*Apply to current chart/);
  });

  it('applying the current chart goes straight to the walkthrough — the casting board is never shown', () => {
    const fn = FLOW.slice(FLOW.indexOf('function useExistingChart'), FLOW.indexOf('function onCastComplete'));
    expect(fn).toContain("setStage('walkthrough')");
    expect(fn).not.toContain("setStage('casting')");
  });
});

describe('E. no saved chart: cast once, save it, return to the method', () => {
  it('says the method needs a chart and offers casting', () => {
    const noChart = FLOW.slice(FLOW.indexOf('Create a chart'), FLOW.indexOf("<p className=\"type-meta uppercase tracking-widest text-sand/65\">Source</p>"));
    expect(noChart).toContain('This method needs a chart to continue.');
    expect(noChart).toContain('Cast a chart to continue');
    expect(noChart).toMatch(/onClick=\{startCasting\}[\s\S]*Cast a chart\s*</);
  });

  it('a completed practice cast is saved, becomes the current chart, and continues this same method', () => {
    const fn = FLOW.slice(FLOW.indexOf('function onCastComplete'), FLOW.indexOf('function toggleHouse'));
    expect(fn).toContain('savePracticeChart(questionId, mothers)');
    expect(fn).toContain('setExisting({ chart: saved.chart, record: saved.record })');
    expect(fn).toContain("setStage('walkthrough')");
  });

  it('savePracticeChart stores the chart in the existing history so the NEXT method sees it as the current chart', () => {
    install(new MemoryStorage());
    expect(mostRecentChart()).toBeNull();
    const saved = savePracticeChart('if-it-will-rain-today-or-not', MOTHERS);
    expect(saved.persisted).toBe(true);
    expect(saved.chart).toEqual({ ...buildChart(MOTHERS), createdAt: saved.chart.createdAt });
    expect(listReadings()).toHaveLength(1);
    const next = mostRecentChart();
    expect(next).not.toBeNull();
    expect(next!.record.id).toBe(saved.record.id);
    expect(next!.chart.houses.map((h) => h.pattern)).toEqual(saved.chart.houses.map((h) => h.pattern));
  });

  it('still returns a usable chart when the browser refuses storage, and the screen says so', () => {
    install(null);
    const saved = savePracticeChart('if-it-will-rain-today-or-not', MOTHERS);
    expect(saved.persisted).toBe(false);
    expect(saved.chart.houses).toHaveLength(16);
    expect(FLOW).toContain('practiceSaved === false');
  });

  it('the saved-chart note appears on every outcome screen after a practice cast, including "does not trigger"', () => {
    const uncertain = FLOW.slice(FLOW.indexOf("if (resultState === 'uncertain')"), FLOW.indexOf('const workingCount'));
    expect(uncertain).toContain('{savedChartNote}');
    expect(FLOW).toMatch(/const savedChartNote = justCast \?/);
  });

  it('the casting screen offers a way back to the method and says where the user will land', () => {
    const casting = FLOW.slice(FLOW.indexOf("if (stage === 'casting')"), FLOW.indexOf('// stage === \'walkthrough\''));
    expect(casting).toContain("setStage('intro')");
    expect(casting).toContain('you’ll return straight to this method');
  });
});

describe('F. whole-chart methods', () => {
  it('isWholeChartRow is true exactly for rows with no named houses', () => {
    expect(isWholeChartRow({ housesUsed: [] })).toBe(true);
    expect(isWholeChartRow({ housesUsed: [4] })).toBe(false);
  });

  it('the practicable whole-chart methods are detected from the engine output itself', () => {
    const whole = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const chart = castRandomChart();
      for (const { question, method } of verifiedMethods) {
        const row = runReading(chart, question.id)?.methodResults.find((m) => m.id === method.id);
        if (row && isWholeChartRow(row)) whole.add(`${question.id}/${method.id}`);
      }
    }
    for (const id of ['if-it-will-rain-today-or-not/', 'if-you-have-enemies-and-how-many/', 'if-the-traveller-has-travelled-by-air-water/']) {
      expect(Array.from(whole).some((w) => w.startsWith(id)), id).toBe(true);
    }
  });

  it('replaces the house-selection step with "This method reads the whole chart." — never "0 of 0 houses selected"', () => {
    expect(FLOW).toMatch(/wholeChart \? 'whole' : 'houses'/);
    expect(FLOW).toContain('This method reads the whole chart.');
    // The "N of M houses selected" counter only exists inside the named-houses step.
    const housesBlock = FLOW.slice(FLOW.indexOf("{current === 'houses' ? ("), FLOW.indexOf("{current === 'working' ? ("));
    const wholeBlock = FLOW.slice(FLOW.indexOf("{current === 'whole' ? ("), FLOW.indexOf("{current === 'houses' ? ("));
    expect(housesBlock).toContain('{selectedRequiredCount} of {requiredHouses.length}');
    expect(wholeBlock).not.toContain('selectedRequiredCount');
    expect(wholeBlock).toContain('required={[]}');
    expect(FLOW).toMatch(/disabled=\{current === 'houses' && !housesConfirmed\}/);
  });

  it('never presents the engine\'s representative reference figure as the result of a whole-chart method', () => {
    const result = FLOW.slice(FLOW.indexOf("{current === 'result' ? ("));
    expect(result).toMatch(/\{wholeChart \? \([\s\S]*there is no single result figure to show[\s\S]*\) : \([\s\S]*row\.resultPattern/);
  });
});

describe('6. existing visualisations are reused, not reimplemented', () => {
  it('recast and Mothers-pairing methods show the Reading flow\'s own components', () => {
    expect(FLOW).toContain("import { RecastWorkingDiagram } from '../reading/RecastWorkingDiagram'");
    expect(FLOW).toContain("import { DreamWorkingPanel } from '../DreamWorkingPanel'");
    expect(FLOW).toMatch(/row\.casting\.inspects === 'recast' \? <RecastWorkingDiagram method=\{row\} \/>/);
    expect(FLOW).toMatch(/row\.casting\.display === 'mothers_and_pairing' \? <DreamWorkingPanel chart=\{chart\} \/>/);
    expect(FLOW).toMatch(/<CastingBoard onComplete=\{onCastComplete\} mothersOnly=\{mothersOnly\} \/>/);
  });
});

describe('G. right-to-left casting guidance', () => {
  it('the casting board names the Cancelling Method and says to draw from right to left', () => {
    expect(BOARD).toContain("const METHOD_NAME = 'The Cancelling Method'");
    expect(BOARD).toContain("const DIRECTION_CUE = 'Draw from right to left.'");
    expect(BOARD).toMatch(/\{METHOD_NAME\} · \{DIRECTION_CUE\}/);
  });

  it('is guidance only: taps are still counted per line, never accepted/rejected by position', () => {
    expect(BOARD).toContain('setTaps((prev) => registerTap(prev, drawIndex, lineIndex))');
    expect(BOARD).not.toMatch(/clientX|offsetX|getBoundingClientRect|pageX/);
  });
});

describe('H. protected engine/source files are independent of this phase', () => {
  const PROTECTED = [
    'content/stars.ts',
    'lib/raml/casting.ts',
    'lib/raml/engine/chartModel.ts',
    'lib/raml/engine/ruleEngine.ts',
    'lib/raml/engine/types.ts',
    'lib/raml/engine/operations.ts',
    'lib/raml/engine/reading.ts',
    'lib/raml/engine/interpretation.ts',
  ];
  it('none of them references the practice workflow', () => {
    for (const f of PROTECTED) {
      expect(repoFile(f), f).not.toMatch(/methodPractice|practiceEntryPointsForChapter|savePracticeChart|isWholeChartRow|MethodPracticeFlow|ChapterPracticeLinks/);
    }
  });
});
