import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildChart } from './casting';
import type { Pattern } from '@/content/stars';
import {
  DREAMS_QUESTION_ID,
  DREAM_PAIRING_BRIEF,
  MANUSCRIPT_DREAM_QUOTE,
  dreamWorkingFromChart,
  usesDreamPairingPresentation,
} from './dreamPairingPresentation';
import { QUESTION_REGISTRY } from './engine/questions';
import { runEngine, runReading } from './engine';
import { catalogEntry, readingBrief } from './questionCatalog';

const IBRAHIM_AYUBA_MOTHERS: [Pattern, Pattern, Pattern, Pattern] = [
  [1, 1, 1, 1], // Ibrahim
  [2, 2, 2, 2], // Musah
  [1, 1, 2, 1], // Yussif
  [2, 2, 1, 1], // Nuhu → final Ayuba
];

const IBRAHIM_MOTHERS: [Pattern, Pattern, Pattern, Pattern] = [
  [1, 1, 1, 1], // Ibrahim
  [2, 2, 2, 2], // Musah
  [2, 2, 2, 2], // Musah
  [2, 2, 2, 2], // Musah → final Ibrahim
];

describe('usesDreamPairingPresentation', () => {
  it('is true only for Chapter 151 because that is the only annotated pairing method', () => {
    expect(usesDreamPairingPresentation(DREAMS_QUESTION_ID)).toBe(true);
    expect(usesDreamPairingPresentation('if-you-want-to-know-if-you-will')).toBe(false);
    expect(usesDreamPairingPresentation('if-it-will-rain-today-or-not')).toBe(false);
    expect(usesDreamPairingPresentation('general')).toBe(false);
    expect(usesDreamPairingPresentation(undefined)).toBe(false);
  });

  it('does not compare the intention id to a hard-coded Chapter 151 string', () => {
    const src = readFileSync(path.resolve(__dirname, 'dreamPairingPresentation.ts'), 'utf8');
    const fn = src.slice(src.indexOf('export function usesDreamPairingPresentation'));
    expect(fn).toContain('resolveQuestionCasting');
    expect(fn).not.toMatch(/intentionId === DREAMS_QUESTION_ID/);
  });
});

describe('A. Chapter 151 uses four Mothers and does not depend on H5–H16', () => {
  it('reads only H1–H4 from the chart object', () => {
    const chart = buildChart(IBRAHIM_AYUBA_MOTHERS);
    const working = dreamWorkingFromChart(chart)!;
    expect(working.mothers.map((m) => m.pattern)).toEqual(IBRAHIM_AYUBA_MOTHERS);
  });

  it('is unchanged if houses 5–16 are overwritten', () => {
    const chart = buildChart(IBRAHIM_AYUBA_MOTHERS);
    const before = dreamWorkingFromChart(chart)!;
    const junk: Pattern = [2, 1, 2, 1];
    for (let i = 4; i < 16; i++) {
      chart.houses[i] = { ...chart.houses[i], pattern: junk, star: chart.houses[i].star };
    }
    const after = dreamWorkingFromChart(chart)!;
    expect(after.mothers.map((m) => m.pattern)).toEqual(before.mothers.map((m) => m.pattern));
    expect(after.pair1.pattern).toEqual(before.pair1.pattern);
    expect(after.pair2.pattern).toEqual(before.pair2.pattern);
    expect(after.final.pattern).toEqual(before.final.pattern);
  });

  it('engine calculation still reports housesUsed [1,2,3,4] only', () => {
    const result = runEngine(buildChart(IBRAHIM_AYUBA_MOTHERS), DREAMS_QUESTION_ID)!;
    expect(result.methods[0].calculation!.housesUsed).toEqual([1, 2, 3, 4]);
  });
});

describe('B. Pairing is M1+M2, M3+M4, then those two', () => {
  it('Ayuba fixture: Pair 1 Ibrahim, Pair 2 Hassan & Hussein, Final Ayuba', () => {
    const working = dreamWorkingFromChart(buildChart(IBRAHIM_AYUBA_MOTHERS))!;
    expect(working.pair1.from).toBe('Mother 1 + Mother 2');
    expect(working.pair2.from).toBe('Mother 3 + Mother 4');
    expect(working.final.from).toBe('Pair 1 + Pair 2');
    expect(working.pair1.star.id).toBe('ibrahim');
    expect(working.pair2.star.id).toBe('hassan-hussein');
    expect(working.final.star.id).toBe('ayuba');
    expect(working.pair1.label).toBe('Pair 1');
    expect(working.pair2.label).toBe('Pair 2');
    expect(working.final.label).toBe('Final Figure');
  });

  it('Ibrahim fixture: Final Figure is Ibrahim', () => {
    const working = dreamWorkingFromChart(buildChart(IBRAHIM_MOTHERS))!;
    expect(working.final.star.id).toBe('ibrahim');
  });
});

describe('C. Interpretation mapping still follows the final figure, not the UI', () => {
  it('Ayuba and Ibrahim fixtures produce different source interpretations', () => {
    const ayuba = runReading(buildChart(IBRAHIM_AYUBA_MOTHERS), DREAMS_QUESTION_ID)!;
    const ibrahim = runReading(buildChart(IBRAHIM_MOTHERS), DREAMS_QUESTION_ID)!;
    expect(ayuba.primaryFigure?.figureId).toBe('ayuba');
    expect(ibrahim.primaryFigure?.figureId).toBe('ibrahim');
    expect(ayuba.methodResults[0].interpretation).not.toBe(ibrahim.methodResults[0].interpretation);
    expect(ayuba.methodResults[0].interpretation).toMatch(/funeral/i);
    expect(ibrahim.methodResults[0].interpretation).toContain('white house-bird');
  });
});

describe('F. Source quote integrity', () => {
  it('registry quote remains the manuscript sentence', () => {
    const quote = QUESTION_REGISTRY[DREAMS_QUESTION_ID].methods[0].source.quote;
    expect(quote).toBe(MANUSCRIPT_DREAM_QUOTE);
    expect(quote).not.toMatch(/Mother 1 \+ Mother 2|Pair 1 \+ Pair 2|Niece|Witness|Judge/);
  });
});

describe('confirmation copy', () => {
  it('uses the mothers-only application brief, not sixteen-house language', () => {
    const entry = catalogEntry(DREAMS_QUESTION_ID)!;
    expect(readingBrief(entry)).toBe(DREAM_PAIRING_BRIEF);
    expect(readingBrief(entry)).not.toMatch(/sixteen|full shield|Judge/i);
    expect(DREAM_PAIRING_BRIEF).not.toBe(MANUSCRIPT_DREAM_QUOTE);
  });

  it('leaves an ordinary full-shield question on the generic brief', () => {
    const rain = catalogEntry('if-it-will-rain-today-or-not')!;
    expect(readingBrief(rain)).toContain('Your chart is read against');
    expect(readingBrief(rain)).not.toBe(DREAM_PAIRING_BRIEF);
  });
});
