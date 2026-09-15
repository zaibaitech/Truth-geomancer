// Prompt 27 (protected-content migration): sourced from the public
// metadata files, not the full manuscript content — this module only
// ever projected id/number/title anyway, so switching sources changes
// nothing about its output, only removes an unnecessary transitive
// dependency on the protected chapter text from every client-reachable
// caller (e.g. app/search/page.tsx).
import { MASTER_CHAPTER_META } from '@/content/manuscripts/masterOfGeomancyMeta';
import { KM_CHAPTER_META } from '@/content/manuscripts/kanzulMikbanMeta';

export interface ChapterNavItem {
  id: string;
  number: number | null;
  title: string;
}

/** Ordered chapter list for a book, normalized for contents/prev-next nav. */
export function getChapterList(bookId: string): ChapterNavItem[] {
  if (bookId === 'master-of-geomancy-vol-1') {
    return MASTER_CHAPTER_META.map((c) => ({ id: c.id, number: c.number, title: c.title }));
  }
  if (bookId === 'kanzul-mikban') {
    return KM_CHAPTER_META.map((c) => ({ id: c.id, number: c.number, title: c.title }));
  }
  return [];
}

export function getAllChapterRefs(): { bookId: string; id: string; number: number | null; title: string }[] {
  return [
    ...MASTER_CHAPTER_META.map((c) => ({ bookId: 'master-of-geomancy-vol-1', id: c.id, number: c.number, title: c.title })),
    ...KM_CHAPTER_META.map((c) => ({ bookId: 'kanzul-mikban', id: c.id, number: c.number, title: c.title })),
  ];
}
