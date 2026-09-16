// Server-only protected content service (Prompt 27 — protected book
// content delivery). This is the ONE place the actual, complete book text
// should ever be read from for a real request. It composes three things
// that already exist and are already tested, duplicating none of them:
//   - the public book/chapter metadata (content/books.ts, the *Meta.ts
//     files) for anything that should be visible to everyone,
//   - lib/server/session.ts + lib/server/accessService.ts for identity and
//     the authoritative access decision (itself just canAccess() from
//     lib/access/access.ts),
//   - the relocated, server-only full chapter text (lib/server/content/).
//
// No access RULE is invented here — getChapterForUser only ever asks
// canAccessForUser() the same book/method questions any other caller
// would, then either returns the real content or a plain, honest refusal.
import { createHash } from 'node:crypto';
import { BOOKS, getBookById, type Book } from '@/content/books';
import { KM_CHAPTER_META, type KmChapterMeta } from '@/content/manuscripts/kanzulMikbanMeta';
import { MASTER_CHAPTER_META, type MasterChapterMeta } from '@/content/manuscripts/masterOfGeomancyMeta';
import { KM_CHAPTERS, type KmChapter } from './content/kanzulMikban';
import { CHAPTERS as MASTER_CHAPTERS, DEDICATION, INTRODUCTION, type Chapter as MasterChapter } from './content/masterOfGeomancy';
import { canAccessForUser } from './accessService';
import type { Db } from './db';

/** Public book metadata — id, title, author, description, chapter count,
 * price display, status. Never includes chapter text. Safe for any
 * caller, authenticated or not. */
export function getBookMetadata(bookId: string): Book | null {
  return getBookById(bookId) ?? null;
}

export function listAllBooks(): Book[] {
  return BOOKS;
}

/** Public chapter list — id, number, title (Master also carries `kind`).
 * Never includes chapter/paragraph body text. Safe for any caller. */
export function listBookChapters(bookId: string): (KmChapterMeta | MasterChapterMeta)[] {
  if (bookId === 'kanzul-mikban') return KM_CHAPTER_META;
  if (bookId === 'master-of-geomancy-vol-1') return MASTER_CHAPTER_META;
  return [];
}

/** The product id a book's entitlement is checked against. Standalone
 * today (one product per book); kept as its own function because a future
 * catalogue change (e.g. a book folded into a different product) should
 * only ever need to change this one mapping, not every call site. */
function productIdForBook(bookId: string): string | null {
  if (bookId === 'kanzul-mikban' || bookId === 'master-of-geomancy-vol-1') return bookId;
  return null;
}

export type ChapterContentResult =
  | { ok: true; bookId: string; chapterId: string; chapter: unknown }
  | { ok: false; reason: 'unknown-book' | 'unknown-chapter' | 'unauthorized' };

/**
 * The one function that returns real, protected chapter content. Never
 * trusts a caller-supplied user id or access flag — `userId` must already
 * have been resolved server-side (see session.ts) before this is called,
 * and the actual decision is delegated entirely to `canAccessForUser()`
 * (itself just `canAccess()` from lib/access/access.ts, Prompt 25 —
 * unmodified, no duplicated rule here).
 *
 * Returns a discriminated result rather than throwing or returning `null`
 * for every failure alike, so a caller (the reader page, the route
 * handler) can distinguish "this book/chapter doesn't exist" (404) from
 * "it exists but you're not entitled" (403) without inspecting error
 * messages — and so neither path can accidentally leak protected text in
 * an error string.
 */
export async function getChapterForUser(db: Db, userId: string, bookId: string, chapterId: string): Promise<ChapterContentResult> {
  const productId = productIdForBook(bookId);
  if (!productId) return { ok: false, reason: 'unknown-book' };

  if (bookId === 'kanzul-mikban') {
    const chapter = KM_CHAPTERS.find((c) => c.id === chapterId);
    if (!chapter) return { ok: false, reason: 'unknown-chapter' };
    if (!(await canAccessForUser(db, userId, { kind: 'book', bookId }))) return { ok: false, reason: 'unauthorized' };
    return { ok: true, bookId, chapterId, chapter };
  }

  if (bookId === 'master-of-geomancy-vol-1') {
    const chapter = MASTER_CHAPTERS.find((c) => c.id === chapterId);
    if (!chapter) return { ok: false, reason: 'unknown-chapter' };
    if (!(await canAccessForUser(db, userId, { kind: 'book', bookId }))) return { ok: false, reason: 'unauthorized' };
    return { ok: true, bookId, chapterId, chapter };
  }

  return { ok: false, reason: 'unknown-book' };
}

// ---------------------------------------------------------------------------
// Content versioning (Prompt 30, Phase 7) — deterministic, never random.
// A plain SHA-256 hash of the actual protected content, computed once at
// module load: the version changes automatically and exactly when the
// underlying text changes (a real edit to kanzulMikban.ts/
// masterOfGeomancy.ts), and stays byte-identical across restarts/
// deployments otherwise. No git commit hash, timestamp, or filesystem path
// is used — nothing here leaks server/repo internals, only a content
// fingerprint the client can compare against what it has cached.
// ---------------------------------------------------------------------------
function contentVersion(data: unknown): string {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 12);
}

const KANZUL_CONTENT_VERSION = contentVersion(KM_CHAPTERS);
const MASTER_CONTENT_VERSION = contentVersion({ DEDICATION, INTRODUCTION, MASTER_CHAPTERS });

export type BookOfflineContentResult =
  | {
      ok: true;
      bookId: string;
      contentVersion: string;
      dedicationTitle?: string;
      dedication?: string;
      introductionTitle?: string;
      introduction?: string[];
      chapters: KmChapter[] | MasterChapter[];
    }
  | { ok: false; reason: 'unknown-book' | 'unauthorized' };

/**
 * The whole-book counterpart to getChapterForUser() (Prompt 30, Phase 5/6)
 * — same access rule (canAccessForUser(), never duplicated), same
 * server-only content source (KM_CHAPTERS/MASTER_CHAPTERS, never copied
 * elsewhere), just returning every chapter in one authorized response
 * instead of one at a time, for the explicit "Download for offline" action.
 */
export async function getBookContentForUser(db: Db, userId: string, bookId: string): Promise<BookOfflineContentResult> {
  const productId = productIdForBook(bookId);
  if (!productId) return { ok: false, reason: 'unknown-book' };
  if (!(await canAccessForUser(db, userId, { kind: 'book', bookId }))) return { ok: false, reason: 'unauthorized' };

  if (bookId === 'kanzul-mikban') {
    return { ok: true, bookId, contentVersion: KANZUL_CONTENT_VERSION, chapters: KM_CHAPTERS };
  }

  // bookId === 'master-of-geomancy-vol-1'
  return {
    ok: true,
    bookId,
    contentVersion: MASTER_CONTENT_VERSION,
    dedicationTitle: 'Dedication',
    dedication: DEDICATION,
    introductionTitle: 'What is Geomancy?',
    introduction: INTRODUCTION,
    chapters: MASTER_CHAPTERS,
  };
}

export type BookOpeningResult =
  | { ok: true; dedicationTitle: string; dedication: string; introductionTitle: string; introduction: string[] }
  | { ok: false; reason: 'unauthorized' };

/** The Master of Geomancy's Dedication and Introduction — not chapters,
 * but still protected book text — gated the same way as any chapter. */
export async function getMasterOpeningForUser(db: Db, userId: string): Promise<BookOpeningResult> {
  if (!(await canAccessForUser(db, userId, { kind: 'book', bookId: 'master-of-geomancy-vol-1' }))) {
    return { ok: false, reason: 'unauthorized' };
  }
  return {
    ok: true,
    dedicationTitle: 'Dedication',
    dedication: DEDICATION,
    introductionTitle: 'What is Geomancy?',
    introduction: INTRODUCTION,
  };
}
