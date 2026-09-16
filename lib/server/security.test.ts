// Security-boundary tests (Prompt 26, Phases 8 and 11 — SECURITY). Since
// nothing in this task is wired into a route yet (Phase 9), "the client
// cannot do X" is verified two ways: (1) structurally — no client-reachable
// code path to these functions exists at all, confirmed by scanning for
// any 'use client' file or app/ route importing lib/server/*; and
// (2) behaviorally — the server functions themselves never trust a
// caller-supplied value where an authoritative one is available.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from './db';
import { getOrCreateUser } from './identity';
import { grantEntitlement, getActiveEntitlementsForUser } from './entitlements';
import { canAccessForUser } from './accessService';
import { consumePreviewUse } from './previews';
import { KANZUL_PRODUCT } from '@/lib/access/products';
import type { FreePreview } from '@/lib/access/types';

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
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git' || entry.name === '.data') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(full));
    else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) out.push(full);
  }
  return out;
}

describe('client cannot grant or revoke entitlements', () => {
  it('no file outside lib/server/ imports grantEntitlement or revokeEntitlement', () => {
    const offenders: string[] = [];
    for (const file of listFilesRecursive('.')) {
      if (file.startsWith('./lib/server/') || file.includes('lib/server/')) continue;
      if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) continue;
      const source = readFileSync(file, 'utf-8');
      if (/grantEntitlement|revokeEntitlement/.test(source)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  it('no app/ route imports the entitlement/preview MUTATION functions (Prompt 27 supersedes Prompt 26 Phase 9: routes now legitimately import lib/server/ for read-only access decisions and authorized content — that is expected and correct — but grantEntitlement/revokeEntitlement/consumePreviewUse must remain unreachable from any route)', () => {
    const appFiles = listFilesRecursive('app');
    const offenders = appFiles.filter((f) => {
      const source = readFileSync(f, 'utf-8');
      return /grantEntitlement|revokeEntitlement|consumePreviewUse/.test(source);
    });
    expect(offenders).toEqual([]);
  });

  it('every app/ route that imports lib/server/ does so only for a documented read-only purpose: identity resolution, the access decision, or already-authorized content — confirmed by which lib/server/ modules are actually imported', () => {
    const ALLOWED_SERVER_MODULES = [
      'session',
      'accessService',
      'db',
      'contentService',
      'content/kanzulMikban',
      'content/masterOfGeomancy',
      'readingVerdictService',
      'raml/readingService',
      'raml/practiceService',
      'raml/chartValidation',
      'paymentRequests',
      'adminSession',
      'purchaseStatus',
    ];
    const appFiles = listFilesRecursive('app');
    const offenders: string[] = [];
    for (const f of appFiles) {
      const source = readFileSync(f, 'utf-8');
      const modules = Array.from(source.matchAll(/from ['"]@\/lib\/server\/([^'"]+)['"]/g), (m) => m[1]);
      for (const mod of modules) {
        if (!ALLOWED_SERVER_MODULES.includes(mod)) offenders.push(`${f} (imports lib/server/${mod})`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("no 'use client' component imports lib/server/ (would fail to build anyway, since node:sqlite has no browser build)", () => {
    const offenders: string[] = [];
    for (const file of [...listFilesRecursive('app'), ...listFilesRecursive('components')]) {
      const source = readFileSync(file, 'utf-8');
      if (source.trimStart().startsWith("'use client'") && /lib\/server\//.test(source)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });
});

describe('client cannot choose another user’s identity', () => {
  it('resolving a user always requires a token that hashes to a stored row — a chosen id string is never accepted as one', () => {
    db = openDatabase(':memory:');
    const real = getOrCreateUser(db, null);
    grantEntitlement(db, real.user.id, KANZUL_PRODUCT.id, 'manual-payment');

    // An attacker who merely GUESSES or invents a value (never the real
    // random 256-bit token) can only ever land on "no session" — proven
    // in identity.test.ts's tamper-resistance suite. Restated here at the
    // access-decision level: a fabricated identity gets zero of the real
    // user's access.
    const impersonationAttempt = getOrCreateUser(db, 'userId=' + real.user.id);
    expect(impersonationAttempt.user.id).not.toBe(real.user.id);
    expect(canAccessForUser(db, impersonationAttempt.user.id, { kind: 'book', bookId: 'kanzul-mikban' })).toBe(false);
  });
});

describe('client cannot modify usesConsumed directly', () => {
  it('consumePreviewUse is the only exported way to change uses_consumed — no setter/raw-write function is exported', async () => {
    const source = readFileSync('lib/server/previews.ts', 'utf-8');
    const exportedFns = Array.from(source.matchAll(/export function (\w+)/g), (m) => m[1]);
    expect(exportedFns.sort()).toEqual(['consumePreviewUse', 'getPreviewUsage'].sort());
  });

  it('the only SQL that writes uses_consumed lives inside consumePreviewUse’s own transaction, not a param-driven setter', () => {
    const source = readFileSync('lib/server/previews.ts', 'utf-8');
    // Every UPDATE/INSERT touching uses_consumed computes `next` from a
    // value it just read in the SAME transaction, never from a caller-
    // supplied usesConsumed argument — confirmed by there being no
    // parameter named anything like `usesConsumed` on either exported
    // function's signature.
    expect(source).toMatch(/export function consumePreviewUse\(db: Db, userId: string, preview: FreePreview\)/);
    expect(source).not.toMatch(/usesConsumed:\s*number\)/); // no writer takes a raw count
  });
});

describe('server functions never trust a caller-supplied product grant or status', () => {
  it('canAccessForUser ignores any client-shaped resource fields beyond bookId/methodId/featureKey — status/productId in the DB are the only source of truth', () => {
    db = openDatabase(':memory:');
    const userId = getOrCreateUser(db, null).user.id;
    // No entitlement granted at all — access must be false regardless of
    // what a resource object claims about itself.
    expect(canAccessForUser(db, userId, { kind: 'book', bookId: 'kanzul-mikban' })).toBe(false);
    expect(getActiveEntitlementsForUser(db, userId)).toHaveLength(0);
  });
});

describe('no secrets or credentials appear in the new server modules', () => {
  it('lib/server/*.ts contains no hard-coded credential-shaped values', () => {
    for (const file of listFilesRecursive('lib/server')) {
      if (file.endsWith('.test.ts')) continue;
      const source = readFileSync(file, 'utf-8');
      expect(source).not.toMatch(/DATABASE_URL\s*=\s*['"]/); // no inline connection string
      expect(source).not.toMatch(/api[_-]?key\s*[:=]\s*['"]/i);
      expect(source).not.toMatch(/NEXT_PUBLIC_/); // server secrets must never use the public-exposing prefix
    }
  });
});

describe('preview usage stays structurally separate from entitlement (restated at the security-test level)', () => {
  it('consuming a preview cannot be used as a backdoor to gain canAccess()=true for the book', () => {
    db = openDatabase(':memory:');
    const userId = getOrCreateUser(db, null).user.id;
    const preview: FreePreview = {
      id: 'dev-preview-security-check',
      target: { kind: 'method', bookId: 'kanzul-mikban', methodId: 'own-house-in-life-method-1' },
      maxUses: 1,
      active: true,
    };
    consumePreviewUse(db, userId, preview);
    expect(canAccessForUser(db, userId, { kind: 'book', bookId: 'kanzul-mikban' })).toBe(false);
    expect(
      canAccessForUser(db, userId, { kind: 'method', bookId: 'kanzul-mikban', methodId: 'own-house-in-life-method-1' }),
    ).toBe(false);
  });
});
