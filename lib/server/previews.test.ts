// Tests for atomic preview-usage persistence (Prompt 26, Phases 6 and 11
// — PREVIEWS). No commercial preview is activated by these tests — they
// exercise the persistence mechanics using a locally-built FreePreview
// object, exactly as lib/access/previewCandidates.ts documents should
// happen once the author picks one (Prompt 26 §8's DEVELOPMENT ONLY note).
// Updated for Prompt 31C's async Db interface.
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from './db';
import { consumePreviewUse, getPreviewUsage } from './previews';
import { getOrCreateUser } from './identity';
import { getEntitlementsForUser } from './entitlements';
import type { FreePreview } from '@/lib/access/types';

let db: Db;
afterEach(async () => {
  try {
    await db?.close();
  } catch {
    // Not open for a test that never called openDatabase(); nothing to clean up.
  }
});

async function makeUser(): Promise<string> {
  return (await getOrCreateUser(db, null)).user.id;
}

// DEVELOPMENT ONLY — NOT A PRODUCTION PREVIEW DECISION. Exists solely to
// exercise consumePreviewUse's persistence logic in these tests; the
// author has not chosen a final preview (see previewCandidates.ts).
const DEV_PREVIEW: FreePreview = {
  id: 'dev-preview-own-house',
  target: { kind: 'method', bookId: 'kanzul-mikban', methodId: 'own-house-in-life-method-1' },
  maxUses: 1,
  active: true,
};

describe('first consumption succeeds', () => {
  it('the first use of a maxUses=1 preview succeeds and records usesConsumed=1', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    const result = await consumePreviewUse(db, userId, DEV_PREVIEW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.usage.usesConsumed).toBe(1);
      expect(result.usage.status).toBe('exhausted');
    }
    expect(await getPreviewUsage(db, userId, DEV_PREVIEW.id)).toEqual({
      userId,
      previewId: DEV_PREVIEW.id,
      usesConsumed: 1,
      status: 'exhausted',
    });
  });
});

describe('maximum use count is respected', () => {
  it('a preview with maxUses=3 allows exactly 3 uses and marks the 3rd as exhausted', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    const preview: FreePreview = { ...DEV_PREVIEW, id: 'dev-preview-3-uses', maxUses: 3 };

    const first = await consumePreviewUse(db, userId, preview);
    const second = await consumePreviewUse(db, userId, preview);
    const third = await consumePreviewUse(db, userId, preview);

    expect(first.ok && first.usage.usesConsumed).toBe(1);
    expect(second.ok && second.usage.status).toBe('available');
    expect(third.ok && third.usage.usesConsumed).toBe(3);
    expect(third.ok && third.usage.status).toBe('exhausted');
  });
});

describe('second use fails when maxUses=1', () => {
  it('a second consumption attempt is refused with reason "exhausted"', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await consumePreviewUse(db, userId, DEV_PREVIEW);
    const second = await consumePreviewUse(db, userId, DEV_PREVIEW);
    expect(second).toEqual({ ok: false, reason: 'exhausted' });
  });
});

describe('repeated/concurrent consumption cannot exceed maxUses', () => {
  it('10 consecutive calls against maxUses=1 result in exactly 1 success', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    const results = [];
    for (let i = 0; i < 10; i++) results.push(await consumePreviewUse(db, userId, DEV_PREVIEW));
    const successes = results.filter((r) => r.ok);
    expect(successes).toHaveLength(1);
    expect((await getPreviewUsage(db, userId, DEV_PREVIEW.id))?.usesConsumed).toBe(1);
  });

  it('10 "simultaneous" (Promise.all) calls against maxUses=3 result in exactly 3 successes', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    const preview: FreePreview = { ...DEV_PREVIEW, id: 'dev-preview-concurrent', maxUses: 3 };
    // Genuinely concurrent (Promise.all, not sequential) — safe against the
    // SQLite test/dev adapter because its transaction() serializes
    // internally (see lib/server/db/sqliteAdapter.ts's own comment). This
    // proves in-process atomicity; it does not prove multi-connection
    // Postgres correctness under real concurrency, which needs a live
    // database — see lib/server/db/postgresAdapter.concurrency.test.ts.
    const results = await Promise.all(Array.from({ length: 10 }, () => consumePreviewUse(db, userId, preview)));
    const successes = results.filter((r) => r.ok);
    expect(successes).toHaveLength(3);
    expect((await getPreviewUsage(db, userId, preview.id))?.usesConsumed).toBe(3);
  });
});

describe('revoked/inactive preview cannot be consumed', () => {
  it('an inactive preview refuses consumption and never writes a usage row', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    const inactive: FreePreview = { ...DEV_PREVIEW, id: 'dev-preview-inactive', active: false };
    const result = await consumePreviewUse(db, userId, inactive);
    expect(result).toEqual({ ok: false, reason: 'inactive-preview' });
    expect(await getPreviewUsage(db, userId, inactive.id)).toBeNull();
  });
});

describe('preview consumption does not grant paid access', () => {
  it('consuming a preview never creates an Entitlement row for that user', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await consumePreviewUse(db, userId, DEV_PREVIEW);
    expect(await getEntitlementsForUser(db, userId)).toHaveLength(0);
  });

  it('previews.ts never imports entitlements.ts (structurally separate persistence)', async () => {
    const { readFileSync } = await import('node:fs');
    const source = readFileSync('lib/server/previews.ts', 'utf-8');
    expect(source).not.toMatch(/from ['"]\.\/entitlements['"]/);
    expect(source).not.toMatch(/INSERT INTO entitlements|UPDATE entitlements/);
  });
});
