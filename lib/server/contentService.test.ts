// Tests for the protected content service (Prompt 27, Phases 4 and 13 —
// CONTENT AUTHORIZATION). Exercises a real, isolated ':memory:' database
// per test — no mocking of canAccess() or the entitlement layer, so a
// passing test here means the actual authorization chain works end to end.
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from './db';
import { getOrCreateUser } from './identity';
import { grantEntitlement, revokeEntitlement } from './entitlements';
import { getBookMetadata, getChapterForUser, getMasterOpeningForUser, listAllBooks, listBookChapters } from './contentService';
import { BUNDLE_PRODUCT, KANZUL_PRODUCT, MASTER_PRODUCT } from '@/lib/access/products';

let db: Db;
afterEach(() => {
  try {
    db?.close();
  } catch {
    // Not open for a test that never called openDatabase(); nothing to clean up.
  }
});

function makeUser(): string {
  return getOrCreateUser(db, null).user.id;
}

const KANZUL_CHAPTER = 'if-you-want-to-know-if-you-will';
const MASTER_CHAPTER = 'drawing-a-chart';

describe('public metadata never requires a user or entitlement', () => {
  it('getBookMetadata and listAllBooks return the same public Book records for anyone', () => {
    expect(getBookMetadata('kanzul-mikban')?.title).toBe('Kanzul Mikban');
    expect(getBookMetadata('master-of-geomancy-vol-1')?.title).toBe('The Master of Geomancy');
    expect(getBookMetadata('not-a-real-book')).toBeNull();
    expect(listAllBooks().length).toBeGreaterThanOrEqual(2);
  });

  it('listBookChapters returns id/number/title only — never chapter text', () => {
    const kmChapters = listBookChapters('kanzul-mikban');
    expect(kmChapters.length).toBe(153);
    for (const c of kmChapters) {
      expect(Object.keys(c).sort()).toEqual(['id', 'number', 'title']);
    }

    const masterChapters = listBookChapters('master-of-geomancy-vol-1');
    expect(masterChapters.length).toBe(10);
    for (const c of masterChapters) {
      expect('body' in c).toBe(false);
    }
  });
});

describe('CONTENT AUTHORIZATION — unauthenticated/no entitlement', () => {
  it('a user with no entitlements cannot retrieve a Kanzul Mikban chapter', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const result = getChapterForUser(db, userId, 'kanzul-mikban', KANZUL_CHAPTER);
    expect(result).toEqual({ ok: false, reason: 'unauthorized' });
  });

  it('a user with no entitlements cannot retrieve a Master of Geomancy chapter', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const result = getChapterForUser(db, userId, 'master-of-geomancy-vol-1', MASTER_CHAPTER);
    expect(result).toEqual({ ok: false, reason: 'unauthorized' });
  });

  it('a user with no entitlements cannot retrieve the Master Dedication/Introduction', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    expect(getMasterOpeningForUser(db, userId)).toEqual({ ok: false, reason: 'unauthorized' });
  });
});

describe('CONTENT AUTHORIZATION — Master entitlement', () => {
  it('can retrieve a Master chapter, with real chapter content', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    grantEntitlement(db, userId, MASTER_PRODUCT.id, 'manual-payment');
    const result = getChapterForUser(db, userId, 'master-of-geomancy-vol-1', MASTER_CHAPTER);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const chapter = result.chapter as { id: string; body?: string[] };
      expect(chapter.id).toBe(MASTER_CHAPTER);
      expect(chapter.body?.length).toBeGreaterThan(0);
    }
  });

  it('cannot retrieve a Kanzul Mikban chapter', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    grantEntitlement(db, userId, MASTER_PRODUCT.id, 'manual-payment');
    expect(getChapterForUser(db, userId, 'kanzul-mikban', KANZUL_CHAPTER)).toEqual({
      ok: false,
      reason: 'unauthorized',
    });
  });
});

describe('CONTENT AUTHORIZATION — Kanzul entitlement', () => {
  it('can retrieve a Kanzul Mikban chapter, with real paragraph content', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    const result = getChapterForUser(db, userId, 'kanzul-mikban', KANZUL_CHAPTER);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const chapter = result.chapter as { id: string; paragraphs: string[] };
      expect(chapter.id).toBe(KANZUL_CHAPTER);
      expect(chapter.paragraphs.length).toBeGreaterThan(0);
      expect(chapter.paragraphs[0]).toMatch(/^Method 1:/);
    }
  });

  it('cannot retrieve a Master of Geomancy chapter', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    expect(getChapterForUser(db, userId, 'master-of-geomancy-vol-1', MASTER_CHAPTER)).toEqual({
      ok: false,
      reason: 'unauthorized',
    });
  });
});

describe('CONTENT AUTHORIZATION — bundle entitlement', () => {
  it('can retrieve chapters from both books', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    grantEntitlement(db, userId, BUNDLE_PRODUCT.id, 'manual-payment');
    expect(getChapterForUser(db, userId, 'kanzul-mikban', KANZUL_CHAPTER).ok).toBe(true);
    expect(getChapterForUser(db, userId, 'master-of-geomancy-vol-1', MASTER_CHAPTER).ok).toBe(true);
  });
});

describe('CONTENT AUTHORIZATION — revoked entitlement', () => {
  it('cannot retrieve protected content after revocation', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    const { entitlement } = grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    expect(getChapterForUser(db, userId, 'kanzul-mikban', KANZUL_CHAPTER).ok).toBe(true);

    revokeEntitlement(db, entitlement.id);
    expect(getChapterForUser(db, userId, 'kanzul-mikban', KANZUL_CHAPTER)).toEqual({
      ok: false,
      reason: 'unauthorized',
    });
  });
});

describe('CONTENT AUTHORIZATION — inactive product cannot authorize content', () => {
  it('an entitlement for a product not in the active catalogue grants nothing', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    // grantEntitlement itself refuses to create this (see entitlements.test.ts),
    // so there is no legitimate way to reach this state — asserted here as a
    // second line of defense: even an inactive/unknown product id can never
    // resolve to content access.
    expect(() => grantEntitlement(db, userId, 'not-a-real-product', 'manual-payment')).toThrow();
    expect(getChapterForUser(db, userId, 'kanzul-mikban', KANZUL_CHAPTER)).toEqual({
      ok: false,
      reason: 'unauthorized',
    });
  });
});

describe('CONTENT AUTHORIZATION — unknown book/chapter fails safely', () => {
  it('an unknown book id fails as unknown-book, even for a fully entitled user', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    grantEntitlement(db, userId, BUNDLE_PRODUCT.id, 'manual-payment');
    expect(getChapterForUser(db, userId, 'not-a-real-book', 'anything')).toEqual({
      ok: false,
      reason: 'unknown-book',
    });
  });

  it('an unknown chapter id within a real, entitled book fails as unknown-chapter', () => {
    db = openDatabase(':memory:');
    const userId = makeUser();
    grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    expect(getChapterForUser(db, userId, 'kanzul-mikban', 'not-a-real-chapter')).toEqual({
      ok: false,
      reason: 'unknown-chapter',
    });
  });

  it('an unknown chapter is reported before checking entitlement — never leaks whether the book itself is owned via timing/shape of the two failure reasons', () => {
    db = openDatabase(':memory:');
    const userId = makeUser(); // no entitlement at all
    // Still resolves to 'unknown-chapter', not 'unauthorized' — consistent
    // regardless of the caller's entitlement state, so the response shape
    // alone never reveals "this chapter exists but you can't have it" for a
    // chapter id that was simply guessed wrong.
    expect(getChapterForUser(db, userId, 'kanzul-mikban', 'guessed-wrong')).toEqual({
      ok: false,
      reason: 'unknown-chapter',
    });
  });
});

describe('IDENTITY SECURITY — entitlement belonging to another user does not authorize content', () => {
  it("granting user A's entitlement never grants user B content access", () => {
    db = openDatabase(':memory:');
    const userA = makeUser();
    const userB = makeUser();
    grantEntitlement(db, userA, KANZUL_PRODUCT.id, 'manual-payment');

    expect(getChapterForUser(db, userA, 'kanzul-mikban', KANZUL_CHAPTER).ok).toBe(true);
    expect(getChapterForUser(db, userB, 'kanzul-mikban', KANZUL_CHAPTER)).toEqual({
      ok: false,
      reason: 'unauthorized',
    });
  });
});
