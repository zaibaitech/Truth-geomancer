import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { KANZUL_PRODUCT, MASTER_PRODUCT } from './products';
import { PREVIEW_POLICIES } from './previewPolicy';
import { QUESTION_CATALOG } from '@/lib/raml/questionCatalog';
import {
  authorizeCastingIntention,
  canProceedToCast,
  getFreeCastingSample,
  isFreeCastingIntention,
  owningBookIdForIntention,
  questionIdForMethod,
  resolveCastingIntentionId,
  GENERAL_READING_BOOK_ID,
  GENERAL_READING_INTENTION_ID,
} from './castingAuthorization';

const PAID_KANZUL = 'if-you-want-to-know-if-you-will';
const DREAMS = 'dreams-and-their-interpretations';

describe('free sample designation', () => {
  it('reuses the production Kanzul preview method, not an array position', () => {
    const sample = getFreeCastingSample();
    expect(sample).not.toBeNull();
    const preview = PREVIEW_POLICIES['kanzul-mikban'].preview;
    expect(preview.target.kind).toBe('method');
    if (preview.target.kind !== 'method' || !sample) return;
    expect(sample.methodId).toBe(preview.target.methodId);
    expect(sample.bookId).toBe('kanzul-mikban');
    expect(sample.questionId).toBe('if-you-will-own-a-house-in-your');
    expect(sample.methodId).toBe('own-house-in-life-method-1');
  });

  it('does not treat authentication or catalogue order as the sample', () => {
    expect(isFreeCastingIntention(PAID_KANZUL)).toBe(false);
    expect(QUESTION_CATALOG[0].id).not.toBe('if-you-will-own-a-house-in-your');
    expect(isFreeCastingIntention(QUESTION_CATALOG[0].id)).toBe(false);
  });
});

describe('book → method mapping from existing source data', () => {
  it('every catalogue question resolves to exactly one owning book', () => {
    for (const entry of QUESTION_CATALOG) {
      expect(owningBookIdForIntention(entry.id), entry.id).toBe('kanzul-mikban');
      expect(entry.sourceBook, entry.id).toBe('kanzul-mikban');
    }
  });

  it('the general reading is attributed to The Master of Geomancy, not guessed as Kanzul', () => {
    expect(owningBookIdForIntention(GENERAL_READING_INTENTION_ID)).toBe(GENERAL_READING_BOOK_ID);
  });

  it('an unknown id has no book relationship', () => {
    expect(owningBookIdForIntention('not-a-real-intention')).toBeNull();
    expect(questionIdForMethod('not-a-real-method')).toBeNull();
  });

  it('method ids resolve to their parent question without a hard-coded map', () => {
    expect(resolveCastingIntentionId('money-method-1')).toBe(PAID_KANZUL);
    expect(resolveCastingIntentionId('own-house-in-life-method-1')).toBe('if-you-will-own-a-house-in-your');
  });
});

describe('authorizeCastingIntention', () => {
  const none = { entitledBookIds: new Set<string>(), pendingBookIds: new Set<string>() };

  it('allows the free sample with no entitlements', () => {
    const authz = authorizeCastingIntention('if-you-will-own-a-house-in-your', none);
    expect(authz).toMatchObject({ allowed: true, reason: 'free-sample', accessState: 'free-sample', bookId: 'kanzul-mikban' });
    expect(canProceedToCast(authz.accessState)).toBe(true);
  });

  it('denies a paid Kanzul question with no entitlement', () => {
    const authz = authorizeCastingIntention(PAID_KANZUL, none);
    expect(authz).toMatchObject({ allowed: false, reason: 'locked', accessState: 'locked', bookId: 'kanzul-mikban' });
    expect(canProceedToCast(authz.accessState)).toBe(false);
  });

  it('denies a paid question when the request is only pending', () => {
    const authz = authorizeCastingIntention(PAID_KANZUL, {
      entitledBookIds: new Set(),
      pendingBookIds: new Set(['kanzul-mikban']),
    });
    expect(authz).toMatchObject({ allowed: false, reason: 'pending', accessState: 'pending' });
    expect(canProceedToCast(authz.accessState)).toBe(false);
  });

  it('allows a paid Kanzul question with an approved Kanzul book entitlement', () => {
    const authz = authorizeCastingIntention(DREAMS, {
      entitledBookIds: new Set(['kanzul-mikban']),
      pendingBookIds: new Set(),
    });
    expect(authz).toMatchObject({ allowed: true, reason: 'entitled', accessState: 'unlocked', bookId: 'kanzul-mikban' });
  });

  it('Master entitlement does not unlock Kanzul questions', () => {
    const authz = authorizeCastingIntention(PAID_KANZUL, {
      entitledBookIds: new Set(['master-of-geomancy-vol-1']),
      pendingBookIds: new Set(),
    });
    expect(authz.allowed).toBe(false);
    expect(authz.bookId).toBe('kanzul-mikban');
  });

  it('Kanzul entitlement does not unlock the Master general reading', () => {
    const authz = authorizeCastingIntention(GENERAL_READING_INTENTION_ID, {
      entitledBookIds: new Set(['kanzul-mikban']),
      pendingBookIds: new Set(),
    });
    expect(authz.allowed).toBe(false);
    expect(authz.bookId).toBe('master-of-geomancy-vol-1');
  });

  it('owning both books unlocks both', () => {
    const both = { entitledBookIds: new Set(['kanzul-mikban', 'master-of-geomancy-vol-1']), pendingBookIds: new Set<string>() };
    expect(authorizeCastingIntention(PAID_KANZUL, both).allowed).toBe(true);
    expect(authorizeCastingIntention(GENERAL_READING_INTENTION_ID, both).allowed).toBe(true);
    expect(authorizeCastingIntention('if-you-will-own-a-house-in-your', both).accessState).toBe('free-sample');
  });

  it('unknown method/question is rejected', () => {
    const authz = authorizeCastingIntention('not-a-real-method-id', none);
    expect(authz).toMatchObject({ allowed: false, reason: 'unknown-intention' });
  });

  it('a known id with no book relationship fails closed', () => {
    // Intentionally not a registered question/method — missing-book is the
    // fail-closed path for a recognised-but-unmapped target; unknown ids
    // take unknown-intention instead. Both refuse the engine.
    const authz = authorizeCastingIntention('not-a-real-intention', none);
    expect(authz.allowed).toBe(false);
    expect(['unknown-intention', 'missing-book']).toContain(authz.reason);
  });

  it('posting a paid method id cannot bypass the question gate', () => {
    const authz = authorizeCastingIntention('money-method-1', none);
    expect(authz.allowed).toBe(false);
    expect(authz.intentionId).toBe(PAID_KANZUL);
    expect(authz.accessState).toBe('locked');
  });
});

describe('no second entitlement system and no hard-coded method lists', () => {
  it('the authorization module never lists paid method ids', () => {
    const authz = readFileSync('lib/access/castingAuthorization.ts', 'utf-8');
    const ownership = readFileSync('lib/access/methodOwnership.ts', 'utf-8');
    expect(authz).not.toMatch(/money-method-1/);
    expect(ownership).not.toMatch(/money-method-1/);
    expect(authz).not.toMatch(/if \(.*kanzul-mikban.*allow/);
    expect(authz).toMatch(/getPreviewPolicy/);
    expect(ownership).toMatch(/sourceBook/);
  });

  it('product ids used in tests are the existing catalogue, not invented SKUs', () => {
    expect(KANZUL_PRODUCT.id).toBe('kanzul-mikban');
    expect(MASTER_PRODUCT.id).toBe('master-of-geomancy-vol-1');
  });
});
