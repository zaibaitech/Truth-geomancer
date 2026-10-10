// Free-cast Phase A must not touch access: /api/raml/reading still answers 403 with no
// content for a locked user, the free sample still works, and an entitled reader still
// receives the full result. The new answer/steps UI is built only from that response.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openDatabase, type Db } from './db';
import { getOrCreateUser } from './identity';
import { grantEntitlement } from './entitlements';
import { buildChart } from '@/lib/raml/casting';
import { KANZUL_PRODUCT } from '@/lib/access/products';
import { ownHouseInLifeQuestion } from '@/lib/raml/engine/questions/ownHouseInLife';
import { buildAnswerView } from '@/lib/raml/readingExplanation';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { LEARN_COPY } from '@/content/public/freeCastLearning';

let db: Db;
let userId: string;
vi.mock('@/lib/server/db', async (orig) => ({ ...(await orig<typeof import('./db')>()), getDb: () => db }));
vi.mock('@/lib/server/session', () => ({
  getCurrentUser: async () => ({ id: userId }),
  getCurrentUserIfPresent: async () => null,
}));

import { POST as reading } from '../../app/api/raml/reading/route';

const CHART = buildChart([
  [1, 2, 1, 2],
  [2, 2, 1, 1],
  [1, 1, 2, 2],
  [2, 1, 1, 2],
]);
const PAID_QUESTION = 'if-you-want-to-know-if-you-will';
const post = (intentionId: string) =>
  reading(new Request('https://app.example.com/api/raml/reading', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ intentionId, chart: CHART }) }));

beforeEach(async () => {
  db = openDatabase(':memory:');
  userId = (await getOrCreateUser(db, null)).user.id;
});
afterEach(async () => {
  await db.close();
});

describe('free-cast result access is unchanged', () => {
  it('a locked user gets 403 and no result, interpretation, quote or steps for a paid question', async () => {
    const res = await post(PAID_QUESTION);
    expect(res.status).toBe(403);
    const text = await res.text();
    const body = JSON.parse(text) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['accessState', 'bookId', 'error']);
    expect(text).not.toMatch(/interpretation|sourceQuote|calculationSteps|methodResults|houses/i);
    // the new UI has nothing to render from a denied response (and ResultTabs never mounts it for a 403)
    expect(buildAnswerView(body as never).kind).toBe('legacy');
  });

  it('the free Chapter 146 sample is still allowed and returns its own method\'s verdict', async () => {
    const res = await post(ownHouseInLifeQuestion.id);
    expect(res.status).toBe(200);
    const { result } = await res.json();
    const view = buildAnswerView(result);
    expect(view.kind).toBe('single');
    expect(view.groups[0].methods[0].sourceLabel).toBe('Kanzul Mikban, Chapter 146');
  });

  it('an entitled reader still receives the paid reading, and the answer is built from it', async () => {
    await grantEntitlement(db, userId, KANZUL_PRODUCT.id, 'manual-payment');
    const res = await post(PAID_QUESTION);
    expect(res.status).toBe(200);
    const { result } = await res.json();
    expect(buildAnswerView(result).kind).not.toBe('legacy');
  });
});

describe('Phase B practice adds no access path', () => {
  it('a locked user\'s 403 body carries none of the practice copy or any answer', async () => {
    const text = await (await post(PAID_QUESTION)).text();
    for (const v of Object.values(LEARN_COPY)) if (typeof v === 'string') expect(text).not.toContain(v);
    expect(text).not.toMatch(/Try it yourself|answerKey|workingLine/);
  });
  it('the practice is mounted only from the result branch, and derives the free-sample flag from the existing helpers', () => {
    const src = readFileSync(path.resolve(__dirname, '../../components/raml/ResultTabs.tsx'), 'utf8');
    expect(src.match(/<EngineReadingView/g)).toHaveLength(1);
    // the only EngineReadingView sits under `engineResult ?`, before the denied/failed branches
    expect(src.indexOf('engineResult ? (')).toBeLessThan(src.indexOf('<EngineReadingView'));
    expect(src.indexOf('<EngineReadingView')).toBeLessThan(src.indexOf('engineDenied ? ('));
    expect(src).toMatch(/isFreeCastingIntention\(intentionId\)/);
    expect(src).toMatch(/getFreeCastingSample\(\)\?\.questionId/);
  });
  it('the practice modules import nothing from the server, auth, entitlement or payment code', () => {
    for (const f of ['lib/raml/readingPractice.ts', 'components/raml/reading/PracticeActivity.tsx', 'components/raml/reading/LearnLinks.tsx', 'content/public/freeCastLearning.ts']) {
      const src = readFileSync(path.resolve(__dirname, '../../', f), 'utf8');
      expect(src, f).not.toMatch(/from '@\/lib\/(server|access)|entitle|paystack|session|fetch\(/);
    }
  });
});
