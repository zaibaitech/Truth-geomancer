// Content transcribed and adapted from "The Master of Geomancy, Volume 1"
// (Ilm al-Raml / Ilm al-Khatt), Chapters 3, 4, 5, 7 and 10.
// Star = the traditional 16 geomantic figures, each a stack of 4 lines
// where every line reduces to either one dot (odd) or two dots (even).

export type DotRow = 1 | 2;
export type Pattern = [DotRow, DotRow, DotRow, DotRow];
export type Element = 'fire' | 'air' | 'water' | 'sand';

export interface Star {
  id: string;
  number: number; // 1-16, Bazdaaho arrangement order (Yussif -> Musah)
  name: string;
  pattern: Pattern; // top line to bottom line
  element: Element;
}

// PUBLIC MODULE (reachable from client code). It holds only the free figure basics: id, number, name,
// pattern and element. All paid per-star content lives in lib/server/content/starNotes.ts and is delivered
// only after an entitlement check. Do not add other fields here: lib/raml/starsPublicModule.test.ts and the
// build leak guards fail if any appear.
export const ELEMENT_LABEL: Record<Element, string> = {
  fire: 'Fire',
  air: 'Air',
  water: 'Water',
  sand: 'Sand / Earth',
};

export const STARS: Star[] = [
  { id: "yussif", number: 1, name: "Yussif", pattern: [1, 1, 2, 1], element: "fire" },
  { id: "adam", number: 2, name: "Adam", pattern: [1, 2, 2, 2], element: "fire" },
  { id: "mahadi", number: 3, name: "Mahadi", pattern: [2, 1, 1, 1], element: "air" },
  { id: "iddris", number: 4, name: "Iddris", pattern: [2, 2, 1, 2], element: "water" },
  { id: "ibrahim", number: 5, name: "Ibrahim", pattern: [1, 1, 1, 1], element: "water" },
  { id: "issah", number: 6, name: "Issah", pattern: [1, 2, 1, 2], element: "water" },
  { id: "umar", number: 7, name: "Umar", pattern: [2, 1, 2, 2], element: "air" },
  { id: "ayuba", number: 8, name: "Ayuba", pattern: [2, 2, 2, 1], element: "sand" },
  { id: "kalla-allahu", number: 9, name: "Kalla Allahu", pattern: [1, 1, 2, 2], element: "fire" },
  { id: "sulemana", number: 10, name: "Sulemana", pattern: [1, 2, 2, 1], element: "sand" },
  { id: "ali", number: 11, name: "Ali", pattern: [2, 1, 1, 2], element: "air" },
  { id: "nuhu", number: 12, name: "Nuhu", pattern: [2, 2, 1, 1], element: "air" },
  { id: "hassan-hussein", number: 13, name: "Hassan & Hussein", pattern: [1, 1, 1, 2], element: "water" },
  { id: "yunus", number: 14, name: "Yunus", pattern: [1, 2, 1, 1], element: "sand" },
  { id: "usman", number: 15, name: "Usman", pattern: [2, 1, 2, 1], element: "sand" },
  { id: "musah", number: 16, name: "Musah", pattern: [2, 2, 2, 2], element: "fire" },
];

export function getStarById(id: string): Star | undefined {
  return STARS.find((s) => s.id === id);
}

export function getStarByPattern(pattern: Pattern): Star {
  const match = STARS.find((s) => s.pattern.every((v, i) => v === pattern[i]));
  if (!match) throw new Error(`No star matches pattern ${pattern.join('')}`);
  return match;
}
