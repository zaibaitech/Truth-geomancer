// Which URLs a book actually needs cached to be read and practiced with no
// network access (Prompt 23 — offline-first audit). Deliberately explicit
// per book rather than "cache every link on the page": a reader should
// know exactly what "download this book" means, and the app should never
// cache more than that. Reuses practicableMethodsForChapter — the exact
// same eligibility function the chapter's own "Try this method" CTA already
// uses — so this list can never drift from which methods actually have a
// working practice route.
import { KM_CHAPTERS } from '@/content/manuscripts/kanzul-mikban';
import { practicableMethodsForChapter } from '@/lib/raml/methodPractice';

/** Kanzul Mikban's own chapter reader plus every verified method's practice
 * route (now statically generated — see app/raml/practice/[chapterId]/
 * [methodId]/page.tsx — so each of these is a fixed, known URL, never a
 * dynamically-rendered one a service worker could serve for the wrong
 * chapter/method pair). */
function kanzulMikbanUrls(): string[] {
  const practiceUrls = KM_CHAPTERS.flatMap((chapter) =>
    practicableMethodsForChapter(chapter.id).map((m) => `/raml/practice/${chapter.id}/${m.method.id}`),
  );
  return ['/books/kanzul-mikban', '/books/kanzul-mikban/read', ...practiceUrls];
}

/** The Master of Geomancy's chapter reader plus its two foundational
 * casting-method practice routes (Prompt 22) — both static, fixed URLs. */
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
