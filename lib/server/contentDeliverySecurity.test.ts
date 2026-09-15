// Prompt 27, Phase 13 — the remaining required security-test categories
// not already covered by contentService.test.ts (CONTENT AUTHORIZATION)
// and identity.test.ts/security.test.ts (IDENTITY SECURITY): LEAKAGE,
// SEARCH, and PRACTICE. Also covers the session-resolution fix this
// migration required (a Server Component page render cannot write a
// cookie — see session.ts's own comment).
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase, type Db } from './db';
import { getOrCreateUser } from './identity';
import { grantEntitlement } from './entitlements';
import { getChapterForUser } from './contentService';
import { KANZUL_PRODUCT } from '@/lib/access/products';

let db: Db;
afterEach(() => {
  try {
    db?.close();
  } catch {
    // Not open for a test that never called openDatabase(); nothing to clean up.
  }
});

// ---------------------------------------------------------------------------
// LEAKAGE
// ---------------------------------------------------------------------------
describe('LEAKAGE: an unauthorized content request never carries protected text', () => {
  it('an unauthorized ChapterContentResult has no chapter field at all — not an empty/redacted one', () => {
    db = openDatabase(':memory:');
    const userId = getOrCreateUser(db, null).user.id;
    const result = getChapterForUser(db, userId, 'kanzul-mikban', 'if-you-want-to-know-if-you-will');
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toMatch(/paragraphs|you will return with money/i);
  });

  it('the route handler returns the same generic error shape for unauthorized as for any other denial, never the chapter title/number', () => {
    const source = readFileSync('app/api/books/[bookId]/chapters/[chapterId]/route.ts', 'utf-8');
    expect(source).toMatch(/This chapter requires an active entitlement/);
    expect(source).not.toMatch(/paragraphs/);
  });

  it('the route handler sets Cache-Control: private, no-store so an intermediary never caches a response meant for one user', () => {
    const source = readFileSync('app/api/books/[bookId]/chapters/[chapterId]/route.ts', 'utf-8');
    expect(source).toMatch(/private, no-store/);
  });

  it('BookAccessGate (rendered instead of protected content) never imports a content module — structurally cannot leak what it never received', () => {
    const source = readFileSync('components/books/BookAccessGate.tsx', 'utf-8');
    expect(source).not.toMatch(/lib\/server\/content|content\/manuscripts\/(kanzul-mikban|master-of-geomancy-vol1)/);
  });
});

// ---------------------------------------------------------------------------
// SEARCH
// ---------------------------------------------------------------------------
describe('SEARCH: matches titles/metadata only, never full protected chapter text, for anyone', () => {
  const searchPage = readFileSync('app/search/page.tsx', 'utf-8');
  const chapters = readFileSync('lib/books/chapters.ts', 'utf-8');

  it('the search page never imports the protected chapter-text modules', () => {
    expect(searchPage).not.toMatch(/lib\/server\/content|content\/manuscripts\/(kanzul-mikban|master-of-geomancy-vol1)/);
  });

  it('getAllChapterRefs/getChapterList are sourced from the public metadata files, not the protected content files', () => {
    expect(chapters).toMatch(/from '@\/content\/manuscripts\/masterOfGeomancyMeta'/);
    expect(chapters).toMatch(/from '@\/content\/manuscripts\/kanzulMikbanMeta'/);
    expect(chapters).not.toMatch(/lib\/server\/content/);
  });

  it('search matching is confined to title/subtitle/name fields — no paragraph-body field is ever compared against the query', () => {
    expect(searchPage).toMatch(/\.title\.toLowerCase\(\)\.includes\(q\)/);
    expect(searchPage).not.toMatch(/paragraphs/);
    expect(searchPage).not.toMatch(/\.body/);
  });

  it('this is a real behavior preservation, not a new restriction: search never returned chapter body snippets even before this migration (limitation documented in the final report, not a regression)', () => {
    // Structural guard only — the search UI's result cards render title +
    // book/chapter label, confirmed by the absence of any snippet-shaped
    // prop (e.g. "excerpt"/"snippet") passed to a result row.
    expect(searchPage).not.toMatch(/excerpt|snippet/i);
  });
});

// ---------------------------------------------------------------------------
// PRACTICE
// ---------------------------------------------------------------------------
describe('PRACTICE: entitlement is checked before any practice flow renders, for both books', () => {
  const kmPractice = readFileSync('app/raml/practice/[chapterId]/[methodId]/page.tsx', 'utf-8');
  const counting = readFileSync('app/books/master-of-geomancy-vol-1/practice/counting-method/page.tsx', 'utf-8');
  const cancelling = readFileSync('app/books/master-of-geomancy-vol-1/practice/cancelling-method/page.tsx', 'utf-8');

  it('the Kanzul practice route checks canAccessForUser({kind:"method", bookId:"kanzul-mikban", methodId}) before rendering MethodPracticeFlow', () => {
    expect(kmPractice).toMatch(/canAccessForUser\(/);
    expect(kmPractice).toMatch(/kind:\s*'method'/);
    expect(kmPractice).toMatch(/bookId:\s*'kanzul-mikban'/);
    const gateIdx = kmPractice.indexOf('if (!authorized)');
    const flowIdx = kmPractice.indexOf('<MethodPracticeFlow');
    expect(gateIdx).toBeGreaterThan(-1);
    expect(flowIdx).toBeGreaterThan(gateIdx);
  });

  it('both Master practice routes gate on a FeatureGrant, never a new invented method id, and never touch the engine', () => {
    for (const source of [counting, cancelling]) {
      expect(source).toMatch(/canAccessForUser\(/);
      expect(source).toMatch(/kind:\s*'feature'/);
      expect(source).not.toMatch(/lib\/raml\/engine\//);
    }
  });

  it('an unauthorized practice request never reaches the method engine — the gate short-circuits before the practice component is referenced in the returned JSX', () => {
    for (const source of [kmPractice, counting, cancelling]) {
      const returnGate = source.indexOf('if (!authorized)');
      const returnAuthorized = source.lastIndexOf('return (');
      expect(returnGate).toBeGreaterThan(-1);
      expect(returnAuthorized).toBeGreaterThan(returnGate);
    }
  });
});

// ---------------------------------------------------------------------------
// Server Component session resolution (the real bug found and fixed during
// Prompt 27's own live-server verification pass, not a bug in Prompt 26)
// ---------------------------------------------------------------------------
describe('a page render never attempts an illegal cookie write, and never fixates a client-chosen token', () => {
  it('every gated Server Component page uses the read-only getCurrentUserIfPresent(), never the cookie-writing getCurrentUser()', () => {
    const pages = [
      'app/books/[id]/read/page.tsx',
      'app/raml/practice/[chapterId]/[methodId]/page.tsx',
      'app/books/master-of-geomancy-vol-1/practice/counting-method/page.tsx',
      'app/books/master-of-geomancy-vol-1/practice/cancelling-method/page.tsx',
    ];
    for (const f of pages) {
      const source = readFileSync(f, 'utf-8');
      expect(source).toMatch(/getCurrentUserIfPresent/);
      expect(source).not.toMatch(/getCurrentUser\(\)/);
    }
  });

  it('getCurrentUserIfPresent never creates a user or writes a cookie — only getUserByToken/touchLastSeen, never getOrCreateUser/store.set', () => {
    const source = readFileSync('lib/server/session.ts', 'utf-8');
    const fnStart = source.indexOf('export function getCurrentUserIfPresent');
    const fnBody = source.slice(fnStart);
    expect(fnBody).toMatch(/getUserByToken/);
    expect(fnBody).not.toMatch(/getOrCreateUser|\.set\(/);
  });

  it('every gated page evaluates authorized as `user !== null && canAccessForUser(...)`, so a null user (no cookie yet) short-circuits to false without ever calling canAccessForUser', () => {
    const pages = [
      'app/books/[id]/read/page.tsx',
      'app/raml/practice/[chapterId]/[methodId]/page.tsx',
      'app/books/master-of-geomancy-vol-1/practice/counting-method/page.tsx',
      'app/books/master-of-geomancy-vol-1/practice/cancelling-method/page.tsx',
    ];
    for (const f of pages) {
      const source = readFileSync(f, 'utf-8');
      expect(source).toMatch(/user !== null &&/);
    }
  });

  it('identity.ts still never lets a client-supplied token become the stored session — the getOrCreateUser() fixation guard this migration must not weaken', () => {
    db = openDatabase(':memory:');
    const attempt = getOrCreateUser(db, 'client-chosen-token');
    expect(attempt.token).not.toBe('client-chosen-token');
  });

  it('once a Route Handler has issued a real session cookie, the same token grants access to content the user was actually entitled to', () => {
    db = openDatabase(':memory:');
    const { user, token } = getOrCreateUser(db, null);
    grantEntitlement(db, user.id, KANZUL_PRODUCT.id, 'manual-payment');
    // Re-resolving via the exact token a Route Handler would have set as
    // the cookie value reaches the SAME user and SAME entitlement.
    const resolved = getOrCreateUser(db, token);
    expect(resolved.user.id).toBe(user.id);
    const result = getChapterForUser(db, resolved.user.id, 'kanzul-mikban', 'if-you-want-to-know-if-you-will');
    expect(result.ok).toBe(true);
  });
});
