// Public chapter metadata for The Master of Geomancy, Vol. 1 (Prompt 27 —
// protected-content migration). No prose body text, no Dedication or
// Introduction body — only what navigation, search, and source labels
// need: chapter id, number, title, and kind. The book's own title/
// subtitle and the Dedication/Introduction headings (not their body text)
// are public labels too, kept here rather than duplicated. The full
// chapter bodies, Dedication, and Introduction text now live only in
// lib/server/content/masterOfGeomancy.ts, a server-only module.

export type ChapterKind = "prose" | "stars-directory" | "element-directory" | "sadaqah-directory";

export interface MasterChapterMeta {
  id: string;
  number: number;
  title: string;
  kind: ChapterKind;
}

export const BOOK_TITLE = "The Master of Geomancy";
export const BOOK_SUBTITLE = "Volume 1";
export const DEDICATION_TITLE = "Dedication";
export const INTRODUCTION_TITLE = "What is Geomancy?";

/** The Counting Method's and Cancelling Method's own lead sentences
 * (Chapter 1, body[1]/body[2] in the full server-only content) — the only
 * two sentences of Master of Geomancy's prose exposed to the client, kept
 * here verbatim rather than shipping the full chapter body, because the
 * interactive practice screens (components/books/practice/
 * CountingMethodPractice.tsx, CancellingMethodPractice.tsx) show exactly
 * this one quote each as their own "source" context — the same accepted
 * scope as a single Kanzul Mikban method's own `source.quote` (see
 * lib/access/README.md's content-delivery section). Byte-identical to the
 * server-only source; update both together if the source text is ever
 * corrected. */
export const COUNTING_METHOD_QUOTE =
  "**The Counting Method.** You will make 4 straight lines with dots as shown below.";
export const CANCELLING_METHOD_QUOTE =
  "**The Cancelling Method.** You will make 4 straight lines with dots and start cancelling 2, 2, 2, from your right to the left as shown below.";

export const MASTER_CHAPTER_META: MasterChapterMeta[] = [
  { id: "drawing-a-chart", number: 1, title: "How to Draw a Chart in Geomancy", kind: "prose" },
  { id: "bazdaaho-method", number: 2, title: "The Bazdaaho Method of Arranging the Stars", kind: "prose" },
  { id: "stars-and-symbols", number: 3, title: "The Stars: Their Names, Symbols and Elements", kind: "stars-directory" },
  { id: "stars-in-the-chart", number: 4, title: "The Stars and Their Uses in a Chart", kind: "stars-directory" },
  { id: "element-arrangement", number: 5, title: "Arrangement of the Stars by Element", kind: "element-directory" },
  { id: "knowing-your-buruji", number: 6, title: "Knowing Your Star (Buruji)", kind: "prose" },
  { id: "elements-and-occupations", number: 7, title: "The Four Elements: Stars and Occupations", kind: "element-directory" },
  { id: "spiritual-strength", number: 8, title: "Knowing Your Spiritual Strength", kind: "prose" },
  { id: "causes-of-problems", number: 9, title: "Reasons and Causes of Problems", kind: "prose" },
  { id: "star-sadaqah", number: 10, title: "Every Star and Its Sadaqah", kind: "sadaqah-directory" },
];
