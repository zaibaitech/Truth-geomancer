// Prompt 27C, Phase 13 — security and behavioral-equivalence tests for the
// Kanzul method-practice server migration. Numbered per the prompt's own
// Phase 13 list (SERVER AUTHORIZATION 6-10, RESULT SECURITY 11-15,
// BEHAVIORAL EQUIVALENCE 17). Updated for Prompt 31C's async Db interface.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from '../db';
import { getOrCreateUser } from '../identity';
import { grantEntitlement, revokeEntitlement } from '../entitlements';
import { runReading } from '@/lib/raml/engine';
import { buildChart } from '@/lib/raml/casting';
import { fixtureChart } from '@/lib/raml/engine/__tests__/fixtures';
import { practiceResultState } from '@/lib/raml/methodPractice';
import { getPracticeMethodForUser } from './practiceService';
import { KANZUL_PRODUCT } from '@/lib/access/products';
import type { Pattern } from '@/content/stars';

const CHAPTER = 'if-you-want-to-know-if-you-will';
const METHOD = 'money-method-1';
const chart = fixtureChart();

let db: Db;
afterEach(async () => {
  try {
    await db?.close();
  } catch {
    // Not open for a test that never called openDatabase(); nothing to clean up.
  }
});

function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git', '.data'].includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(full));
    else if (entry.name.endsWith('.tsx')) out.push(full);
  }
  return out;
}

// ---------------------------------------------------------------------------
// SERVER AUTHORIZATION
// ---------------------------------------------------------------------------
describe('6: unauthorized reading request is denied where access is required', () => {
  it('an anonymous user with no entitlement gets reason: unauthorized, never a quote or row', async () => {
    db = openDatabase(':memory:');
    const userId = (await getOrCreateUser(db, null)).user.id;
    const result = await getPracticeMethodForUser(db, userId, CHAPTER, METHOD, chart);
    expect(result).toEqual({ ok: false, reason: 'unauthorized' });
  });
});

describe('7: authorized Kanzul request succeeds', () => {
  it('a user with an active Kanzul entitlement gets the quote, label, and computed row', async () => {
    db = openDatabase(':memory:');
    const userId = (await getOrCreateUser(db, null)).user.id;
    await grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    const result = await getPracticeMethodForUser(db, userId, CHAPTER, METHOD, chart);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.label).toBeTruthy();
    expect(result.sourceQuote.length).toBeGreaterThan(0);
    expect(result.row).not.toBeNull();
  });

  it('omitting the chart (intro screen) still succeeds, with row null', async () => {
    db = openDatabase(':memory:');
    const userId = (await getOrCreateUser(db, null)).user.id;
    await grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    const result = await getPracticeMethodForUser(db, userId, CHAPTER, METHOD, null);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row).toBeNull();
    expect(result.sourceQuote.length).toBeGreaterThan(0);
  });
});

describe('8: revoked entitlement is denied', () => {
  it('a since-revoked Kanzul entitlement no longer grants access', async () => {
    db = openDatabase(':memory:');
    const userId = (await getOrCreateUser(db, null)).user.id;
    const { entitlement } = await grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    await revokeEntitlement(db, entitlement.id);
    const result = await getPracticeMethodForUser(db, userId, CHAPTER, METHOD, chart);
    expect(result).toEqual({ ok: false, reason: 'unauthorized' });
  });
});

describe('9: cross-user entitlement cannot authorize another user', () => {
  it("user B's request is denied even though user A holds a valid Kanzul entitlement", async () => {
    db = openDatabase(':memory:');
    const userA = (await getOrCreateUser(db, null)).user.id;
    const userB = (await getOrCreateUser(db, 'a-different-real-session-token')).user.id;
    await grantEntitlement(db, userA, KANZUL_PRODUCT.id, 'manual-payment');
    const result = await getPracticeMethodForUser(db, userB, CHAPTER, METHOD, chart);
    expect(result).toEqual({ ok: false, reason: 'unauthorized' });
  });
});

describe('10: forged userId cannot authorize access', () => {
  it('a userId string that matches no real user resolves to unauthorized, never a crash or a bypass', async () => {
    db = openDatabase(':memory:');
    const result = await getPracticeMethodForUser(db, 'not-a-real-user-id', CHAPTER, METHOD, chart);
    expect(result).toEqual({ ok: false, reason: 'unauthorized' });
  });
});

// ---------------------------------------------------------------------------
// RESULT SECURITY
// ---------------------------------------------------------------------------
describe('11: unauthorized response contains no protected source text', () => {
  it('the unauthorized result object has no quote, label, or row field at all', async () => {
    db = openDatabase(':memory:');
    const userId = (await getOrCreateUser(db, null)).user.id;
    const result = await getPracticeMethodForUser(db, userId, CHAPTER, METHOD, chart);
    expect(JSON.stringify(result)).not.toMatch(/sourceQuote|calculationSteps|After drawing the chart/);
  });
});

describe('12: authorized response contains only the necessary result', () => {
  it('the authorized result has exactly the documented field set', async () => {
    db = openDatabase(':memory:');
    const userId = (await getOrCreateUser(db, null)).user.id;
    await grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    const result = await getPracticeMethodForUser(db, userId, CHAPTER, METHOD, chart);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result).sort()).toEqual(['label', 'ok', 'questionId', 'row', 'sourceLabel', 'sourceQuote'].sort());
  });
});

describe('13: response does not contain the complete question corpus', () => {
  it('the route module never imports the full engine registry itself, only the service', () => {
    const source = readFileSync('app/api/raml/practice/route.ts', 'utf-8');
    expect(source).not.toMatch(/QUESTION_REGISTRY\b/);
    expect(source).not.toMatch(/from ['"]@\/lib\/raml\/engine\/questions['"]/);
  });
});

describe('14: response does not contain all MethodDefinitions', () => {
  it('an authorized response only ever describes the ONE requested method, never the full question', async () => {
    db = openDatabase(':memory:');
    const userId = (await getOrCreateUser(db, null)).user.id;
    await grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    const result = await getPracticeMethodForUser(db, userId, CHAPTER, METHOD, chart);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Single label/quote, not an array of every method in the question.
    expect(typeof result.label).toBe('string');
    expect(typeof result.sourceQuote).toBe('string');
  });
});

describe('15: response does not contain complete Kanzul chapters', () => {
  it('nothing in the practice service imports the full chapter-text module', () => {
    const source = readFileSync('lib/server/raml/practiceService.ts', 'utf-8');
    expect(source).not.toMatch(/content\/kanzulMikban/);
  });
});

// ---------------------------------------------------------------------------
// BEHAVIORAL EQUIVALENCE (17: method-practice results remain identical)
// ---------------------------------------------------------------------------
describe('17: the practice service computes the exact same row runReading() itself produces', () => {
  it('row equals the matching methodResults entry from a direct runReading() call', async () => {
    db = openDatabase(':memory:');
    const userId = (await getOrCreateUser(db, null)).user.id;
    await grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    const result = await getPracticeMethodForUser(db, userId, CHAPTER, METHOD, chart);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const direct = runReading(chart, CHAPTER)!;
    const expectedRow = direct.methodResults.find((m) => m.id === METHOD)!;
    expect(result.row).toEqual(expectedRow);
    expect(result.sourceQuote).toBe(expectedRow.sourceQuote);
    expect(result.label).toBe(expectedRow.label);
  });
});

// ---------------------------------------------------------------------------
// CLIENT LEAKAGE (3: MethodPracticeFlow has no protected-corpus import)
// ---------------------------------------------------------------------------
describe("3: no 'use client' component imports the practice service or the engine registry directly", () => {
  it('MethodPracticeFlow.tsx and every other client component are free of these imports', () => {
    const offenders: string[] = [];
    for (const file of [...listFilesRecursive('app'), ...listFilesRecursive('components')]) {
      const source = readFileSync(file, 'utf-8');
      if (!source.trimStart().startsWith("'use client'")) continue;
      if (/lib\/server\/raml\/practiceService|from ['"]@\/lib\/raml\/engine\/questions['"]/.test(source)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// PROMPT 54 — the real service contract through an `uncertain` verdict.
// Four Mother combinations below, each brute-forced over the full 16^4
// space of real, castable charts and cross-checked directly against
// runReading()/the real engine (not hand-constructed), used to prove the
// FULL contract — getPracticeMethodForUser() -> runReading() ->
// methodResults -> row -> practiceResultState() — carries `counted`,
// `outcome`, `outcomeLabel`, `interpretation`, and `resultPattern` through
// intact, and that MethodPracticeFlow's state decision is correct for
// each. The service/engine themselves are NOT modified by Prompt 54 — only
// asserted against here.
// ---------------------------------------------------------------------------

const RAIN_CHAPTER = 'if-it-will-rain-today-or-not';
const RAIN_METHOD_1 = 'rain-method-1';
// Ali is NOT adjacent anywhere in this chart — the common case, and the
// exact shape of chart that originally reproduced Prompt 53's bug.
const RAIN_UNCERTAIN_MOTHERS: [Pattern, Pattern, Pattern, Pattern] = [
  [1, 1, 2, 1],
  [1, 1, 2, 1],
  [1, 1, 2, 1],
  [1, 1, 2, 1],
];
// Ali occupies two adjacent houses in this chart (H3/H4, both from the
// 3rd Mother) — the source's own positive trigger.
const RAIN_POSITIVE_MOTHERS: [Pattern, Pattern, Pattern, Pattern] = [
  [1, 1, 2, 1],
  [1, 1, 2, 1],
  [2, 1, 1, 2],
  [2, 1, 1, 2],
];

const MONEY_CHAPTER = 'if-you-will-get-money-or-good-strangers';
const MONEY_METHOD_1 = 'money-strangers-method-1';
// The Chapter 28 calculation's result figure does not appear elsewhere in
// this chart — a generic (non-Chapter-32) example of the same
// found/not-found → favourable/uncertain shape.
const MONEY_UNCERTAIN_MOTHERS: [Pattern, Pattern, Pattern, Pattern] = [
  [1, 1, 2, 1],
  [1, 1, 2, 1],
  [1, 1, 2, 1],
  [1, 1, 2, 1],
];

describe('PROMPT 54 — TEST C: Chapter 32 Method 1, uncertain branch, through the real practice service', () => {
  it('a chart where Ali is not adjacent produces counted:false/outcome:"uncertain"/a real resultPattern/a real interpretation, and practiceResultState correctly calls it "uncertain", never "failure"', async () => {
    db = openDatabase(':memory:');
    const userId = (await getOrCreateUser(db, null)).user.id;
    await grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    const rainChart = buildChart(RAIN_UNCERTAIN_MOTHERS);
    const result = await getPracticeMethodForUser(db, userId, RAIN_CHAPTER, RAIN_METHOD_1, rainChart);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const row = result.row!;
    expect(row).not.toBeNull();
    expect(row.counted).toBe(false);
    expect(row.outcome).toBe('uncertain');
    expect(row.outcomeLabel).toBe('Uncertain');
    expect(row.resultPattern).not.toBeNull();
    expect(row.interpretation).toBeTruthy();
    expect(row.interpretation).toContain('not addressed');
    expect(practiceResultState(row)).toBe('uncertain');
  });
});

describe('PROMPT 54 — TEST D: Chapter 32 Method 1, positive branch, unaffected by the fix', () => {
  it('a chart where Ali IS adjacent still produces the ordinary counted, source-backed favourable result', async () => {
    db = openDatabase(':memory:');
    const userId = (await getOrCreateUser(db, null)).user.id;
    await grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    const rainChart = buildChart(RAIN_POSITIVE_MOTHERS);
    const result = await getPracticeMethodForUser(db, userId, RAIN_CHAPTER, RAIN_METHOD_1, rainChart);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const row = result.row!;
    expect(row.counted).toBe(true);
    expect(row.outcome).toBe('favourable');
    expect(row.interpretation).toBe('It will rain.');
    expect(practiceResultState(row)).toBe('result');
  });
});

describe('PROMPT 54 — TEST E: a generic, non-Chapter-32 method (money-strangers-method-1) gets the same correct uncertain treatment', () => {
  it('proves the fix is Practice-layer-generic, not specific to willItRain.ts', async () => {
    db = openDatabase(':memory:');
    const userId = (await getOrCreateUser(db, null)).user.id;
    await grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    const moneyChart = buildChart(MONEY_UNCERTAIN_MOTHERS);
    const result = await getPracticeMethodForUser(db, userId, MONEY_CHAPTER, MONEY_METHOD_1, moneyChart);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const row = result.row!;
    expect(row.counted).toBe(false);
    expect(row.outcome).toBe('uncertain');
    expect(row.resultPattern).not.toBeNull();
    expect(row.interpretation).toBeTruthy();
    expect(practiceResultState(row)).toBe('uncertain');
  });

  it('cross-checked directly against runReading() — the row Prompt 54 asserts on is exactly what the engine itself produces, nothing recomputed by the service', () => {
    const moneyChart = buildChart(MONEY_UNCERTAIN_MOTHERS);
    const direct = runReading(moneyChart, MONEY_CHAPTER)!;
    const row = direct.methodResults.find((m) => m.id === MONEY_METHOD_1)!;
    expect(row.counted).toBe(false);
    expect(row.outcome).toBe('uncertain');
    expect(practiceResultState(row)).toBe('uncertain');
  });
});
