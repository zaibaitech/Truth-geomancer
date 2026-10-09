// Free-cast Phase A: the answer and reasoning shown for a reading come from the
// actual authorised ReadingResult and the user's own chart — nothing invented.
// Uses the REAL engine (via the same getReadingResult the API route calls) over
// every registered question, so the properties below hold for all of them.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { buildChart, type Chart } from '@/lib/raml/casting';
import type { Pattern } from '@/content/stars';
import { getReadingResult } from '@/lib/server/raml/readingService';
import { runReading } from '@/lib/raml/engine';
import { QUESTION_REGISTRY } from '@/lib/raml/engine/questions';
import { ownHouseInLifeQuestion } from '@/lib/raml/engine/questions/ownHouseInLife';
import type { ReadingResult } from '@/lib/raml/engine/reading';
import { houseInfo } from '@/lib/raml/houses';
import { isSourceSilentReading } from '@/lib/raml/resultPresentation';
import { EngineReadingView } from '@/components/raml/EngineReadingView';
import { STANDING_NOTE, buildAnswerView, buildReasoningSteps, attributionLine } from './readingExplanation';

const P: Pattern[] = [
  [1, 1, 1, 1], [2, 2, 2, 2], [1, 2, 1, 2], [2, 1, 2, 1], [1, 1, 2, 2], [2, 2, 1, 1], [1, 2, 2, 1], [2, 1, 1, 2],
  [1, 1, 1, 2], [2, 2, 2, 1], [1, 2, 1, 1], [2, 1, 2, 2], [1, 1, 2, 1], [1, 2, 2, 2], [2, 1, 1, 1], [2, 2, 1, 2],
];
const MOTHERS: Pattern[][] = Array.from({ length: 16 }, (_, i) => [P[i], P[(i + 3) % 16], P[(i + 7) % 16], P[(i + 11) % 16]]);
const CHARTS: Chart[] = MOTHERS.map((m) => buildChart(m as [Pattern, Pattern, Pattern, Pattern]));
const SAMPLE = ownHouseInLifeQuestion.id;

interface Run {
  qid: string;
  chart: Chart;
  result: ReadingResult;
}
const RUNS: Run[] = [];
for (const qid of Object.keys(QUESTION_REGISTRY)) {
  for (const chart of CHARTS) {
    const result = getReadingResult(chart, qid);
    if (result) RUNS.push({ qid, chart, result });
  }
}
const html = (r: ReadingResult, chart?: Chart) => renderToStaticMarkup(createElement(EngineReadingView, { result: r, chart }));
const decode = (s: string) => s.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');

// A deterministic spread of 400 more charts for the free sample, so every one of its
// three source outcomes (good / middle-good / bad) is exercised.
let seed = 20261009;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const SAMPLE_RUNS: Run[] = [];
for (let i = 0; i < 400; i++) {
  const m = [0, 1, 2, 3].map(() => P[Math.floor(rnd() * 16)]) as [Pattern, Pattern, Pattern, Pattern];
  const chart = buildChart(m);
  const result = getReadingResult(chart, SAMPLE);
  if (result) SAMPLE_RUNS.push({ qid: SAMPLE, chart, result });
}

function sampleFor(outcome: string): Run {
  const run = SAMPLE_RUNS.find((r) => r.result.methodResults[0].outcome === outcome);
  if (!run) throw new Error(`no ${outcome} chart for the free sample`);
  return run;
}

describe('1. the displayed conclusion is the authorised method\'s own interpretation', () => {
  it.each(['favourable', 'mixed', 'unfavourable'])('Chapter 146 (%s): sentence equals the engine\'s own verdict, attributed to book, chapter and method', (outcome) => {
    const { chart, result } = sampleFor(outcome);
    const view = buildAnswerView(result);
    expect(view.kind).toBe('single');
    const raw = runReading(chart, SAMPLE)!; // the unchanged engine, called directly
    expect(view.groups).toHaveLength(1);
    expect(view.groups[0].sentence).toBe(raw.methodResults[0].interpretation);
    expect(view.groups[0].methods).toEqual([{ label: 'Method 1', sourceLabel: 'Kanzul Mikban, Chapter 146' }]);
    expect(attributionLine(view.groups[0].methods)).toBe('According to Kanzul Mikban, Chapter 146, Method 1:');
    const out = decode(html(result, chart));
    expect(out).toContain('According to Kanzul Mikban, Chapter 146, Method 1:');
    expect(out).toContain(raw.methodResults[0].interpretation);
  });

  it('for EVERY question and chart, each displayed sentence is exactly a counted method row\'s own interpretation, and every counted method appears once', () => {
    let checked = 0;
    for (const { result } of RUNS) {
      const view = buildAnswerView(result);
      if (view.kind === 'legacy') continue;
      const counted = result.methodResults.filter((m) => m.counted);
      const shown = view.groups.flatMap((g) => g.methods.map((m) => ({ ...m, sentence: g.sentence })));
      expect(shown).toHaveLength(counted.length);
      for (const m of counted) {
        const hit = shown.filter((s) => s.label === m.label && s.sourceLabel === m.sourceLabel);
        expect(hit).toHaveLength(1);
        expect(hit[0].sentence).toBe(m.interpretation!.trim());
      }
      checked++;
    }
    expect(checked).toBeGreaterThan(500);
  });

  it('never mutates the ReadingResult it is given', () => {
    const { result } = sampleFor('mixed');
    const frozen = JSON.parse(JSON.stringify(result)) as ReadingResult;
    const deepFreeze = (o: unknown): void => {
      if (o && typeof o === 'object') {
        Object.freeze(o);
        Object.values(o).forEach(deepFreeze);
      }
    };
    deepFreeze(frozen);
    expect(() => {
      buildAnswerView(frozen);
      buildReasoningSteps(frozen, CHARTS[0]);
    }).not.toThrow();
  });
});

describe('2. a conditional source conclusion stays conditional', () => {
  it('middle-good keeps "with prayers and sacrifices" and is never shown as the unconditional favourable sentence', () => {
    const { chart, result } = sampleFor('mixed');
    const out = decode(html(result, chart));
    expect(out).toContain('You will own a house with prayers and sacrifices.');
    expect(out).not.toContain('You will own a house in your life.');
    expect(out).toContain('Conditional / Mixed');
  });
});

describe('3. several agreeing methods are described accurately', () => {
  const run = RUNS.find((r) => buildAnswerView(r.result).kind === 'agree')!;
  it('states the real number of counted methods and that they reach the same indication', () => {
    const view = buildAnswerView(run.result);
    const counted = run.result.methodResults.filter((m) => m.counted);
    expect(counted.length).toBeGreaterThan(1);
    expect(view.statusLine).toBe(`${counted.length} verified methods reach the same indication.`);
    expect(new Set(counted.map((m) => m.outcome)).size).toBe(1);
  });
  it('a single method is described as one method, with no "agree" claim', () => {
    const view = buildAnswerView(sampleFor('favourable').result);
    expect(view.statusLine).toBe('Given by 1 verified method.');
    expect(view.statusLine.toLowerCase()).not.toContain('agree');
  });
});

describe('4. conflicting methods are shown without an invented winner', () => {
  it.each(['Methods conflict', 'Mixed indications', 'Methods mostly agree'])('%s: every counted method\'s sentence is shown, equally prominent, with no preferred one', (label) => {
    const run = RUNS.find((r) => r.result.consensusLabel === label && buildAnswerView(r.result).kind === 'differ');
    expect(run, label).toBeDefined();
    const { result, chart } = run!;
    const view = buildAnswerView(result);
    const counted = result.methodResults.filter((m) => m.counted);
    expect(view.statusLine).toBe(`${counted.length} verified methods give different indications.`);
    const out = decode(html(result, chart));
    const primaryClass = out.match(/type-method font-semibold text-sand-light break-words">/g) ?? [];
    expect(primaryClass).toHaveLength(view.groups.length);
    for (const m of counted) expect(out).toContain(m.interpretation!.trim().replace(/&/g, '&'));
    expect(view.groups.length).toBeGreaterThan(1);
    if (label === 'Methods conflict') expect(view.detailLines).toContain(result.disagreementNote);
    expect(view.detailLines).toContain(result.consensusSentence);
    // no overall winner phrase, and no single "Favourable"/"Unfavourable" headline
    expect(out).not.toMatch(/Overall|preferred|most reliable/i);
  });
});

describe('5. descriptive, insufficient-evidence and source-silent readings keep their existing presentation', () => {
  const kinds: [string, (r: ReadingResult) => boolean][] = [
    ['descriptive', (r) => r.resultKind === 'descriptive'],
    ['insufficient', (r) => r.isInsufficient && !isSourceSilentReading(r)],
    ['source-silent', (r) => isSourceSilentReading(r)],
  ];
  it.each(kinds)('%s: legacy view, no new answer or steps card', (_n, pick) => {
    const run = RUNS.find((r) => pick(r.result));
    expect(run).toBeDefined();
    expect(buildAnswerView(run!.result).kind).toBe('legacy');
    expect(buildReasoningSteps(run!.result, run!.chart)).toEqual([]);
    const out = html(run!.result, run!.chart);
    expect(out).not.toContain('The answer');
    expect(out).not.toContain('How the method reached this');
    expect(out).not.toContain(STANDING_NOTE);
  });
  it('a descriptive reading renders byte-identically with or without the chart prop (nothing new reaches it)', () => {
    const run = RUNS.find((r) => r.result.resultKind === 'descriptive' && !r.result.isInsufficient)!;
    expect(html(run.result, run.chart)).toBe(html(run.result));
  });
});

describe('6. standing note and no guarantee language', () => {
  const FORBIDDEN = /\b(guarantee[sd]?|definitely|certainly|promise[sd]?|100\s?%|inevitabl[ey])\b/i;
  it('every new answer carries the standing note, and no wording of ours promises an outcome', () => {
    for (const { result, chart } of RUNS.filter((r) => buildAnswerView(r.result).kind !== 'legacy').slice(0, 400)) {
      const out = decode(html(result, chart));
      expect(out).toContain(STANDING_NOTE);
      // strip the book's own sentences (verbatim, not ours) before scanning our wording
      let ours = out;
      for (const m of result.methodResults) if (m.interpretation) ours = ours.split(m.interpretation.trim()).join('');
      ours = ours.replace(STANDING_NOTE, '');
      const answerOnly = ours.slice(ours.indexOf('The answer'), ours.indexOf('The answer') + 1500);
      expect(answerOnly).not.toMatch(FORBIDDEN);
    }
  });
});

describe('7. reasoning steps come from the ReadingResult and the user\'s own chart', () => {
  it('Chapter 146: houses use the app\'s house names, each house\'s figure and dot pattern come from the chart, the working line is the engine\'s own', () => {
    const { chart, result } = sampleFor('mixed');
    const [step] = buildReasoningSteps(result, chart);
    const row = result.methodResults[0];
    expect(step.houses.map((h) => h.number)).toEqual([1, 4, 11, 15]);
    for (const h of step.houses) {
      expect(h.title).toBe(houseInfo(h.number).title);
      expect(h.figureName).toBe(chart.houses[h.number - 1].star.name);
      expect(h.pattern).toEqual(chart.houses[h.number - 1].pattern);
    }
    expect(step.working).toEqual(row.calculationSteps);
    expect(step.result).toEqual({ name: row.resultFigureName, pattern: row.resultPattern, element: row.resultElement });
    const out = decode(html(result, chart));
    for (const h of step.houses) {
      expect(out).toContain(`House ${h.number} · ${h.title}`);
      expect(out).toContain(`aria-label="Figure pattern ${h.pattern.join('-')}"`);
    }
    expect(out).toContain(row.calculationSteps[0]);
  });

  it('for EVERY question and chart, each step house matches the chart and each working line is verbatim', () => {
    let steps = 0;
    for (const { result, chart } of RUNS) {
      for (const s of buildReasoningSteps(result, chart)) {
        const row = result.methodResults.find((m) => m.id === s.methodId)!;
        expect(s.houses.map((h) => h.number)).toEqual(row.housesUsed);
        for (const h of s.houses) expect(h.figureName).toBe(chart.houses[h.number - 1].star.name);
        expect(s.working).toEqual(row.calculationSteps);
        steps++;
      }
    }
    expect(steps).toBeGreaterThan(500);
  });

  it('without a chart no steps are shown (the answer alone still renders)', () => {
    const { result } = sampleFor('mixed');
    expect(buildReasoningSteps(result, undefined)).toEqual([]);
    expect(html(result)).toContain('The answer');
  });
});

describe('8. nothing protected or new is reachable from the new code, and no new links are added', () => {
  const read = (f: string) => readFileSync(path.resolve(__dirname, '..', '..', f), 'utf8');
  const FILES = ['lib/raml/readingExplanation.ts', 'components/raml/reading/AnswerCard.tsx', 'components/raml/reading/ReasoningSteps.tsx'];
  it.each(FILES)('%s imports nothing from the server, the engine\'s questions, manuscripts or star data', (file) => {
    // runtime imports only: `import type` is erased at build time and ships no code
    const imports = Array.from(read(file).matchAll(/^import (?!type )[^;]*?from '([^']+)'/gm)).map((m) => m[1]);
    for (const spec of imports) {
      expect(spec, `${file} -> ${spec}`).not.toMatch(/lib\/server|engine\/questions|content\/manuscripts|content\/stars$|kanzulMikban|masterOfGeomancy/);
    }
  });
  it('rendered answer and steps contain no links (Phase A adds none; learning links are Phase B)', () => {
    const { result, chart } = sampleFor('mixed');
    const out = html(result, chart);
    const start = out.indexOf('The answer');
    const end = out.indexOf('How this was determined');
    expect(out.slice(start, end)).not.toContain('href=');
  });
});
