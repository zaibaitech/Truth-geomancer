// The paid per-chart star notes (house-6 / house-2 meanings, sadaqah offering) are delivered only by
// POST /api/raml/chart-notes, only after the General Reading entitlement check (owned by The Master of
// Geomancy). Runs the real route handler against an in-memory database, like freeCastResultAccess.test.ts.
// Assertions never print protected text: they compare equality, count fingerprint hits and check key names.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openDatabase, type Db } from './db';
import { getOrCreateUser } from './identity';
import { grantEntitlement } from './entitlements';
import { buildChart } from '@/lib/raml/casting';
import { getStarByPattern } from '@/content/stars';
import { KANZUL_PRODUCT, MASTER_PRODUCT } from '@/lib/access/products';
import { STAR_NOTES } from '@/lib/server/content/starNotes';
import { buildChartNotes } from '@/lib/server/raml/chartNotes';
import { generalSadaqah } from '@/lib/raml/interpret';
import { buildFingerprints, findHits, normalizeText } from '../../tests/guards/lib/leakMatcher';
import { protectedStrings } from '../../tests/fixtures/protectedContent';
import { publicCorpus } from '../../tests/fixtures/publicContentAllowlist';

let db: Db;
let userId: string;
vi.mock('@/lib/server/db', async (orig) => ({ ...(await orig<typeof import('./db')>()), getDb: () => db }));
vi.mock('@/lib/server/session', () => ({
  getCurrentUser: async () => ({ id: userId }),
  getCurrentUserIfPresent: async () => null,
}));

import { POST as chartNotes } from '../../app/api/raml/chart-notes/route';

const FINGERPRINTS = buildFingerprints(protectedStrings(), publicCorpus());
const CHART = buildChart([
  [1, 2, 1, 2],
  [2, 2, 1, 1],
  [1, 1, 2, 2],
  [2, 1, 1, 2],
]);
const post = (body: unknown) =>
  chartNotes(new Request('https://app.example.com/api/raml/chart-notes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }));
const everyStarNote = () => Object.values(STAR_NOTES).flatMap((n) => [n.house6.meaning, n.house6.remedy, n.house2.meaning, n.house2.remedy, n.sadaqah.offering, n.sadaqah.day]);

beforeEach(async () => {
  db = openDatabase(':memory:');
  userId = (await getOrCreateUser(db, null)).user.id;
});
afterEach(async () => {
  await db.close();
});

describe('chart notes: the protected store is complete (so the tests below mean something)', () => {
  it('holds 16 stars, 32 remedies and 16 sadaqah offerings, all non-empty', () => {
    const notes = Object.values(STAR_NOTES);
    expect(notes).toHaveLength(16);
    expect(notes.filter((n) => n.house6.remedy.length > 0 && n.house2.remedy.length > 0)).toHaveLength(16); // 32 remedies
    expect(notes.filter((n) => n.sadaqah.offering.length > 0 && n.sadaqah.day.length > 0)).toHaveLength(16);
  });
  it('is keyed by exactly the public figure ids', async () => {
    const { STARS } = await import('@/content/stars');
    expect(Object.keys(STAR_NOTES).sort()).toEqual(STARS.map((s) => s.id).sort());
  });
});

describe('POST /api/raml/chart-notes: unauthorized requests get nothing protected', () => {
  it('a fresh anonymous visitor gets 403, no-store, and a body with only the denial fields', async () => {
    const res = await post({ chart: CHART });
    expect(res.status).toBe(403);
    expect(res.headers.get('cache-control') ?? '').toMatch(/no-store/);
    const text = await res.text();
    expect(Object.keys(JSON.parse(text)).sort()).toEqual(['accessState', 'bookId', 'error']);
    expect(findHits(normalizeText(text), FINGERPRINTS)).toEqual([]);
    for (const note of everyStarNote()) expect(text.includes(note)).toBe(false);
    expect(text).not.toMatch(/remedy|offering|sadaqah|house6|house2/i);
  });

  it('a Kanzul Mikban owner (a different paid book) is also refused: the General Reading belongs to the Master', async () => {
    await grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    const res = await post({ chart: CHART });
    expect(res.status).toBe(403);
    const text = await res.text();
    expect(findHits(normalizeText(text), FINGERPRINTS)).toEqual([]);
  });

  it('rejects malformed bodies before any lookup, with no protected content', async () => {
    for (const body of [{}, { chart: 'x' }, { chart: { houses: [] } }, null]) {
      const res = await post(body);
      expect([400, 403]).toContain(res.status);
      expect(findHits(normalizeText(await res.text()), FINGERPRINTS)).toEqual([]);
    }
  });

  it('a posted figure id cannot be used to read another figure: even an entitled reply is derived from the dot patterns', async () => {
    await grantEntitlement(db, userId, MASTER_PRODUCT.id, 'manual-payment');
    const forged = JSON.parse(JSON.stringify(CHART));
    for (const h of forged.houses) h.star = { id: 'musah', name: 'Musah' };
    const res = await post({ chart: forged });
    expect(res.status).toBe(200);
    const { notes } = await res.json();
    expect(notes).toEqual(buildChartNotes(CHART));
  });
});

describe('POST /api/raml/chart-notes: authorized readers keep their access', () => {
  it('a Master of Geomancy owner receives exactly the notes of their own chart\'s figures', async () => {
    await grantEntitlement(db, userId, MASTER_PRODUCT.id, 'manual-payment');
    const res = await post({ chart: CHART });
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control') ?? '').toMatch(/no-store/);
    const { notes } = await res.json();
    const idOf = (n: number) => getStarByPattern(CHART.houses[n - 1].pattern).id;
    expect(notes.judgeHouse6).toBe(STAR_NOTES[idOf(15)].house6.meaning);
    expect(notes.wealthHouse2).toBe(STAR_NOTES[idOf(2)].house2.meaning);
    expect(notes.illnessHouse6).toBe(STAR_NOTES[idOf(6)].house6.meaning);
    const sad = generalSadaqah(CHART);
    expect(notes.sadaqah).toEqual({ figureName: sad.star.name, houses: sad.houses, offering: STAR_NOTES[sad.star.id].sadaqah.offering, day: STAR_NOTES[sad.star.id].sadaqah.day });
  });

  it('even an entitled response contains no remedy and only the four notes (not the whole table)', async () => {
    await grantEntitlement(db, userId, MASTER_PRODUCT.id, 'manual-payment');
    const text = await (await post({ chart: CHART })).text();
    for (const n of Object.values(STAR_NOTES)) {
      expect(text.includes(n.house6.remedy)).toBe(false);
      expect(text.includes(n.house2.remedy)).toBe(false);
    }
    expect(text).not.toMatch(/remedy/i);
    const distinct = Object.values(STAR_NOTES).filter((n) => [n.house6.meaning, n.house2.meaning, n.sadaqah.offering].some((s) => text.includes(s))).length;
    expect(distinct).toBeLessThanOrEqual(4);
  });
});
