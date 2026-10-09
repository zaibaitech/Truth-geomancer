// Stage 1a guard: PAID API endpoints refuse visitors without an entitlement.
//
// Runs the real route handlers against an in-memory database, as
// lib/server/paystackRoutes.test.ts does. Only the cookie-reading session is
// stubbed. getCurrentUser() mints an anonymous user when there is no session,
// so "unauthenticated" means a fresh identity with no entitlement, and the
// handlers answer 403. No API code is changed by this test.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openDatabase, type Db } from '@/lib/server/db';
import { getOrCreateUser } from '@/lib/server/identity';
import { buildChart } from '@/lib/raml/casting';
import { getFreeCastingSample, GENERAL_READING_INTENTION_ID } from '@/lib/access/castingAuthorization';
import { KM_CHAPTERS } from '@/lib/server/content/kanzulMikban';
import { CHAPTERS as MASTER_CHAPTERS } from '@/lib/server/content/masterOfGeomancy';
import { buildFingerprints, findHits, normalizeText } from './lib/leakMatcher';
import { protectedStrings } from '../fixtures/protectedContent';
import { publicCorpus } from '../fixtures/publicContentAllowlist';

let db: Db;
let userId: string;

vi.mock('@/lib/server/db', async (orig) => ({ ...(await orig<typeof import('@/lib/server/db')>()), getDb: () => db }));
vi.mock('@/lib/server/session', () => ({
  getCurrentUser: async () => ({ id: userId }),
  getCurrentUserIfPresent: async () => null,
}));

import { POST as reading } from '../../app/api/raml/reading/route';
import { POST as readingVerdicts } from '../../app/api/raml/reading-verdicts/route';
import { POST as practice } from '../../app/api/raml/practice/route';
import { GET as chapter } from '../../app/api/books/[bookId]/chapters/[chapterId]/route';
import { GET as offline } from '../../app/api/books/[bookId]/offline/route';
import { GET as previewStatus } from '../../app/api/preview/[bookId]/route';

const FINGERPRINTS = buildFingerprints(protectedStrings(), publicCorpus());
const CHART = buildChart([
  [1, 2, 1, 2],
  [2, 2, 1, 1],
  [1, 1, 2, 2],
  [2, 1, 1, 2],
]);
const PAID_KANZUL_INTENTION = 'if-you-want-to-know-if-you-will';

const post = (body: unknown) =>
  new Request('https://app.example.com/api', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

async function expectDenied(res: Response) {
  expect([401, 403]).toContain(res.status);
  const text = await res.text();
  const json = JSON.parse(text) as Record<string, unknown>;
  for (const k of ['result', 'verdicts', 'sourceQuote', 'row', 'paragraphs', 'chapters', 'content', 'text']) expect(json).not.toHaveProperty(k);
  expect(findHits(normalizeText(text), FINGERPRINTS)).toEqual([]);
  expect(res.headers.get('cache-control') ?? '').toMatch(/no-store/);
}

beforeEach(async () => {
  db = openDatabase(':memory:');
  userId = (await getOrCreateUser(db, null)).user.id;
});

describe('paid APIs without an entitlement', () => {
  it('POST /api/raml/reading: paid Kanzul question -> denied, no result', async () => {
    await expectDenied(await reading(post({ intentionId: PAID_KANZUL_INTENTION, chart: CHART })));
  });

  it('POST /api/raml/reading: the General Reading is paid (Master entitlement) -> denied', async () => {
    await expectDenied(await reading(post({ intentionId: GENERAL_READING_INTENTION_ID, chart: CHART })));
  });

  it('POST /api/raml/reading-verdicts: paid question -> denied, no verdicts', async () => {
    await expectDenied(await readingVerdicts(post({ intentionId: PAID_KANZUL_INTENTION, chart: CHART })));
  });

  it('POST /api/raml/practice: paid Kanzul method -> denied, no quote or row', async () => {
    await expectDenied(await practice(post({ chapterId: 'business-profit-and-loss', methodId: 'business-method-1', chart: CHART })));
    await expectDenied(await practice(post({ chapterId: 'business-profit-and-loss', methodId: 'business-method-1' })));
  });

  it.each([
    ['kanzul-mikban', KM_CHAPTERS[0].id],
    ['kanzul-mikban', KM_CHAPTERS[KM_CHAPTERS.length - 1].id],
    ['master-of-geomancy-vol-1', MASTER_CHAPTERS[0].id],
  ])('GET /api/books/%s/chapters/%s -> denied, no chapter text', async (bookId, chapterId) => {
    await expectDenied(await chapter(new Request('https://app.example.com/x'), { params: { bookId, chapterId } }));
  });

  it.each(['kanzul-mikban', 'master-of-geomancy-vol-1'])('GET /api/books/%s/offline -> denied, no book bundle', async (bookId) => {
    await expectDenied(await offline(new Request('https://app.example.com/x'), { params: { bookId } }));
  });

  it.each(['kanzul-mikban', 'master-of-geomancy-vol-1'])('GET /api/preview/%s (signed out) returns status only, no content', async (bookId) => {
    const res = await previewStatus(new Request('https://app.example.com/x'), { params: { bookId } });
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ status: 'available' });
  });
});

describe('free sample stays free (allowlist consistency)', () => {
  it('POST /api/raml/reading for the one free sample question succeeds without an entitlement', async () => {
    const sample = getFreeCastingSample();
    expect(sample).not.toBeNull();
    const res = await reading(post({ intentionId: sample!.questionId, chart: CHART }));
    expect(res.status).toBe(200);
    expect(await res.json()).toHaveProperty('result');
  });
});
