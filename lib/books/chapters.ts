import { CHAPTERS as VOL1_CHAPTERS } from '@/content/manuscripts/master-of-geomancy-vol1';
import { KM_CHAPTERS } from '@/content/manuscripts/kanzul-mikban';

export interface ChapterNavItem {
  id: string;
  number: number | null;
  title: string;
}

/** Ordered chapter list for a book, normalized for contents/prev-next nav. */
export function getChapterList(bookId: string): ChapterNavItem[] {
  if (bookId === 'master-of-geomancy-vol-1') {
    return VOL1_CHAPTERS.map((c) => ({ id: c.id, number: c.number, title: c.title }));
  }
  if (bookId === 'kanzul-mikban') {
    return KM_CHAPTERS.map((c) => ({ id: c.id, number: c.number, title: c.title }));
  }
  return [];
}

export function getAllChapterRefs(): { bookId: string; id: string; number: number | null; title: string }[] {
  return [
    ...VOL1_CHAPTERS.map((c) => ({ bookId: 'master-of-geomancy-vol-1', id: c.id, number: c.number, title: c.title })),
    ...KM_CHAPTERS.map((c) => ({ bookId: 'kanzul-mikban', id: c.id, number: c.number, title: c.title })),
  ];
}
