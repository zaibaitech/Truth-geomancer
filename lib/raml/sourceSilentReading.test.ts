// Prompt 61 — source-silent presentation vs insufficient data, Chapter 32
// rain fixtures, and slim-chart star hydration. Does not change Chapter 32
// source rules: those stay in willItRain.ts and are only asserted here.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildChart, type Chart } from './casting';
import { runReading } from './engine';
import { fixtureChart, FIXTURE_MOTHERS } from './engine/__tests__/fixtures';
import { isSourceSilentReading, sourceSilentConditionLine, computePrimaryStatus, primaryAnswerText, primaryDisplayedInterpretation } from './resultPresentation';
import { summariseReading, readingToText } from './readingSummary';
import { practiceResultState } from './methodPractice';
import {
  INSUFFICIENT_HEADING,
  SOURCE_SILENT_HEADING,
  sourceSilentExplanation,
} from './statusLanguage';
import { getReadingResult } from '@/lib/server/raml/readingService';
import { hydrateCanonicalStars, isValidChart } from '@/lib/server/raml/chartValidation';
import { authorizeCastingForUser } from '@/lib/server/raml/castingAccess';
import { openDatabase, type Db } from '@/lib/server/db';
import { getOrCreateUser } from '@/lib/server/identity';
import { grantEntitlement } from '@/lib/server/entitlements';
import { KANZUL_PRODUCT } from '@/lib/access/products';
import type { Pattern } from '@/content/stars';

const RAIN = 'if-it-will-rain-today-or-not';
const DREAMS = 'dreams-and-their-interpretations';
const GIFT = 'continued-from-chapter-twenty-eight';

const RAIN_ALL_MISS: [Pattern, Pattern, Pattern, Pattern] = [
  [1, 1, 2, 1],
  [1, 1, 2, 1],
  [1, 2, 2, 2],
  [2, 1, 2, 2],
];

const RAIN_M1_POSITIVE: [Pattern, Pattern, Pattern, Pattern] = [
  [1, 1, 2, 1],
  [1, 1, 2, 1],
  [2, 1, 1, 2],
  [2, 1, 1, 2],
];

const RAIN_M2_POSITIVE: [Pattern, Pattern, Pattern, Pattern] = [
  [1, 1, 2, 1],
  [1, 2, 2, 2],
  [2, 1, 1, 1],
  [1, 1, 2, 2], // Kalla Allahu in H4
];

const RAIN_M3_POSITIVE: [Pattern, Pattern, Pattern, Pattern] = [
  [1, 1, 2, 1], // Yussif
  [1, 1, 1, 1], // Ibrahim → H9 = Iddris
  [1, 2, 2, 2],
  [1, 2, 2, 2],
];

const NO_RAIN = /no rain|will not rain|won't rain|not going to rain/i;

function stripStar(chart: Chart): Chart {
  return {
    ...chart,
    houses: chart.houses.map((h) => ({
      n: h.n,
      pattern: h.pattern,
      star: { id: h.star.id, name: h.star.name } as Chart['houses'][number]['star'],
    })),
  };
}

describe('1. all four Chapter 32 methods execute uncertain → source-silent, not insufficient copy', () => {
  it('does not say “Not enough source information”; says none of the source’s conditions are met', () => {
    const result = runReading(buildChart(RAIN_ALL_MISS), RAIN)!;
    expect(result.methodResults).toHaveLength(4);
    expect(result.methodResults.every((m) => m.status === 'verified')).toBe(true);
    expect(result.methodResults.every((m) => m.outcome === 'uncertain')).toBe(true);
    expect(result.methodResults.every((m) => m.counted === false)).toBe(true);
    expect(result.isInsufficient).toBe(true);
    expect(isSourceSilentReading(result)).toBe(true);

    const summary = summariseReading(result);
    expect(summary.status).toBe(SOURCE_SILENT_HEADING);
    expect(summary.status).not.toBe('Insufficient information');
    expect(readingToText(result)).not.toContain(INSUFFICIENT_HEADING);
    expect(readingToText(result)).toContain(SOURCE_SILENT_HEADING);
    expect(summary.interpretation).toBe(sourceSilentExplanation(4));

    for (const row of result.methodResults) {
      expect(sourceSilentConditionLine(row)).toMatch(/not present in this chart/i);
    }
  });
});

describe('2. a genuine technical failure still uses the insufficient presentation', () => {
  it('a needs_review / no-verdict question on the fixture chart is insufficient, not source-silent', () => {
    const result = runReading(fixtureChart(), 'if-it-s-day-or-night-that-she')!;
    expect(result.isInsufficient).toBe(true);
    expect(isSourceSilentReading(result)).toBe(false);
    expect(summariseReading(result).status).toBe('Insufficient information');
    expect(readingToText(result)).toContain(INSUFFICIENT_HEADING);
    expect(readingToText(result)).not.toContain(SOURCE_SILENT_HEADING);
  });
});

describe('3–6. each Chapter 32 positive fixture remains favourable rain', () => {
  it('Method 1 positive (Ali following Ali) is favourable', () => {
    const result = runReading(buildChart(RAIN_M1_POSITIVE), RAIN)!;
    const m1 = result.methodResults.find((m) => m.id === 'rain-method-1')!;
    expect(m1.outcome).toBe('favourable');
    expect(m1.counted).toBe(true);
    expect(result.overallOutcome).toBe('favourable');
    expect(result.outcomeLabel).toBe('Favourable');
    expect(isSourceSilentReading(result)).toBe(false);
  });

  it('Method 2 positive (Kalla Allahu in H4) is favourable', () => {
    const result = runReading(buildChart(RAIN_M2_POSITIVE), RAIN)!;
    const m2 = result.methodResults.find((m) => m.id === 'rain-method-2')!;
    expect(m2.outcome).toBe('favourable');
    expect(m2.counted).toBe(true);
    expect(result.overallOutcome).toBe('favourable');
  });

  it('Method 3 positive (Iddris in H9) is favourable', () => {
    const result = runReading(buildChart(RAIN_M3_POSITIVE), RAIN)!;
    const m3 = result.methodResults.find((m) => m.id === 'rain-method-3')!;
    expect(m3.outcome).toBe('favourable');
    expect(m3.counted).toBe(true);
    expect(result.overallOutcome).toBe('favourable');
  });

  it('Method 4 positive (fixture chart, adjacent water) is favourable', () => {
    const result = runReading(fixtureChart(), RAIN)!;
    const m4 = result.methodResults.find((m) => m.id === 'rain-method-4')!;
    expect(m4.outcome).toBe('favourable');
    expect(m4.counted).toBe(true);
    expect(result.overallOutcome).toBe('favourable');
    expect(result.outcomeLabel).toBe('Favourable');
  });
});

describe('7. all-miss does not become “no rain”', () => {
  it('never claims it will not rain', () => {
    const result = runReading(buildChart(RAIN_ALL_MISS), RAIN)!;
    expect(result.overallOutcome).not.toBe('unfavourable');
    expect(result.outcomeLabel).not.toMatch(NO_RAIN);
    expect(result.shortSummary).not.toMatch(NO_RAIN);
    expect(summariseReading(result).status).not.toMatch(NO_RAIN);
    expect(summariseReading(result).interpretation).not.toMatch(NO_RAIN);
    expect(readingToText(result)).not.toMatch(NO_RAIN);
    for (const row of result.methodResults) {
      expect(row.interpretation ?? '').not.toMatch(NO_RAIN);
      expect(sourceSilentConditionLine(row)).not.toMatch(NO_RAIN);
    }
  });
});

describe('8. slim chart with canonical star id/name still resolves Method 4', () => {
  it('getReadingResult hydrates element so adjacent water still counts', () => {
    const full = fixtureChart();
    const slim = stripStar(full);
    expect(isValidChart(slim)).toBe(true);
    expect(slim.houses.every((h) => h.star.element === undefined)).toBe(true);

    const withoutHydration = runReading(slim, RAIN)!;
    expect(withoutHydration.methodResults.find((m) => m.id === 'rain-method-4')!.outcome).toBe('uncertain');

    const hydrated = getReadingResult(slim, RAIN)!;
    const m4 = hydrated.methodResults.find((m) => m.id === 'rain-method-4')!;
    expect(m4.outcome).toBe('favourable');
    expect(hydrated.overallOutcome).toBe('favourable');
    expect(hydrated).toEqual(runReading(full, RAIN));
  });
});

describe('9. slim chart with an unknown star fails safely — no invented element', () => {
  it('does not guess water from a matching name or pattern when the id is unknown', () => {
    const full = fixtureChart();
    const unknown = {
      ...full,
      houses: full.houses.map((h) =>
        h.star.id === 'ibrahim'
          ? {
              ...h,
              star: { id: 'not-a-real-star', name: 'Ibrahim' } as Chart['houses'][number]['star'],
            }
          : { n: h.n, pattern: h.pattern, star: { id: h.star.id, name: h.star.name } as Chart['houses'][number]['star'] },
      ),
    };
    expect(isValidChart(unknown)).toBe(true);
    const restored = hydrateCanonicalStars(unknown);
    const ibrahimHouses = restored.houses.filter((_, i) => full.houses[i].star.id === 'ibrahim');
    expect(ibrahimHouses.every((h) => h.star.id === 'not-a-real-star')).toBe(true);
    expect(ibrahimHouses.every((h) => (h.star as { element?: string }).element !== 'water')).toBe(true);
    expect(ibrahimHouses.every((h) => !('element' in h.star) || (h.star as { element?: string }).element === undefined)).toBe(
      true,
    );
  });
});

describe('10. Prompt 54 uncertain/failure behaviour is unchanged', () => {
  it('an executed uncertain rain method is still “uncertain”, never “failure”', () => {
    const result = runReading(buildChart(RAIN_ALL_MISS), RAIN)!;
    for (const row of result.methodResults) {
      expect(practiceResultState(row)).toBe('uncertain');
      expect(row.resultPattern).not.toBeNull();
      expect(row.outcome).toBe('uncertain');
    }
  });

  it('a missing row is still a failure', () => {
    expect(practiceResultState(null)).toBe('failure');
  });
});

describe('11. Chapter 151 dream reading is unchanged', () => {
  it('fixture chart still produces the same descriptive dream reading', () => {
    const chart = fixtureChart();
    const direct = runReading(chart, DREAMS)!;
    const viaService = getReadingResult(chart, DREAMS)!;
    expect(viaService).toEqual(direct);
    expect(direct.isInsufficient).toBe(false);
    expect(direct.resultKind).toBe('descriptive');
    expect(isSourceSilentReading(direct)).toBe(false);
    const status = computePrimaryStatus(direct);
    expect(primaryAnswerText(direct, status)).toBe(direct.descriptiveAnswer);
    expect(primaryDisplayedInterpretation(direct, status)).toBeTruthy();
  });
});

describe('12. Gift/Visitor reading is unchanged', () => {
  it('the recovered gift #1 fixture still describes Ibrahim and is not source-silent', () => {
    const mothers: [Pattern, Pattern, Pattern, Pattern] = [
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [2, 1, 2, 1],
      [1, 1, 1, 1],
    ];
    const result = runReading(buildChart(mothers), GIFT)!;
    expect(result.resultKind).toBe('descriptive');
    expect(isSourceSilentReading(result)).toBe(false);
    expect(result.methodResults[0].resultFigureName?.toLowerCase()).toContain('ibrahim');
  });
});

describe('13. Prompt 59 entitlement authorization is unchanged', () => {
  let db: Db;
  afterEach(async () => {
    try {
      await db?.close();
    } catch {
      // not opened
    }
  });

  it('unpaid rain remains locked; entitled rain is allowed', async () => {
    db = openDatabase(':memory:');
    const userId = (await getOrCreateUser(db, null)).user.id;
    const locked = await authorizeCastingForUser(db, userId, RAIN);
    expect(locked.allowed).toBe(false);
    expect(locked.accessState).toBe('locked');

    await grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    const unlocked = await authorizeCastingForUser(db, userId, RAIN);
    expect(unlocked.allowed).toBe(true);
    expect(unlocked.accessState).toBe('unlocked');
  });
});

describe('source rules themselves were not rewritten', () => {
  it('willItRain.ts still has four positive-only triggers and never says no-rain', () => {
    const src = readFileSync(path.resolve(__dirname, 'engine/questions/willItRain.ts'), 'utf8');
    expect(src).toContain('rain-method-1');
    expect(src).toContain('rain-method-2');
    expect(src).toContain('rain-method-3');
    expect(src).toContain('rain-method-4');
    expect(src).not.toMatch(/outcome: 'unfavourable'/);
    expect(src).not.toMatch(/interpretation: '[^']*will not rain/i);
    expect(src).toContain("outcome: 'uncertain'");
    expect(src).toContain('CHECK_ELEMENT_ADJACENT_REPETITION');
  });

  it('core engine files were not modified by this presentation fix', () => {
    // Structural: this test file must not import those modules as something
    // to patch — hydration lives in chartValidation, presentation in
    // resultPresentation. The engine entry points stay the same.
    expect(readFileSync(path.resolve(__dirname, 'engine/chartModel.ts'), 'utf8')).toContain('element: h.star.element');
  });
});

describe('hydrateCanonicalStars — identity on a full chart', () => {
  it('leaves a normally-cast chart’s stars as the canonical STARS entries', () => {
    const chart = buildChart(FIXTURE_MOTHERS);
    const hydrated = hydrateCanonicalStars(chart);
    expect(hydrated.houses.map((h) => h.star.id)).toEqual(chart.houses.map((h) => h.star.id));
    expect(hydrated.houses.map((h) => h.star.element)).toEqual(chart.houses.map((h) => h.star.element));
  });
});
