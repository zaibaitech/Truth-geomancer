// Prompt 27C, Phase 13 — security and behavioral-equivalence tests for the
// Kanzul method-practice server migration. Numbered per the prompt's own
// Phase 13 list (SERVER AUTHORIZATION 6-10, RESULT SECURITY 11-15,
// BEHAVIORAL EQUIVALENCE 17).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from '../db';
import { getOrCreateUser } from '../identity';
import { grantEntitlement, revokeEntitlement } from '../entitlements';
import { runReading } from '@/lib/raml/engine';
import { fixtureChart } from '@/lib/raml/engine/__tests__/fixtures';
import { getPracticeMethodForUser } from './practiceService';
import { KANZUL_PRODUCT } from '@/lib/access/products';

const CHAPTER = 'if-you-want-to-know-if-you-will';
const METHOD = 'money-method-1';
const chart = fixtureChart();

let db: Db;
afterEach(() => {
  try {
    db?.close();
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
  it('an anonymous user with no entitlement gets reason: unauthorized, never a quote or row', () => {
    db = openDatabase(':memory:');
    const userId = getOrCreateUser(db, null).user.id;
    const result = getPracticeMethodForUser(db, userId, CHAPTER, METHOD, chart);
    expect(result).toEqual({ ok: false, reason: 'unauthorized' });
  });
});

describe('7: authorized Kanzul request succeeds', () => {
  it('a user with an active Kanzul entitlement gets the quote, label, and computed row', () => {
    db = openDatabase(':memory:');
    const userId = getOrCreateUser(db, null).user.id;
    grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    const result = getPracticeMethodForUser(db, userId, CHAPTER, METHOD, chart);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.label).toBeTruthy();
    expect(result.sourceQuote.length).toBeGreaterThan(0);
    expect(result.row).not.toBeNull();
  });

  it('omitting the chart (intro screen) still succeeds, with row null', () => {
    db = openDatabase(':memory:');
    const userId = getOrCreateUser(db, null).user.id;
    grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    const result = getPracticeMethodForUser(db, userId, CHAPTER, METHOD, null);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row).toBeNull();
    expect(result.sourceQuote.length).toBeGreaterThan(0);
  });
});

describe('8: revoked entitlement is denied', () => {
  it('a since-revoked Kanzul entitlement no longer grants access', () => {
    db = openDatabase(':memory:');
    const userId = getOrCreateUser(db, null).user.id;
    const { entitlement } = grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    revokeEntitlement(db, entitlement.id);
    const result = getPracticeMethodForUser(db, userId, CHAPTER, METHOD, chart);
    expect(result).toEqual({ ok: false, reason: 'unauthorized' });
  });
});

describe('9: cross-user entitlement cannot authorize another user', () => {
  it("user B's request is denied even though user A holds a valid Kanzul entitlement", () => {
    db = openDatabase(':memory:');
    const userA = getOrCreateUser(db, null).user.id;
    const userB = getOrCreateUser(db, 'a-different-real-session-token').user.id;
    grantEntitlement(db, userA, KANZUL_PRODUCT.id, 'manual-payment');
    const result = getPracticeMethodForUser(db, userB, CHAPTER, METHOD, chart);
    expect(result).toEqual({ ok: false, reason: 'unauthorized' });
  });
});

describe('10: forged userId cannot authorize access', () => {
  it('a userId string that matches no real user resolves to unauthorized, never a crash or a bypass', () => {
    db = openDatabase(':memory:');
    const result = getPracticeMethodForUser(db, 'not-a-real-user-id', CHAPTER, METHOD, chart);
    expect(result).toEqual({ ok: false, reason: 'unauthorized' });
  });
});

// ---------------------------------------------------------------------------
// RESULT SECURITY
// ---------------------------------------------------------------------------
describe('11: unauthorized response contains no protected source text', () => {
  it('the unauthorized result object has no quote, label, or row field at all', () => {
    db = openDatabase(':memory:');
    const userId = getOrCreateUser(db, null).user.id;
    const result = getPracticeMethodForUser(db, userId, CHAPTER, METHOD, chart);
    expect(JSON.stringify(result)).not.toMatch(/sourceQuote|calculationSteps|After drawing the chart/);
  });
});

describe('12: authorized response contains only the necessary result', () => {
  it('the authorized result has exactly the documented field set', () => {
    db = openDatabase(':memory:');
    const userId = getOrCreateUser(db, null).user.id;
    grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    const result = getPracticeMethodForUser(db, userId, CHAPTER, METHOD, chart);
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
  it('an authorized response only ever describes the ONE requested method, never the full question', () => {
    db = openDatabase(':memory:');
    const userId = getOrCreateUser(db, null).user.id;
    grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    const result = getPracticeMethodForUser(db, userId, CHAPTER, METHOD, chart);
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
  it('row equals the matching methodResults entry from a direct runReading() call', () => {
    db = openDatabase(':memory:');
    const userId = getOrCreateUser(db, null).user.id;
    grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    const result = getPracticeMethodForUser(db, userId, CHAPTER, METHOD, chart);
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
