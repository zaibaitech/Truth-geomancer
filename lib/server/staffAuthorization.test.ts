// Staff / author / platform-admin authorization — the full matrix.
//
// Domain functions are exercised directly; the admin API routes are exercised
// for real (route handler + adminActor + staff/staffAdmin + the database),
// with only three seams replaced: which user the session cookie resolves to
// (`current`), whether a break-glass admin cookie is present (`breakGlass`),
// and the database handle (a fresh in-memory SQLite per test).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openDatabase, type Db } from './db';

let db: Db;
let current: { id: string; email: string | null } | null = null;
let breakGlass = false;

vi.mock('@/lib/server/db', async (orig) => ({ ...(await orig<typeof import('./db')>()), getDb: () => db }));
vi.mock('@/lib/server/session', () => ({ getCurrentUserIfPresent: async () => current }));
vi.mock('@/lib/server/adminSession', () => ({
  isBreakGlassAdminSession: async () => breakGlass,
  loginAdmin: async () => false,
  logoutAdmin: async () => {},
}));

import { attachEmailToUser, createAnonymousUser, generateSessionToken } from './identity';
import { canAccessForUser, hasEntitlementAccess, resolveAccessForUser } from './accessService';
import { getStaffAccess, getStaffRole, isAuthorForBook, isPlatformAdmin, staffAccessReason, staffGrants } from './staff';
import { assignBookToAuthor, findVerifiedUserByEmail, grantStaffRole, revokeStaffRole, unassignBookFromAuthor } from './staffAdmin';
import { resolveAdminActor } from './adminActor';
import { createAdminSession, generateAdminToken, isAdminToken, revokeAdminSession, verifyAdminSecret } from './adminAuth';
import { grantEntitlement } from './entitlements';
import { approvePaymentRequest, createPaymentRequest, getPaymentRequestById } from './paymentRequests';
import { getReaderCountsByBook, getTotalUniqueReaders } from './adminStats';
import { getProductAccessStatus } from './purchaseStatus';
import { getBookContentForUser } from './contentService';
import { getCastingAccessSnapshot } from './raml/castingAccess';
import { MASTER_COUNTING_METHOD_FEATURE, KANZUL_VERIFIED_METHOD_IDS } from '@/lib/access/products';
import { GET as staffGET, POST as staffPOST } from '../../app/api/admin/staff/route';
import { GET as requestsGET } from '../../app/api/admin/payment-requests/route';
import { POST as approvePOST } from '../../app/api/admin/payment-requests/[id]/approve/route';
import { POST as rejectPOST } from '../../app/api/admin/payment-requests/[id]/reject/route';
import { POST as adminLoginPOST } from '../../app/api/admin/login/route';
import { ADMIN_LOGIN_IP_LIMIT } from './rateLimit';

const MASTER = 'master-of-geomancy-vol-1';
const KANZUL = 'kanzul-mikban';

beforeEach(() => {
  db = openDatabase(':memory:');
  current = null;
  breakGlass = false;
});
afterEach(async () => {
  await db.close();
});

async function verifiedUser(email: string): Promise<string> {
  const u = await createAnonymousUser(db, generateSessionToken());
  await attachEmailToUser(db, u.id, email);
  return u.id;
}
async function anonymousUser(): Promise<string> {
  return (await createAnonymousUser(db, generateSessionToken())).id;
}
async function platformAdmin(email = 'admin@example.com'): Promise<string> {
  const id = await verifiedUser(email);
  expect((await grantStaffRole(db, { targetUserId: id, role: 'platform_admin', grantedBy: 'bootstrap' })).ok).toBe(true);
  return id;
}
async function author(email: string, books: string[]): Promise<string> {
  const id = await verifiedUser(email);
  expect((await grantStaffRole(db, { targetUserId: id, role: 'author', grantedBy: 'test' })).ok).toBe(true);
  for (const bookId of books) expect((await assignBookToAuthor(db, { targetUserId: id, bookId, grantedBy: 'test' })).ok).toBe(true);
  return id;
}
async function count(table: string): Promise<number> {
  return Number((await db.queryOne<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`))?.n ?? 0);
}
function post(url: string, body: unknown, origin = 'http://localhost'): Request {
  return new Request(`http://localhost${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body),
  });
}
const signInAs = (id: string, email: string | null = 'x@example.com') => {
  current = { id, email };
};

// ---------------------------------------------------------------------------
describe('customer access is unchanged', () => {
  it('1. a customer without an entitlement is denied every book', async () => {
    const c = await verifiedUser('c@example.com');
    expect(await canAccessForUser(db, c, { kind: 'book', bookId: MASTER })).toBe(false);
    expect(await canAccessForUser(db, c, { kind: 'book', bookId: KANZUL })).toBe(false);
  });

  it('2/3/32. a customer with an entitlement is allowed exactly that product, for the reason "entitlement"', async () => {
    const c = await verifiedUser('c@example.com');
    await grantEntitlement(db, c, KANZUL, 'paystack');
    expect(await resolveAccessForUser(db, c, { kind: 'book', bookId: KANZUL })).toEqual({ allowed: true, reason: 'entitlement' });
    expect(await canAccessForUser(db, c, { kind: 'book', bookId: MASTER })).toBe(false);
    expect(await getProductAccessStatus(db, c, KANZUL)).toBe('active');
  });
});

describe('author access', () => {
  it('4. an author reads their assigned book without buying it (reason "author")', async () => {
    const a = await author('a@example.com', [KANZUL]);
    expect(await resolveAccessForUser(db, a, { kind: 'book', bookId: KANZUL })).toEqual({ allowed: true, reason: 'author' });
    expect(await canAccessForUser(db, a, { kind: 'method', bookId: KANZUL, methodId: KANZUL_VERIFIED_METHOD_IDS[0] })).toBe(true);
    expect((await getBookContentForUser(db, a, KANZUL)).ok).toBe(true);
  });

  it('5. an author with no assignment is denied', async () => {
    const a = await author('a@example.com', []);
    expect(await canAccessForUser(db, a, { kind: 'book', bookId: KANZUL })).toBe(false);
    expect(await canAccessForUser(db, a, { kind: 'book', bookId: MASTER })).toBe(false);
  });

  it('6/22. an author of Book A cannot read Book B — not even through the bundle, nor B’s features or content API', async () => {
    const a = await author('a@example.com', [KANZUL]);
    expect(await canAccessForUser(db, a, { kind: 'book', bookId: MASTER })).toBe(false);
    expect(await canAccessForUser(db, a, { kind: 'feature', featureKey: MASTER_COUNTING_METHOD_FEATURE })).toBe(false);
    expect((await getBookContentForUser(db, a, MASTER)).ok).toBe(false);
    // The bundle grants both books, so it is not part of a one-book author's scope.
    expect(staffGrants(await getStaffAccess(db, a)).some((g) => g.kind === 'book' && g.bookId === MASTER)).toBe(false);
  });

  it('an author of the Master book gets its practice features', async () => {
    const a = await author('m@example.com', [MASTER]);
    expect(await canAccessForUser(db, a, { kind: 'feature', featureKey: MASTER_COUNTING_METHOD_FEATURE })).toBe(true);
    expect(await canAccessForUser(db, a, { kind: 'book', bookId: KANZUL })).toBe(false);
  });

  it('RAML casting: an author can cast every question of their book and none of another (except the free sample)', async () => {
    const a = await author('a@example.com', [KANZUL]);
    const customer = await verifiedUser('c@example.com');
    const mine = await getCastingAccessSnapshot(db, a);
    const theirs = await getCastingAccessSnapshot(db, customer);
    const entries = Object.entries(mine.byIntentionId);
    const kanzulEntries = entries.filter(([, q]) => q.bookId === KANZUL);
    expect(kanzulEntries.length).toBeGreaterThan(0);
    for (const [id, q] of kanzulEntries) {
      expect(q.allowed, id).toBe(true);
    }
    for (const [id, q] of entries.filter(([, q]) => q.bookId === MASTER)) {
      expect(q.allowed, id).toBe(theirs.byIntentionId[id].allowed); // same as a customer: free sample only
    }
  });

  it('10/29. author access creates no entitlement and no payment records, and does not count as a reader or purchase', async () => {
    const a = await author('a@example.com', [KANZUL]);
    const before = { e: await count('entitlements'), pr: await count('payment_requests'), pp: await count('paystack_payments') };
    await canAccessForUser(db, a, { kind: 'book', bookId: KANZUL });
    await getBookContentForUser(db, a, KANZUL);
    await getCastingAccessSnapshot(db, a);
    expect({ e: await count('entitlements'), pr: await count('payment_requests'), pp: await count('paystack_payments') }).toEqual(before);
    expect(await hasEntitlementAccess(db, a, { kind: 'book', bookId: KANZUL })).toBe(false);
    expect(await getProductAccessStatus(db, a, KANZUL)).toBe('none'); // still free to buy; checkout unaffected
    expect((await getReaderCountsByBook(db))[KANZUL] ?? 0).toBe(0);
  });
});

describe('platform admin access', () => {
  it('11/12. a platform admin reads every book, method and feature (reason "platform-admin")', async () => {
    const p = await platformAdmin();
    expect(await resolveAccessForUser(db, p, { kind: 'book', bookId: MASTER })).toEqual({ allowed: true, reason: 'platform-admin' });
    expect(await resolveAccessForUser(db, p, { kind: 'book', bookId: KANZUL })).toEqual({ allowed: true, reason: 'platform-admin' });
    expect(await canAccessForUser(db, p, { kind: 'feature', featureKey: MASTER_COUNTING_METHOD_FEATURE })).toBe(true);
    expect(await canAccessForUser(db, p, { kind: 'method', bookId: KANZUL, methodId: KANZUL_VERIFIED_METHOD_IDS[0] })).toBe(true);
    // ...but not things that do not exist (fail closed).
    expect(await canAccessForUser(db, p, { kind: 'book', bookId: 'no-such-book' })).toBe(false);
  });

  it('13. a platform admin resolves to a platform actor for the dashboard', async () => {
    const p = await platformAdmin();
    expect(await resolveAdminActor(db, p, false)).toMatchObject({ kind: 'platform-admin', userId: p, reviewerId: p });
  });

  it('15. platform-admin reading creates no entitlement and no payment records', async () => {
    const p = await platformAdmin();
    const before = { e: await count('entitlements'), pr: await count('payment_requests'), pp: await count('paystack_payments') };
    await canAccessForUser(db, p, { kind: 'book', bookId: MASTER });
    await getBookContentForUser(db, p, MASTER);
    expect({ e: await count('entitlements'), pr: await count('payment_requests'), pp: await count('paystack_payments') }).toEqual(before);
    expect(await getTotalUniqueReaders(db)).toBe(0);
  });

  it('staff reading never inflates customer reader statistics', async () => {
    for (let i = 0; i < 6; i++) await grantEntitlement(db, await verifiedUser(`r${i}@example.com`), KANZUL, 'paystack');
    const a = await author('a@example.com', [KANZUL]);
    await getBookContentForUser(db, a, KANZUL);
    expect((await getReaderCountsByBook(db))[KANZUL]).toBe(6);
  });
});

describe('revocation is immediate', () => {
  it('16. revoked author role -> denied immediately', async () => {
    const a = await author('a@example.com', [KANZUL]);
    const p = await platformAdmin();
    expect((await revokeStaffRole(db, { targetUserId: a, actingUserId: p })).ok).toBe(true);
    expect(await canAccessForUser(db, a, { kind: 'book', bookId: KANZUL })).toBe(false);
    expect(await resolveAdminActor(db, a, false)).toBeNull();
  });

  it('17. revoked book assignment -> denied for that book', async () => {
    const a = await author('a@example.com', [KANZUL, MASTER]);
    expect((await unassignBookFromAuthor(db, { targetUserId: a, bookId: KANZUL })).ok).toBe(true);
    expect(await canAccessForUser(db, a, { kind: 'book', bookId: KANZUL })).toBe(false);
    expect(await canAccessForUser(db, a, { kind: 'book', bookId: MASTER })).toBe(true);
  });

  it('18. revoked platform-admin role -> no platform access, no admin actor', async () => {
    const p = await platformAdmin();
    const other = await platformAdmin('other@example.com');
    expect((await revokeStaffRole(db, { targetUserId: p, actingUserId: other })).ok).toBe(true);
    expect(await isPlatformAdmin(db, p)).toBe(false);
    expect(await canAccessForUser(db, p, { kind: 'book', bookId: MASTER })).toBe(false);
    expect(await resolveAdminActor(db, p, false)).toBeNull();
  });

  it('a platform admin cannot revoke their own role (no accidental lock-out)', async () => {
    const p = await platformAdmin();
    expect(await revokeStaffRole(db, { targetUserId: p, actingUserId: p })).toEqual({ ok: false, reason: 'cannot-revoke-self' });
  });
});

describe('anonymous users and validation', () => {
  it('19. an anonymous identity can never be granted a role or be found as a staff target', async () => {
    const anon = await anonymousUser();
    expect(await grantStaffRole(db, { targetUserId: anon, role: 'platform_admin', grantedBy: 'test' })).toEqual({ ok: false, reason: 'not-verified' });
    expect(await getStaffRole(db, anon)).toBeNull();
  });

  it('a staff row for a user without a verified email is ignored (fail closed)', async () => {
    const anon = await anonymousUser();
    await db.execute("INSERT INTO staff_roles (user_id, role, granted_at, granted_by) VALUES (?, 'platform_admin', ?, 'tampered')", [anon, new Date().toISOString()]);
    expect(await getStaffRole(db, anon)).toBeNull();
    expect(await canAccessForUser(db, anon, { kind: 'book', bookId: MASTER })).toBe(false);
  });

  it('unknown roles, unknown books and non-authors are refused', async () => {
    const u = await verifiedUser('u@example.com');
    expect(await grantStaffRole(db, { targetUserId: u, role: 'superuser', grantedBy: 't' })).toEqual({ ok: false, reason: 'invalid-role' });
    expect(await assignBookToAuthor(db, { targetUserId: u, bookId: MASTER, grantedBy: 't' })).toEqual({ ok: false, reason: 'not-an-author' });
    await grantStaffRole(db, { targetUserId: u, role: 'author', grantedBy: 't' });
    expect(await assignBookToAuthor(db, { targetUserId: u, bookId: 'invented-book', grantedBy: 't' })).toEqual({ ok: false, reason: 'unknown-book' });
    expect(await isAuthorForBook(db, u, 'invented-book')).toBe(false);
  });

  it('a stray assignment row for an unknown book grants nothing', async () => {
    const a = await author('a@example.com', []);
    await db.execute("INSERT INTO book_staff (book_id, user_id, role, granted_at, granted_by) VALUES ('invented-book', ?, 'author', ?, 'x')", [a, new Date().toISOString()]);
    expect((await getStaffAccess(db, a)).authorBookIds.size).toBe(0);
  });

  it('target lookup never creates users and requires exactly one verified account', async () => {
    expect(await findVerifiedUserByEmail(db, 'ghost@example.com')).toEqual({ ok: false, reason: 'no-verified-user' });
    expect(await count('users')).toBe(0);
    await verifiedUser('dup@example.com');
    await verifiedUser('dup@example.com');
    expect(await findVerifiedUserByEmail(db, 'dup@example.com')).toEqual({ ok: false, reason: 'ambiguous-email' });
  });
});

// ---------------------------------------------------------------------------
describe('admin API authorization (real route handlers)', () => {
  it('B/20. a customer and an anonymous visitor get 403 from every admin API', async () => {
    const c = await verifiedUser('c@example.com');
    for (const who of [null, { id: c, email: 'c@example.com' }]) {
      current = who;
      expect((await staffGET()).status).toBe(403);
      expect((await staffPOST(post('/api/admin/staff', { action: 'grant-role', email: 'c@example.com', role: 'platform_admin' }))).status).toBe(403);
      expect((await requestsGET(new Request('http://localhost/api/admin/payment-requests'))).status).toBe(403);
    }
    expect(await getStaffRole(db, c)).toBeNull();
  });

  it('7/8/24. an author cannot manage staff — not even by submitting role=platform_admin for themselves', async () => {
    const a = await author('a@example.com', [KANZUL]);
    signInAs(a, 'a@example.com');
    const res = await staffPOST(post('/api/admin/staff', { action: 'grant-role', email: 'a@example.com', role: 'platform_admin' }));
    expect(res.status).toBe(403);
    expect(await getStaffRole(db, a)).toBe('author');
    expect((await staffGET()).status).toBe(403);
  });

  it('21/23. an author cannot change another author’s assignment, or extend their own scope, by user/book id', async () => {
    const a = await author('a@example.com', [KANZUL]);
    const b = await author('b@example.com', [MASTER]);
    signInAs(a, 'a@example.com');
    expect((await staffPOST(post('/api/admin/staff', { action: 'unassign-book', userId: b, bookId: MASTER }))).status).toBe(403);
    expect((await staffPOST(post('/api/admin/staff', { action: 'assign-book', userId: a, bookId: MASTER }))).status).toBe(403);
    expect((await staffPOST(post('/api/admin/staff', { action: 'revoke-role', userId: b }))).status).toBe(403);
    expect(await isAuthorForBook(db, b, MASTER)).toBe(true);
    expect(await isAuthorForBook(db, a, MASTER)).toBe(false);
  });

  it('9. an author cannot list, approve or reject payment requests', async () => {
    const customer = await verifiedUser('c@example.com');
    const req = await createPaymentRequest(db, customer, KANZUL, 'REF-1');
    if (!req.ok) throw new Error('setup');
    const a = await author('a@example.com', [KANZUL]);
    signInAs(a, 'a@example.com');
    expect((await requestsGET(new Request('http://localhost/api/admin/payment-requests'))).status).toBe(403);
    expect((await approvePOST(post(`/api/admin/payment-requests/${req.request.id}/approve`, {}), { params: { id: req.request.id } })).status).toBe(403);
    expect((await rejectPOST(post(`/api/admin/payment-requests/${req.request.id}/reject`, {}), { params: { id: req.request.id } })).status).toBe(403);
    expect((await getPaymentRequestById(db, req.request.id))?.status).toBe('pending');
    expect(await count('entitlements')).toBe(0);
  });

  it('14. a platform admin manages staff end to end through the API', async () => {
    const p = await platformAdmin();
    const target = await verifiedUser('new.author@example.com');
    signInAs(p, 'admin@example.com');
    expect((await staffPOST(post('/api/admin/staff', { action: 'grant-role', email: 'New.Author@example.com', role: 'author' }))).status).toBe(200);
    expect((await staffPOST(post('/api/admin/staff', { action: 'assign-book', userId: target, bookId: KANZUL }))).status).toBe(200);
    expect(await canAccessForUser(db, target, { kind: 'book', bookId: KANZUL })).toBe(true);
    const listed = (await (await staffGET()).json()) as { staff: Array<{ email: string; role: string; bookIds: string[] }> };
    expect(listed.staff.find((s) => s.email === 'new.author@example.com')).toMatchObject({ role: 'author', bookIds: [KANZUL] });
    // granted_by is the acting admin, never a client value.
    expect((await db.queryOne<{ granted_by: string }>('SELECT granted_by FROM staff_roles WHERE user_id = ?', [target]))?.granted_by).toBe(p);
    expect((await staffPOST(post('/api/admin/staff', { action: 'assign-book', userId: target, bookId: 'invented' }))).status).toBe(400);
    expect((await staffPOST(post('/api/admin/staff', { action: 'grant-role', email: 'ghost@example.com', role: 'author' }))).status).toBe(404);
  });

  it('a client-supplied grantedBy / role elevation field is ignored', async () => {
    const p = await platformAdmin();
    const target = await verifiedUser('t@example.com');
    signInAs(p, 'admin@example.com');
    await staffPOST(post('/api/admin/staff', { action: 'grant-role', email: 't@example.com', role: 'author', grantedBy: 'someone-else', user_id: p }));
    expect(await db.queryOne('SELECT user_id, role, granted_by FROM staff_roles WHERE user_id = ?', [target])).toEqual({
      user_id: target,
      role: 'author',
      granted_by: p,
    });
  });

  it('admin POSTs from another origin are refused', async () => {
    const p = await platformAdmin();
    signInAs(p, 'admin@example.com');
    expect((await staffPOST(post('/api/admin/staff', { action: 'grant-role', email: 'x@example.com', role: 'author' }, 'https://evil.example'))).status).toBe(403);
  });
});

describe('manual payment approval is preserved', () => {
  it('25/26. a platform admin’s approval grants the STORED request’s product to the STORED user, reviewed_by = that admin', async () => {
    const customer = await verifiedUser('c@example.com');
    const req = await createPaymentRequest(db, customer, KANZUL, 'REF-1');
    if (!req.ok) throw new Error('setup');
    const p = await platformAdmin();
    signInAs(p, 'admin@example.com');
    const res = await approvePOST(post(`/api/admin/payment-requests/${req.request.id}/approve`, { userId: p, productId: MASTER }), {
      params: { id: req.request.id },
    });
    expect(res.status).toBe(200);
    const ents = await db.query<{ user_id: string; product_id: string; source: string }>('SELECT user_id, product_id, source FROM entitlements');
    expect(ents).toEqual([{ user_id: customer, product_id: KANZUL, source: 'manual-payment' }]);
    expect((await getPaymentRequestById(db, req.request.id))?.reviewedBy).toBe(p);
  });

  it('break-glass approval still works and records the historical "admin" reviewer', async () => {
    const customer = await verifiedUser('c@example.com');
    const req = await createPaymentRequest(db, customer, MASTER, 'REF-2');
    if (!req.ok) throw new Error('setup');
    breakGlass = true;
    expect((await approvePOST(post(`/api/admin/payment-requests/${req.request.id}/approve`, {}), { params: { id: req.request.id } })).status).toBe(200);
    expect((await getPaymentRequestById(db, req.request.id))?.reviewedBy).toBe('admin');
    expect(await canAccessForUser(db, customer, { kind: 'book', bookId: MASTER })).toBe(true);
  });

  it('historical approvals with reviewed_by = "admin" remain valid', async () => {
    const customer = await verifiedUser('c@example.com');
    const req = await createPaymentRequest(db, customer, KANZUL, 'REF-3');
    if (!req.ok) throw new Error('setup');
    expect((await approvePaymentRequest(db, req.request.id, 'admin')).ok).toBe(true);
    expect(await canAccessForUser(db, customer, { kind: 'book', bookId: KANZUL })).toBe(true);
  });
});

describe('break-glass transition (legacy shared secret)', () => {
  it('34. the break-glass session still grants platform authority', async () => {
    const token = generateAdminToken();
    await createAdminSession(db, token);
    expect(await isAdminToken(db, token)).toBe(true);
    expect(await resolveAdminActor(db, null, true)).toMatchObject({ kind: 'break-glass', reviewerId: 'admin' });
  });

  it('35. logout revokes the server-side admin session (a copied cookie stops working)', async () => {
    const token = generateAdminToken();
    await createAdminSession(db, token);
    await revokeAdminSession(db, token);
    expect(await isAdminToken(db, token)).toBe(false);
  });

  it('expired break-glass sessions are unusable and removed', async () => {
    const token = generateAdminToken();
    await createAdminSession(db, token);
    await db.execute('UPDATE admin_sessions SET created_at = ?', [new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString()]);
    expect(await isAdminToken(db, token)).toBe(false);
    expect(await count('admin_sessions')).toBe(0);
  });

  it('36. the break-glass login is rate-limited per IP (database-backed), before the secret is compared', async () => {
    const attempt = () =>
      adminLoginPOST(
        new Request('http://localhost/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Origin: 'http://localhost', 'x-forwarded-for': '203.0.113.7' },
          body: JSON.stringify({ secret: 'wrong' }),
        }),
      );
    for (let i = 0; i < ADMIN_LOGIN_IP_LIMIT.maxAttempts; i++) expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(429);
  });

  it('the secret comparison is exact (and fails closed with no secret configured)', () => {
    const saved = process.env.TG_ADMIN_SECRET;
    process.env.TG_ADMIN_SECRET = 'correct horse battery staple';
    expect(verifyAdminSecret('correct horse battery staple')).toBe(true);
    expect(verifyAdminSecret('correct horse battery stapl')).toBe(false);
    expect(verifyAdminSecret('')).toBe(false);
    delete process.env.TG_ADMIN_SECRET;
    expect(verifyAdminSecret('anything')).toBe(false);
    if (saved !== undefined) process.env.TG_ADMIN_SECRET = saved;
  });

  it('an author holding no break-glass session is scoped; with no role at all there is no actor', async () => {
    const a = await author('a@example.com', [KANZUL]);
    expect(await resolveAdminActor(db, a, false)).toEqual({ kind: 'author', userId: a, bookIds: [KANZUL] });
    const c = await verifiedUser('c@example.com');
    expect(await resolveAdminActor(db, c, false)).toBeNull();
    expect(await resolveAdminActor(db, null, false)).toBeNull();
  });

  it('staffAccessReason is null for a customer and for unknown resources', async () => {
    expect(staffAccessReason({ role: null, authorBookIds: new Set() }, { kind: 'book', bookId: MASTER })).toBeNull();
    expect(staffAccessReason({ role: 'platform_admin', authorBookIds: new Set() }, { kind: 'feature', featureKey: 'nope' })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Final review regressions.
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'node_modules' ? [] : sourceFiles(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}
const PRODUCTION_SOURCES = [...sourceFiles('app'), ...sourceFiles('lib'), ...sourceFiles('components')];

describe('review: "verified user" means a user whose email was set by a completed verification', () => {
  it('users.email is written only by completeEmailSignIn (signIn.ts) or identity helpers with no production caller', () => {
    const writers = PRODUCTION_SOURCES.filter((f) => /UPDATE users SET[^;]*\bemail\s*=|INSERT INTO users \([^)]*\bemail\b/.test(readFileSync(f, 'utf-8')));
    expect(writers.sort()).toEqual(['lib/server/auth/signIn.ts', 'lib/server/identity.ts']);
    for (const helper of ['attachEmailToUser(', 'createUserWithEmail(']) {
      const callers = PRODUCTION_SOURCES.filter((f) => f !== 'lib/server/identity.ts' && readFileSync(f, 'utf-8').includes(helper));
      expect(callers, helper).toEqual([]);
    }
  });

  it('completeEmailSignIn only ever runs after a code or magic-link token has been verified and spent', () => {
    const callers = PRODUCTION_SOURCES.filter((f) => f !== 'lib/server/auth/signIn.ts' && readFileSync(f, 'utf-8').includes('completeEmailSignIn('));
    expect(callers.sort()).toEqual(['app/api/auth/verify-code/route.ts', 'lib/server/emailAuth.ts']);
    const code = readFileSync('app/api/auth/verify-code/route.ts', 'utf-8');
    expect(code.indexOf('consumeSignInCode(tx')).toBeLessThan(code.indexOf('completeEmailSignIn(tx'));
    expect(code).toMatch(/if \(!verified\.ok\) return/);
    const link = readFileSync('lib/server/emailAuth.ts', 'utf-8');
    const consume = link.slice(link.indexOf('export async function consumeLoginToken'));
    for (const guard of ["reason: 'not-found'", "reason: 'used'", "reason: 'expired'", 'SET used_at']) {
      expect(consume.indexOf(guard), guard).toBeLessThan(consume.indexOf('completeEmailSignIn(tx'));
    }
  });
});

describe('review: re-activation never duplicates rows', () => {
  it('author -> revoke -> author again: one row, active, no books until assigned again', async () => {
    const p = await platformAdmin();
    const a = await author('a@example.com', [KANZUL]);
    await revokeStaffRole(db, { targetUserId: a, actingUserId: p });
    expect((await grantStaffRole(db, { targetUserId: a, role: 'author', grantedBy: p })).ok).toBe(true);
    expect(await count('staff_roles')).toBe(2);
    expect(await getStaffRole(db, a)).toBe('author');
    expect(await canAccessForUser(db, a, { kind: 'book', bookId: KANZUL })).toBe(false); // old assignment did not come back
  });

  it('platform_admin -> revoke -> platform_admin again: one row, active', async () => {
    const p = await platformAdmin();
    const q = await platformAdmin('q@example.com');
    await revokeStaffRole(db, { targetUserId: q, actingUserId: p });
    expect(await isPlatformAdmin(db, q)).toBe(false);
    await grantStaffRole(db, { targetUserId: q, role: 'platform_admin', grantedBy: p });
    expect(await isPlatformAdmin(db, q)).toBe(true);
    expect(Number((await db.queryOne<{ n: number }>('SELECT COUNT(*) AS n FROM staff_roles WHERE user_id = ?', [q]))?.n)).toBe(1);
  });

  it('author -> platform_admin -> author: assignments end on promotion and do not silently return', async () => {
    const a = await author('a@example.com', [KANZUL]);
    await grantStaffRole(db, { targetUserId: a, role: 'platform_admin', grantedBy: 't' });
    await grantStaffRole(db, { targetUserId: a, role: 'author', grantedBy: 't' });
    expect((await getStaffAccess(db, a)).authorBookIds.size).toBe(0);
  });

  it('assign -> unassign -> assign the same book: the single row is re-activated and access returns', async () => {
    const a = await author('a@example.com', [KANZUL]);
    await unassignBookFromAuthor(db, { targetUserId: a, bookId: KANZUL });
    expect(await canAccessForUser(db, a, { kind: 'book', bookId: KANZUL })).toBe(false);
    expect((await assignBookToAuthor(db, { targetUserId: a, bookId: KANZUL, grantedBy: 't' })).ok).toBe(true);
    expect(await canAccessForUser(db, a, { kind: 'book', bookId: KANZUL })).toBe(true);
    expect(await count('book_staff')).toBe(1);
  });
});

describe('review: casting for platform admins', () => {
  it('a platform admin can cast every question of both books', async () => {
    const p = await platformAdmin();
    const snapshot = await getCastingAccessSnapshot(db, p);
    const owned = Object.entries(snapshot.byIntentionId).filter(([, q]) => q.bookId === MASTER || q.bookId === KANZUL);
    expect(owned.some(([, q]) => q.bookId === MASTER) && owned.some(([, q]) => q.bookId === KANZUL)).toBe(true);
    for (const [id, q] of owned) expect(q.allowed, id).toBe(true);
  });
});

describe('review: first-admin bootstrap is CLI-only and platform_admin-only', () => {
  const BOOTSTRAP = readFileSync('lib/server/db/bootstrapPlatformAdmin.ts', 'utf-8');

  it('is not imported by any app route, page or component (no HTTP path reaches it)', () => {
    const importers = PRODUCTION_SOURCES.filter((f) => f !== 'lib/server/db/bootstrapPlatformAdmin.ts' && /(from|import\()\s*['"][^'"]*bootstrapPlatformAdmin['"]/.test(readFileSync(f, 'utf-8')));
    expect(importers).toEqual([]);
  });

  it('only ever grants the literal platform_admin role, to an existing verified account, and never creates users', () => {
    expect(BOOTSTRAP).toMatch(/grantStaffRole\(db, \{ targetUserId: target\.userId, role: 'platform_admin', grantedBy: 'bootstrap' \}\)/);
    expect(BOOTSTRAP).toMatch(/findVerifiedUserByEmail\(db, email\)/);
    expect(BOOTSTRAP).not.toMatch(/INSERT INTO users|createAnonymousUser|createUserWithEmail|'author'/);
  });

  it('running the bootstrap grant twice leaves exactly one active platform_admin row', async () => {
    const u = await verifiedUser('first.admin@example.com');
    const target = await findVerifiedUserByEmail(db, '  First.Admin@Example.com ');
    expect(target).toMatchObject({ ok: true, userId: u });
    for (let i = 0; i < 2; i++) await grantStaffRole(db, { targetUserId: u, role: 'platform_admin', grantedBy: 'bootstrap' });
    expect(await db.query('SELECT user_id, role, revoked_at FROM staff_roles')).toEqual([{ user_id: u, role: 'platform_admin', revoked_at: null }]);
  });
});
