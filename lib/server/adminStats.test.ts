// Prompt 65: tests for the Author Dashboard's read-only aggregate counts.
// Real ':memory:' database per test, real grantEntitlement() calls — never
// a mock of the count logic itself, matching this codebase's established
// pattern (see entitlements.test.ts, paymentRequests.test.ts).
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from './db';
import { getOrCreateUser } from './identity';
import { grantEntitlement, revokeEntitlement } from './entitlements';
import { getReaderCountsByBook, getTotalActiveAccessGrants, getTotalUniqueReaders } from './adminStats';

let db: Db;
afterEach(async () => {
  await db?.close();
});

async function makeUser(): Promise<string> {
  return (await getOrCreateUser(db, null)).user.id;
}

describe('getReaderCountsByBook', () => {
  it('A: zero readers for every book on an empty database', async () => {
    db = openDatabase(':memory:');
    const counts = await getReaderCountsByBook(db);
    expect(counts['master-of-geomancy-vol-1']).toBe(0);
    expect(counts['kanzul-mikban']).toBe(0);
  });

  it('B: a standalone product grant counts as one reader of that book only', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await grantEntitlement(db, userId, 'kanzul-mikban', 'manual-payment');
    const counts = await getReaderCountsByBook(db);
    expect(counts['kanzul-mikban']).toBe(1);
    expect(counts['master-of-geomancy-vol-1']).toBe(0);
  });

  it('C: a bundle grant counts as one reader of BOTH books', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await grantEntitlement(db, userId, 'master-kanzul-bundle', 'manual-payment');
    const counts = await getReaderCountsByBook(db);
    expect(counts['kanzul-mikban']).toBe(1);
    expect(counts['master-of-geomancy-vol-1']).toBe(1);
  });

  it('D: a user who owns Kanzul individually AND is later granted the bundle is still one reader, not two', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await grantEntitlement(db, userId, 'kanzul-mikban', 'manual-payment');
    await grantEntitlement(db, userId, 'master-kanzul-bundle', 'manual-payment');
    const counts = await getReaderCountsByBook(db);
    expect(counts['kanzul-mikban']).toBe(1);
  });

  it('E: a revoked entitlement is never counted as a reader', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    const { entitlement } = await grantEntitlement(db, userId, 'kanzul-mikban', 'manual-payment');
    await revokeEntitlement(db, entitlement.id);
    const counts = await getReaderCountsByBook(db);
    expect(counts['kanzul-mikban']).toBe(0);
  });

  it('F: two different users each grant a separate reader count', async () => {
    db = openDatabase(':memory:');
    const a = await makeUser();
    const b = await makeUser();
    await grantEntitlement(db, a, 'kanzul-mikban', 'manual-payment');
    await grantEntitlement(db, b, 'kanzul-mikban', 'manual-payment');
    const counts = await getReaderCountsByBook(db);
    expect(counts['kanzul-mikban']).toBe(2);
  });
});

describe('getTotalUniqueReaders', () => {
  it('G: a bundle owner counts once across the whole platform, not once per book', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await grantEntitlement(db, userId, 'master-kanzul-bundle', 'manual-payment');
    expect(await getTotalUniqueReaders(db)).toBe(1);
  });

  it('H: readers of different books are both counted', async () => {
    db = openDatabase(':memory:');
    const a = await makeUser();
    const b = await makeUser();
    await grantEntitlement(db, a, 'kanzul-mikban', 'manual-payment');
    await grantEntitlement(db, b, 'master-of-geomancy-vol-1', 'manual-payment');
    expect(await getTotalUniqueReaders(db)).toBe(2);
  });
});

describe('getTotalActiveAccessGrants', () => {
  it('I: counts entitlement rows, not distinct users — a bundle owner is one grant row', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await grantEntitlement(db, userId, 'master-kanzul-bundle', 'manual-payment');
    expect(await getTotalActiveAccessGrants(db)).toBe(1);
  });

  it('J: a user with two separate product grants contributes two rows', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    await grantEntitlement(db, userId, 'kanzul-mikban', 'manual-payment');
    await grantEntitlement(db, userId, 'master-of-geomancy-vol-1', 'manual-payment');
    expect(await getTotalActiveAccessGrants(db)).toBe(2);
  });

  it('K: a revoked grant is excluded from the count', async () => {
    db = openDatabase(':memory:');
    const userId = await makeUser();
    const { entitlement } = await grantEntitlement(db, userId, 'kanzul-mikban', 'manual-payment');
    await revokeEntitlement(db, entitlement.id);
    expect(await getTotalActiveAccessGrants(db)).toBe(0);
  });
});
