import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { openDatabase, type Db } from '../db';
import { getOrCreateUser } from '../identity';
import { grantEntitlement, revokeEntitlement } from '../entitlements';
import { createPaymentRequest } from '../paymentRequests';
import { getReadingResult } from './readingService';
import { getReadingVerdictsForIntention } from '../readingVerdictService';
import { authorizeCastingForUser, getCastingAccessSnapshot } from './castingAccess';
import { fixtureChart } from '@/lib/raml/engine/__tests__/fixtures';
import { KANZUL_PRODUCT, MASTER_PRODUCT, BUNDLE_PRODUCT } from '@/lib/access/products';
import { canProceedToCast } from '@/lib/access/castingAuthorization';

const PAID = 'if-you-want-to-know-if-you-will';
const SAMPLE = 'if-you-will-own-a-house-in-your';
const DREAMS = 'dreams-and-their-interpretations';
const chart = fixtureChart();

let db: Db;
afterEach(async () => {
  try {
    await db?.close();
  } catch {
    // not opened
  }
});

async function userId(token: string | null = null) {
  db = openDatabase(':memory:');
  return (await getOrCreateUser(db, token)).user.id;
}

describe('1. free sample allowed', () => {
  it('an anonymous user may cast the designated free sample', async () => {
    const id = await userId();
    const authz = await authorizeCastingForUser(db, id, SAMPLE);
    expect(authz.allowed).toBe(true);
    expect(authz.accessState).toBe('free-sample');
    const result = getReadingResult(chart, SAMPLE);
    expect(result).not.toBeNull();
    expect(JSON.stringify(authz)).not.toMatch(/After drawing the chart|sourceQuote/);
  });
});

describe('2. paid method denied without entitlement', () => {
  it('an anonymous user cannot cast a paid Kanzul question', async () => {
    const id = await userId();
    const authz = await authorizeCastingForUser(db, id, PAID);
    expect(authz.allowed).toBe(false);
    expect(authz.accessState).toBe('locked');
  });
});

describe('3. paid method denied with pending entitlement', () => {
  it('a pending payment request does not unlock casting', async () => {
    const id = await userId();
    const created = await createPaymentRequest(db, id, KANZUL_PRODUCT.id, 'REF-PENDING');
    expect(created.ok).toBe(true);
    const authz = await authorizeCastingForUser(db, id, PAID);
    expect(authz.allowed).toBe(false);
    expect(authz.accessState).toBe('pending');
  });
});

describe('4. paid method allowed with approved entitlement', () => {
  it('an active Kanzul entitlement unlocks paid Kanzul questions including dreams', async () => {
    const id = await userId();
    await grantEntitlement(db, id, KANZUL_PRODUCT.id, 'manual-payment');
    const authz = await authorizeCastingForUser(db, id, DREAMS);
    expect(authz.allowed).toBe(true);
    expect(authz.accessState).toBe('unlocked');
    expect(getReadingResult(chart, DREAMS)).not.toBeNull();
  });
});

describe('5. paid method denied after revocation', () => {
  it('revokeEntitlement removes casting access', async () => {
    const id = await userId();
    const { entitlement } = await grantEntitlement(db, id, KANZUL_PRODUCT.id, 'manual-payment');
    expect((await authorizeCastingForUser(db, id, PAID)).allowed).toBe(true);
    await revokeEntitlement(db, entitlement.id);
    const authz = await authorizeCastingForUser(db, id, PAID);
    expect(authz.allowed).toBe(false);
    expect(authz.accessState).toBe('locked');
  });
});

describe('6-8. books do not leak across entitlements', () => {
  it('Book A (Master) does not unlock Book B (Kanzul) methods', async () => {
    const id = await userId();
    await grantEntitlement(db, id, MASTER_PRODUCT.id, 'manual-payment');
    expect((await authorizeCastingForUser(db, id, PAID)).allowed).toBe(false);
    expect((await authorizeCastingForUser(db, id, 'general')).allowed).toBe(true);
  });

  it('Book B (Kanzul) does not unlock Book A (Master) general reading', async () => {
    const id = await userId();
    await grantEntitlement(db, id, KANZUL_PRODUCT.id, 'manual-payment');
    expect((await authorizeCastingForUser(db, id, PAID)).allowed).toBe(true);
    expect((await authorizeCastingForUser(db, id, 'general')).allowed).toBe(false);
  });

  it('owning multiple books (bundle) unlocks both', async () => {
    const id = await userId();
    await grantEntitlement(db, id, BUNDLE_PRODUCT.id, 'manual-payment');
    expect((await authorizeCastingForUser(db, id, PAID)).allowed).toBe(true);
    expect((await authorizeCastingForUser(db, id, 'general')).allowed).toBe(true);
    expect((await authorizeCastingForUser(db, id, SAMPLE)).accessState).toBe('free-sample');
  });
});

describe('9-10. direct API contract: authorize before engine', () => {
  it('the reading route resolves the session and authorizes before getReadingResult', () => {
    const source = readFileSync('app/api/raml/reading/route.ts', 'utf-8');
    const post = source.slice(source.indexOf('export async function POST'));
    expect(post).toMatch(/getCurrentUser\(\)/);
    expect(post).toMatch(/authorizeCastingForUser/);
    expect(post.indexOf('authorizeCastingForUser')).toBeLessThan(post.indexOf('getReadingResult'));
    expect(post).not.toMatch(/body\.userId/);
    expect(post).toMatch(/status: 403/);
  });

  it('the reading-verdicts route is gated the same way', () => {
    const source = readFileSync('app/api/raml/reading-verdicts/route.ts', 'utf-8');
    const post = source.slice(source.indexOf('export async function POST'));
    expect(post).toMatch(/getCurrentUser\(\)/);
    expect(post).toMatch(/authorizeCastingForUser/);
    expect(post.indexOf('authorizeCastingForUser')).toBeLessThan(post.indexOf('getReadingVerdictsForIntention'));
    expect(post).toMatch(/status: 403/);
  });

  it('an unauthorized decision never includes a reading result or source quote', async () => {
    const id = await userId();
    const authz = await authorizeCastingForUser(db, id, PAID);
    expect(authz.allowed).toBe(false);
    expect(JSON.stringify(authz)).not.toMatch(/sourceQuote|shortSummary|After drawing the chart/);
    // Engine is callable in tests, but the route must not call it when denied —
    // confirmed structurally above. Computing here would be the leak if the
    // route skipped the gate.
    expect('result' in authz).toBe(false);
  });

  it('an entitled user can obtain a reading result after the gate', async () => {
    const id = await userId();
    await grantEntitlement(db, id, KANZUL_PRODUCT.id, 'manual-payment');
    const authz = await authorizeCastingForUser(db, id, PAID);
    expect(authz.allowed).toBe(true);
    const result = getReadingResult(chart, PAID);
    expect(result?.questionId).toBe(PAID);
    const verdicts = getReadingVerdictsForIntention(PAID, chart);
    expect(verdicts.ok).toBe(true);
  });
});

describe('11-12. unknown and unmapped targets fail closed', () => {
  it('unknown method rejected', async () => {
    const id = await userId();
    const authz = await authorizeCastingForUser(db, id, 'definitely-not-a-method');
    expect(authz.allowed).toBe(false);
    expect(authz.reason).toBe('unknown-intention');
  });

  it('null user is treated as no entitlements, not as a bypass', async () => {
    db = openDatabase(':memory:');
    const authz = await authorizeCastingForUser(db, null, PAID);
    expect(authz.allowed).toBe(false);
    expect((await authorizeCastingForUser(db, null, SAMPLE)).allowed).toBe(true);
  });
});

describe('13-15. UI cannot proceed for locked/pending; free sample remains', () => {
  it('snapshot marks paid questions locked and the sample free for a new user', async () => {
    const id = await userId();
    const snap = await getCastingAccessSnapshot(db, id);
    expect(snap.freeSampleIntentionId).toBe(SAMPLE);
    expect(snap.byIntentionId[SAMPLE]?.allowed).toBe(true);
    expect(snap.byIntentionId[SAMPLE]?.accessState).toBe('free-sample');
    expect(snap.byIntentionId[PAID]?.allowed).toBe(false);
    expect(snap.byIntentionId[PAID]?.accessState).toBe('locked');
    expect(canProceedToCast(snap.byIntentionId[PAID].accessState)).toBe(false);
  });

  it('snapshot marks paid questions pending, not allowed, when a request is in review', async () => {
    const id = await userId();
    await createPaymentRequest(db, id, KANZUL_PRODUCT.id, 'REF-2');
    const snap = await getCastingAccessSnapshot(db, id);
    expect(snap.byIntentionId[PAID]?.accessState).toBe('pending');
    expect(snap.byIntentionId[PAID]?.allowed).toBe(false);
    expect(snap.byIntentionId[SAMPLE]?.allowed).toBe(true);
  });

  it('CastingFlow and IntentionPicker refuse to start a locked or pending cast', () => {
    const flow = readFileSync('components/raml/CastingFlow.tsx', 'utf-8');
    const picker = readFileSync('components/raml/IntentionPicker.tsx', 'utf-8');
    const card = readFileSync('components/raml/QuestionCard.tsx', 'utf-8');
    expect(flow).toMatch(/canProceedToCast/);
    expect(picker).toMatch(/canProceedToCast/);
    expect(card).toMatch(/disabled=\{!allowed\}/);
    expect(card).toMatch(/Requires/);
    expect(card).toMatch(/Pending|pending/);
  });
});

describe('16. protected prose stays server-side', () => {
  it('the client picker/authorization modules never import the engine or kanzul chapter text', () => {
    for (const file of [
      'lib/access/castingAuthorization.ts',
      'components/raml/IntentionPicker.tsx',
      'components/raml/QuestionCard.tsx',
      'components/raml/CastingFlow.tsx',
    ]) {
      const source = readFileSync(file, 'utf-8');
      expect(source).not.toMatch(/from ['"]@\/lib\/raml\/engine['"]/);
      expect(source).not.toMatch(/from ['"]@\/lib\/server\/content\/kanzulMikban['"]/);
      expect(source).not.toMatch(/QUESTION_REGISTRY[^_]/);
    }
  });
});

describe('no second purchase/entitlement system', () => {
  it('castingAccess uses existing entitlements and paymentRequests only', () => {
    const source = readFileSync('lib/server/raml/castingAccess.ts', 'utf-8');
    expect(source).toMatch(/getAccessContextForUser/);
    expect(source).toMatch(/getPaymentRequestsForUser/);
    expect(source).not.toMatch(/CREATE TABLE/);
    expect(source).not.toMatch(/runReading/);
  });
});
