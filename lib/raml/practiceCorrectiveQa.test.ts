// Phase 1 corrective QA — regression tests for the issues found in real-user
// QA of commit 7280373. Screen wiring is checked against the shipped
// component source (no DOM harness here, same approach as practiceUi.test.ts);
// pure helpers and the engine equivalence are exercised directly.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { runReading } from './engine';
import { castRandomChart, buildChart } from './casting';
import { describeReading, listReadings } from './history';
import {
  currentChartKind,
  needsExplicitChartChoice,
  recastChartFor,
  savePracticeChart,
} from './methodPractice';
import { catalogEntry } from './questionCatalog';
import { DREAM_INTERPRETATION_FIGURES } from '@/content/manuscripts/dreamInterpretations';
import { HouseSelector } from '@/components/raml/practice/HouseSelector';
import type { Pattern } from '@/content/stars';

function repoFile(relative: string): string {
  return readFileSync(path.resolve(__dirname, '..', '..', relative), 'utf8');
}
const FLOW = repoFile('components/raml/practice/MethodPracticeFlow.tsx');
const PANEL = repoFile('components/raml/practice/PracticeChartPanel.tsx');
const PREVIEW = repoFile('components/raml/practice/CurrentChartPreview.tsx');

const DREAM = 'dreams-and-their-interpretations';
const CH1 = 'traveling-business-and-if-you-will-return-from';
const CH34 = 'if-your-enemies-are-working-against-you-or';

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

describe('A. a chart cast during method practice reaches Past Readings', () => {
  it('is stored by the existing history store and described there under its own chapter', async () => {
    install(new MemoryStorage());
    savePracticeChart(CH1, MOTHERS);
    const [record] = listReadings();
    expect(record.questionId).toBe(CH1);
    // The result itself is fetched from the server route (covered by
    // browser QA); here: the entry exists, is titled by its own question and
    // rebuilds the very chart that was cast.
    const entry = await describeReading(record);
    expect(entry.title).toBe(catalogEntry(CH1)!.title);
    expect(entry.chart?.houses.map((h) => h.pattern)).toEqual(buildChart(MOTHERS).houses.map((h) => h.pattern));
  });
});

describe('B/C. the current chart is identified, and a Dream chart is never used silently', () => {
  it('classifies the saved chart by what it was cast for — generic casting metadata, not a question-id check', () => {
    expect(currentChartKind({ questionId: 'general' })).toBe('general');
    expect(currentChartKind({ questionId: DREAM })).toBe('mothers_only');
    expect(currentChartKind({ questionId: CH1 })).toBe('question');
    expect(repoFile('lib/raml/methodPractice.ts')).not.toMatch(/=== ['"]dreams-and-their-interpretations['"]/);
  });

  it('requires an explicit choice only for a Dream chart applied to a full-chart method', () => {
    expect(needsExplicitChartChoice({ questionId: DREAM }, CH1)).toBe(true);
    expect(needsExplicitChartChoice({ questionId: DREAM }, CH34)).toBe(true);
    expect(needsExplicitChartChoice({ questionId: DREAM }, DREAM)).toBe(false);
    expect(needsExplicitChartChoice({ questionId: CH1 }, CH34)).toBe(false);
    expect(needsExplicitChartChoice({ questionId: 'general' }, CH1)).toBe(false);
  });

  it('the Dream-chart branch names the chart, makes casting the primary action and the reuse an explicit secondary choice', () => {
    const dream = FLOW.slice(FLOW.indexOf('{explicitChoice ? ('), FLOW.indexOf('Practice with this chart'));
    expect(dream).toContain('This chart was cast for a Dream reading');
    expect(dream.indexOf('Cast a new chart')).toBeLessThan(dream.indexOf('Use this Dream chart anyway'));
    expect(dream).toMatch(/bg-clay[^"]*"\s*>\s*Cast a new chart/);
    expect(FLOW).toContain('needsExplicitChartChoice(existing.record, questionId)');
  });

  it('the preview states the chart\'s source/type and cast time, above the 16-figure preview', () => {
    expect(PREVIEW).toContain("'General reading chart'");
    expect(PREVIEW).toContain("'Dream reading chart'");
    expect(PREVIEW).toContain('Cast ${when}');
    expect(PREVIEW).toContain('chart.houses.map');
  });
});

describe('E. the chart a method used is visible on every outcome screen', () => {
  it('the "does not trigger" screen shows the chart, the houses used, the working and the figure produced', () => {
    const uncertain = FLOW.slice(FLOW.indexOf("if (resultState === 'uncertain')"), FLOW.indexOf('const workingCount'));
    expect(uncertain).toContain('<PracticeChartPanel chart={chart} row={row} />');
    expect(uncertain).toContain('Figure produced');
    expect(uncertain).toMatch(/!isWholeChartRow\(row\) && row\.resultPattern/);
  });

  it('the result step shows the same chart panel', () => {
    const result = FLOW.slice(FLOW.indexOf("{current === 'result' ? ("));
    expect(result).toContain('<PracticeChartPanel chart={chart} row={row} />');
  });

  it('the panel outlines the method\'s own housesUsed, read-only, and lists the engine\'s calculation lines verbatim', () => {
    expect(PANEL).toContain('required={wholeChart ? [] : row.housesUsed}');
    expect(PANEL).toContain('readOnly');
    expect(PANEL).toContain('row.calculationSteps.map');
    expect(PANEL).not.toMatch(/addPatterns|reduceCount|evaluate\(/);
  });
});

describe('H. Chapter 34\'s second chart is shown, and it is exactly the chart the engine read', () => {
  it('recastChartFor rebuilds the same second chart: its H13 is the engine\'s result figure on every chart', () => {
    for (let i = 0; i < 60; i++) {
      const chart = castRandomChart();
      const row = runReading(chart, CH34)!.methodResults.find((m) => m.id === 'enemies-working-method-1')!;
      const recast = recastChartFor(chart, row);
      expect(recast).not.toBeNull();
      expect(recast!.houses.slice(0, 4).map((h) => h.pattern)).toEqual([3, 7, 11, 15].map((n) => chart.houses[n - 1].pattern));
      expect(recast!.houses[12].pattern).toEqual(row.resultPattern);
      expect(row.calculationSteps.join(' ')).toContain(`New chart's H13 = ${recast!.houses[12].star.name}`);
    }
  });

  it('is null for a method that does not recast', () => {
    const chart = castRandomChart();
    const row = runReading(chart, CH1)!.methodResults[0];
    expect(recastChartFor(chart, row)).toBeNull();
  });

  it('the second chart is drawn without the original chart\'s house-role titles', () => {
    expect(PANEL).toMatch(/<HouseSelector chart=\{recast\} required=\{thenHouses\}[^>]*hideTitles/);
  });
});

describe('I. long house titles wrap inside their tile', () => {
  it('every title/name in the grid carries the wrap classes (e.g. H8 "Transformation" at 360px)', () => {
    const html = renderToStaticMarkup(
      createElement(HouseSelector, { chart: buildChart(MOTHERS), required: [8], selected: new Set<number>(), onToggle: () => {} }),
    );
    // Practice polish: the title carries dictionary soft hyphens (invisible
    // unless the line breaks there) and manual hyphenation.
    const transformation = html.match(/<span class="([^"]*)">Trans\u00ADfor\u00ADma\u00ADtion<\/span>/);
    expect(transformation).not.toBeNull();
    expect(transformation![1]).toContain('hyphens-manual');
    expect(transformation![1]).toContain('min-w-0');
  });

  it('read-only mode renders no buttons', () => {
    const html = renderToStaticMarkup(
      createElement(HouseSelector, { chart: buildChart(MOTHERS), required: [1, 8], selected: new Set<number>(), onToggle: () => {}, readOnly: true }),
    );
    expect(html).not.toContain('<button');
  });
});

describe('K. Chapter 151 #1 and #4 both print Yussif in the source — preserved, not "corrected"', () => {
  it('keeps both entries as the source prints them', () => {
    const byNumber = new Map(DREAM_INTERPRETATION_FIGURES.map((f) => [f.number, f.starId]));
    expect(byNumber.get(1)).toBe('yussif');
    expect(byNumber.get(4)).toBe('yussif');
  });
});
