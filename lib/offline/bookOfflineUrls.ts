// Which URLs a book actually needs cached to be read and practiced with no
// network access (Prompt 23 — offline-first audit). Deliberately explicit
// per book rather than "cache every link on the page": a reader should
// know exactly what "download this book" means, and the app should never
// cache more than that. Reuses practicableMethodsForChapter — the exact
// same eligibility function the chapter's own "Try this method" CTA already
// uses — so this list can never drift from which methods actually have a
// working practice route.
//
// PROMPT 27 EDIT (protected-content migration) — the one change Phase 12
// explicitly required documenting before making: this file's only import
// of the full Kanzul Mikban content (`KM_CHAPTERS`, with every chapter's
// complete paragraph text) has been swapped for the public metadata-only
// `KM_CHAPTER_META` export. This file never read anything but `.id` from
// that array, so the swap changes nothing about which URLs are generated
// — it only removes the transitive path that was pulling the entire
// protected book text into this module (and, through it, into
// OfflineDownloadControl.tsx's client bundle, since that component is
// 'use client'). public/sw.js and lib/offline/bookCache.ts were NOT
// touched — neither needed to change, and the caching mechanics below are
// unaffected. The generated URL LIST is byte-identical to before.
//
// Also note: the practice route (`/raml/practice/[chapterId]/[methodId]`)
// is, as of Prompt 27, entitlement-gated and rendered per-request rather
// than statically pre-rendered (see that route's own page.tsx) — a
// necessary consequence of protecting method access, not a change made
// here. An unentitled visitor's download attempt against these URLs now
// receives a 401/403, which lib/offline/bookCache.ts's existing
// "only cache a successful (2xx) response" behavior already refuses to
// cache — no change needed there either. See lib/access/README.md's
// offline section for the full reasoning.
import { KM_CHAPTER_META } from '@/content/manuscripts/kanzulMikbanMeta';
import { practicableMethodsForChapter } from '@/lib/raml/methodPractice';

/** Kanzul Mikban's own chapter reader plus every verified method's
 * practice route. */
function kanzulMikbanUrls(): string[] {
  const practiceUrls = KM_CHAPTER_META.flatMap((chapter) =>
    practicableMethodsForChapter(chapter.id).map((m) => `/raml/practice/${chapter.id}/${m.method.id}`),
  );
  return ['/books/kanzul-mikban', '/books/kanzul-mikban/read', ...practiceUrls];
}

/** The Master of Geomancy's chapter reader plus its two foundational
 * casting-method practice routes (Prompt 22) — both fixed URLs. */
function masterOfGeomancyUrls(): string[] {
  const base = '/books/master-of-geomancy-vol-1';
  return [
    base,
    `${base}/read`,
    `${base}/practice/counting-method`,
    `${base}/practice/cancelling-method`,
  ];
}

/** Every URL "Download for offline" should fetch and cache for the given
 * book. Unknown book ids get just their own detail page — never an
 * assumption about content that doesn't exist. */
export function offlineUrlsForBook(bookId: string): string[] {
  if (bookId === 'kanzul-mikban') return kanzulMikbanUrls();
  if (bookId === 'master-of-geomancy-vol-1') return masterOfGeomancyUrls();
  return [`/books/${bookId}`];
}
