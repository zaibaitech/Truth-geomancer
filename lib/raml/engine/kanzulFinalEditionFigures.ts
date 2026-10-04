// Prompt (Final Edition) — figure lists restored from the author-confirmed FINAL
// Kanzul Mikban edition (docs/Kanzul-Mikban-Final-Edition.pdf).
//
// GENERATED FROM THE PDF, NOT HAND-TYPED: every list was extracted from the
// edition's embedded figure images. The PDF contains 16 unique figure images;
// each was decoded to its four-row dot pattern (top row first, the same order
// as `Pattern` in content/stars.ts) by counting dots per row, calibrated on
// the edition's own page-3 example ("even, odd, odd, even" = 2112), and then
// matched to a canonical STARS id by exact pattern equality. No figure was
// identified by name. `kanzul-final-edition-figures.test.ts` re-checks that
// every pattern here still equals the canonical STARS pattern for its id.
//
// Method-specific source mappings (e.g. chapter 27/36's explicit element
// lists) live here and DO NOT alter content/stars.ts.

import type { RestoredFigure } from './kanzulRestoredFigures';

export interface FigureList {
  chapterNumber: number;
  houses: number[];
  condition: string;
  figures: RestoredFigure[];
}

export interface OutcomeTable {
  chapterNumber: number;
  houses: number[];
  entries: { figures: RestoredFigure[]; text: string }[];
}

export const idsOf = (l: FigureList): string[] => l.figures.map((f) => f.starId);

export const CH4_H10_SUCCESS: FigureList = {
  chapterNumber: 4,
  houses: [10],
  condition: "you will be successful in your search",
  figures: [
      { order: 1, pattern: [2, 1, 2, 1], starId: 'usman' },
      { order: 2, pattern: [2, 1, 1, 1], starId: 'mahadi' },
      { order: 3, pattern: [2, 2, 1, 2], starId: 'iddris' },
      { order: 4, pattern: [2, 2, 1, 1], starId: 'nuhu' },
      { order: 5, pattern: [1, 2, 2, 1], starId: 'sulemana' },
      { order: 6, pattern: [2, 2, 2, 1], starId: 'ayuba' },
      { order: 7, pattern: [1, 2, 1, 1], starId: 'yunus' },
    ],
};

export const CH9_H6_HEALED: FigureList = {
  chapterNumber: 9,
  houses: [6],
  condition: "he/she will be healed",
  figures: [
      { order: 1, pattern: [2, 2, 1, 2], starId: 'iddris' },
      { order: 2, pattern: [1, 2, 2, 2], starId: 'adam' },
      { order: 3, pattern: [1, 1, 2, 2], starId: 'kalla-allahu' },
      { order: 4, pattern: [1, 1, 2, 1], starId: 'yussif' },
      { order: 5, pattern: [2, 1, 2, 2], starId: 'umar' },
      { order: 6, pattern: [1, 2, 1, 2], starId: 'issah' },
    ],
};

export const CH9_H6_DIFFICULT_TO_SURVIVE: FigureList = {
  chapterNumber: 9,
  houses: [6],
  condition: "it will be difficult for him/her to survive",
  figures: [
      { order: 1, pattern: [1, 1, 1, 1], starId: 'ibrahim' },
      { order: 2, pattern: [2, 2, 2, 1], starId: 'ayuba' },
      { order: 3, pattern: [2, 1, 1, 2], starId: 'ali' },
      { order: 4, pattern: [2, 2, 2, 2], starId: 'musah' },
    ],
};

export const CH17_M1_LIST: FigureList = {
  chapterNumber: 17,
  houses: [1, 6, 4, 16],
  condition: "it will happen within an hour, or a day, or 1-10 days",
  figures: [
      { order: 1, pattern: [2, 1, 1, 2], starId: 'ali' },
      { order: 2, pattern: [2, 2, 1, 1], starId: 'nuhu' },
      { order: 3, pattern: [2, 1, 2, 2], starId: 'umar' },
      { order: 4, pattern: [1, 2, 1, 2], starId: 'issah' },
      { order: 5, pattern: [2, 1, 1, 1], starId: 'mahadi' },
      { order: 6, pattern: [1, 2, 2, 2], starId: 'adam' },
      { order: 7, pattern: [1, 1, 2, 1], starId: 'yussif' },
    ],
};

export const CH17_M2_FAST: FigureList = {
  chapterNumber: 17,
  houses: [1, 13, 4, 12, 7, 10, 15, 16],
  condition: "very fast (first four houses) / within 7 days (found in the chart)",
  figures: [
      { order: 1, pattern: [2, 2, 2, 1], starId: 'ayuba' },
      { order: 2, pattern: [2, 1, 2, 2], starId: 'umar' },
      { order: 3, pattern: [1, 2, 1, 2], starId: 'issah' },
      { order: 4, pattern: [1, 1, 1, 1], starId: 'ibrahim' },
      { order: 5, pattern: [2, 2, 1, 2], starId: 'iddris' },
      { order: 6, pattern: [2, 1, 1, 1], starId: 'mahadi' },
      { order: 7, pattern: [1, 2, 2, 2], starId: 'adam' },
      { order: 8, pattern: [1, 1, 2, 1], starId: 'yussif' },
    ],
};

export const CH17_M2_SLOW: FigureList = {
  chapterNumber: 17,
  houses: [1, 13, 4, 12, 7, 10, 15, 16],
  condition: "within a month or a year",
  figures: [
      { order: 1, pattern: [1, 1, 2, 2], starId: 'kalla-allahu' },
      { order: 2, pattern: [1, 2, 2, 1], starId: 'sulemana' },
      { order: 3, pattern: [2, 1, 1, 2], starId: 'ali' },
      { order: 4, pattern: [2, 2, 1, 1], starId: 'nuhu' },
      { order: 5, pattern: [1, 1, 1, 2], starId: 'hassan-hussein' },
      { order: 6, pattern: [1, 2, 1, 1], starId: 'yunus' },
      { order: 7, pattern: [2, 1, 2, 1], starId: 'usman' },
      { order: 8, pattern: [2, 2, 2, 2], starId: 'musah' },
    ],
};

export const CH19_M3_LIST: FigureList = {
  chapterNumber: 19,
  houses: [4, 10, 5, 11],
  condition: "win if found in h4/h10; lose if found in h5/h11",
  figures: [
      { order: 1, pattern: [2, 1, 1, 1], starId: 'mahadi' },
      { order: 2, pattern: [2, 1, 2, 2], starId: 'umar' },
      { order: 3, pattern: [1, 2, 2, 2], starId: 'adam' },
      { order: 4, pattern: [2, 2, 2, 2], starId: 'musah' },
    ],
};

export const CH21_M3_YES: FigureList = {
  chapterNumber: 21,
  houses: [7],
  condition: "she does / he does have sex",
  figures: [
      { order: 1, pattern: [2, 1, 2, 1], starId: 'usman' },
      { order: 2, pattern: [2, 2, 1, 1], starId: 'nuhu' },
      { order: 3, pattern: [2, 1, 1, 1], starId: 'mahadi' },
      { order: 4, pattern: [2, 2, 2, 1], starId: 'ayuba' },
    ],
};

export const CH21_M3_NO: FigureList = {
  chapterNumber: 21,
  houses: [7],
  condition: "she didn't",
  figures: [
      { order: 1, pattern: [1, 2, 1, 2], starId: 'issah' },
      { order: 2, pattern: [1, 1, 2, 2], starId: 'kalla-allahu' },
      { order: 3, pattern: [1, 1, 1, 2], starId: 'hassan-hussein' },
      { order: 4, pattern: [1, 2, 2, 2], starId: 'adam' },
    ],
};

export const CH30_HASSAN_HUSSEIN: FigureList = {
  chapterNumber: 30,
  houses: [],
  condition: "a lot of profit but not stable",
  figures: [
      { order: 1, pattern: [1, 1, 1, 2], starId: 'hassan-hussein' },
    ],
};

export const CH30_ISSAH: FigureList = {
  chapterNumber: 30,
  houses: [],
  condition: "a lot of money and benefits but very sick",
  figures: [
      { order: 1, pattern: [1, 2, 1, 2], starId: 'issah' },
    ],
};

export const CH102_STABLE: FigureList = {
  chapterNumber: 102,
  houses: [1, 2, 3, 4],
  condition: "it will be stable",
  figures: [
      { order: 1, pattern: [1, 2, 2, 2], starId: 'adam' },
      { order: 2, pattern: [1, 1, 2, 2], starId: 'kalla-allahu' },
      { order: 3, pattern: [2, 2, 1, 1], starId: 'nuhu' },
      { order: 4, pattern: [2, 1, 1, 1], starId: 'mahadi' },
      { order: 5, pattern: [2, 1, 1, 2], starId: 'ali' },
    ],
};

export const CH124_M1_STOLEN: FigureList = {
  chapterNumber: 124,
  houses: [],
  condition: "it is true - it has been stolen",
  figures: [
      { order: 1, pattern: [2, 1, 2, 2], starId: 'umar' },
      { order: 2, pattern: [1, 2, 1, 1], starId: 'yunus' },
      { order: 3, pattern: [1, 2, 1, 2], starId: 'issah' },
      { order: 4, pattern: [1, 1, 1, 2], starId: 'hassan-hussein' },
    ],
};

export const CH132_M1_TREASURE: FigureList = {
  chapterNumber: 132,
  houses: [4, 6],
  condition: "there is treasure",
  figures: [
      { order: 1, pattern: [2, 1, 2, 1], starId: 'usman' },
      { order: 2, pattern: [1, 1, 2, 1], starId: 'yussif' },
      { order: 3, pattern: [1, 2, 2, 1], starId: 'sulemana' },
      { order: 4, pattern: [2, 2, 1, 2], starId: 'iddris' },
    ],
};

export const CH132_M2_TREASURE: FigureList = {
  chapterNumber: 132,
  houses: [],
  condition: "there is something",
  figures: [
      { order: 1, pattern: [2, 1, 2, 1], starId: 'usman' },
      { order: 2, pattern: [2, 1, 1, 1], starId: 'mahadi' },
      { order: 3, pattern: [2, 2, 1, 1], starId: 'nuhu' },
    ],
};

export const CH27_M1_EAST: FigureList = {
  chapterNumber: 27,
  houses: [1, 7, 4, 8],
  condition: "stars of the East",
  figures: [
      { order: 1, pattern: [1, 1, 2, 1], starId: 'yussif' },
      { order: 2, pattern: [1, 2, 2, 2], starId: 'adam' },
      { order: 3, pattern: [1, 1, 2, 2], starId: 'kalla-allahu' },
      { order: 4, pattern: [2, 2, 2, 2], starId: 'musah' },
    ],
};

export const CH27_M1_WEST: FigureList = {
  chapterNumber: 27,
  houses: [1, 7, 4, 8],
  condition: "stars of the West",
  figures: [
      { order: 1, pattern: [2, 1, 2, 1], starId: 'usman' },
      { order: 2, pattern: [2, 1, 1, 1], starId: 'mahadi' },
      { order: 3, pattern: [2, 1, 1, 2], starId: 'ali' },
      { order: 4, pattern: [2, 1, 2, 2], starId: 'umar' },
    ],
};

export const CH27_M1_NORTH: FigureList = {
  chapterNumber: 27,
  houses: [1, 7, 4, 8],
  condition: "stars of the North",
  figures: [
      { order: 1, pattern: [2, 2, 1, 2], starId: 'iddris' },
      { order: 2, pattern: [1, 1, 1, 1], starId: 'ibrahim' },
      { order: 3, pattern: [1, 2, 1, 2], starId: 'issah' },
      { order: 4, pattern: [1, 1, 1, 2], starId: 'hassan-hussein' },
    ],
};

export const CH27_M1_SOUTH: FigureList = {
  chapterNumber: 27,
  houses: [1, 7, 4, 8],
  condition: "stars of the South",
  figures: [
      { order: 1, pattern: [2, 2, 1, 1], starId: 'nuhu' },
      { order: 2, pattern: [1, 2, 1, 1], starId: 'yunus' },
      { order: 3, pattern: [1, 2, 2, 1], starId: 'sulemana' },
      { order: 4, pattern: [2, 2, 2, 1], starId: 'ayuba' },
    ],
};

export const CH27_M2_FIRE: FigureList = {
  chapterNumber: 27,
  houses: [1, 5, 10, 15],
  condition: "fire stars",
  figures: [
      { order: 1, pattern: [1, 1, 2, 1], starId: 'yussif' },
      { order: 2, pattern: [1, 1, 2, 2], starId: 'kalla-allahu' },
      { order: 3, pattern: [1, 2, 2, 2], starId: 'adam' },
      { order: 4, pattern: [2, 2, 2, 2], starId: 'musah' },
    ],
};

export const CH27_M2_AIR: FigureList = {
  chapterNumber: 27,
  houses: [1, 5, 10, 15],
  condition: "air stars",
  figures: [
      { order: 1, pattern: [2, 1, 2, 1], starId: 'usman' },
      { order: 2, pattern: [2, 1, 1, 1], starId: 'mahadi' },
      { order: 3, pattern: [2, 1, 1, 2], starId: 'ali' },
      { order: 4, pattern: [2, 1, 2, 2], starId: 'umar' },
    ],
};

export const CH27_M2_WATER: FigureList = {
  chapterNumber: 27,
  houses: [1, 5, 10, 15],
  condition: "water stars",
  figures: [
      { order: 1, pattern: [2, 2, 1, 2], starId: 'iddris' },
      { order: 2, pattern: [1, 1, 1, 1], starId: 'ibrahim' },
      { order: 3, pattern: [1, 1, 1, 2], starId: 'hassan-hussein' },
      { order: 4, pattern: [1, 2, 1, 2], starId: 'issah' },
    ],
};

export const CH27_M2_SAND: FigureList = {
  chapterNumber: 27,
  houses: [1, 5, 10, 15],
  condition: "sand/earth stars",
  figures: [
      { order: 1, pattern: [2, 2, 1, 1], starId: 'nuhu' },
      { order: 2, pattern: [1, 2, 1, 1], starId: 'yunus' },
      { order: 3, pattern: [1, 2, 2, 1], starId: 'sulemana' },
      { order: 4, pattern: [2, 2, 2, 1], starId: 'ayuba' },
    ],
};

export const CH36_EAST_FIRE: FigureList = {
  chapterNumber: 36,
  houses: [1, 2, 3, 4],
  condition: "fire star -> eastern part",
  figures: [
      { order: 1, pattern: [1, 1, 2, 1], starId: 'yussif' },
      { order: 2, pattern: [1, 2, 2, 2], starId: 'adam' },
      { order: 3, pattern: [2, 2, 2, 2], starId: 'musah' },
      { order: 4, pattern: [1, 1, 2, 2], starId: 'kalla-allahu' },
    ],
};

export const CH36_WEST_AIR: FigureList = {
  chapterNumber: 36,
  houses: [1, 2, 3, 4],
  condition: "air star -> western part",
  figures: [
      { order: 1, pattern: [2, 1, 2, 1], starId: 'usman' },
      { order: 2, pattern: [2, 1, 1, 1], starId: 'mahadi' },
      { order: 3, pattern: [2, 1, 2, 2], starId: 'umar' },
      { order: 4, pattern: [2, 1, 1, 2], starId: 'ali' },
    ],
};

export const CH36_NORTH_WATER: FigureList = {
  chapterNumber: 36,
  houses: [1, 2, 3, 4],
  condition: "water star -> northern part",
  figures: [
      { order: 1, pattern: [2, 2, 1, 2], starId: 'iddris' },
      { order: 2, pattern: [1, 1, 1, 1], starId: 'ibrahim' },
      { order: 3, pattern: [1, 1, 1, 2], starId: 'hassan-hussein' },
      { order: 4, pattern: [1, 2, 1, 2], starId: 'issah' },
    ],
};

export const CH36_SOUTH_SAND: FigureList = {
  chapterNumber: 36,
  houses: [1, 2, 3, 4],
  condition: "sand star -> southern part",
  figures: [
      { order: 1, pattern: [2, 2, 1, 1], starId: 'nuhu' },
      { order: 2, pattern: [2, 2, 2, 1], starId: 'ayuba' },
      { order: 3, pattern: [1, 2, 1, 1], starId: 'yunus' },
      { order: 4, pattern: [1, 2, 2, 1], starId: 'sulemana' },
    ],
};

export const CH94_LIFESPAN: OutcomeTable = {
  chapterNumber: 94,
  houses: [8],
  entries: [
    { figures: [
        { order: 1, pattern: [2, 2, 2, 1], starId: 'ayuba' },
      ], text: "very long life, until old age." },
    { figures: [
        { order: 1, pattern: [1, 2, 2, 1], starId: 'sulemana' },
      ], text: "within his/her old age." },
    { figures: [
        { order: 1, pattern: [1, 2, 2, 2], starId: 'adam' },
      ], text: "after old age the person will die." },
    { figures: [
        { order: 1, pattern: [2, 1, 2, 2], starId: 'umar' },
      ], text: "early young age \u2014 man or lady, will be the time he/she will die." },
    { figures: [
        { order: 1, pattern: [2, 1, 2, 1], starId: 'usman' },
      ], text: "at the end of puberty time." },
    { figures: [
        { order: 1, pattern: [2, 2, 1, 1], starId: 'nuhu' },
      ], text: "at his/her youthful time." },
    { figures: [
        { order: 1, pattern: [1, 1, 2, 1], starId: 'yussif' },
      ], text: "at his/her first year at puberty." },
    { figures: [
        { order: 1, pattern: [2, 1, 1, 2], starId: 'ali' },
      ], text: "in the middle of his/her puberty time." },
    { figures: [
        { order: 1, pattern: [2, 2, 2, 2], starId: 'musah' },
      ], text: "at the beginning of his/her puberty time." },
    { figures: [
        { order: 1, pattern: [2, 2, 1, 2], starId: 'iddris' },
      ], text: "at the age of 10 years." },
    { figures: [
        { order: 1, pattern: [1, 2, 1, 2], starId: 'issah' },
      ], text: "he/she will die while still small." },
    { figures: [
        { order: 1, pattern: [1, 1, 1, 2], starId: 'hassan-hussein' },
      ], text: "the same \u2014 he/she will die as a small boy/girl." },
    { figures: [
        { order: 1, pattern: [1, 1, 1, 1], starId: 'ibrahim' },
      ], text: "before he/she attains puberty time." },
    { figures: [
        { order: 1, pattern: [1, 1, 2, 2], starId: 'kalla-allahu' },
      ], text: "in the middle of his/her life \u2014 that's from 40 and above." },
    { figures: [
        { order: 1, pattern: [2, 1, 1, 1], starId: 'mahadi' },
      ], text: "in the middle of his/her youthful age/time." },
  ],
};

export const CH97_PLACE_OF_DEATH: OutcomeTable = {
  chapterNumber: 97,
  houses: [8],
  entries: [
    { figures: [
        { order: 1, pattern: [2, 1, 1, 1], starId: 'mahadi' },
        { order: 2, pattern: [1, 2, 2, 2], starId: 'adam' },
      ], text: "one will die in his/her hometown, in a masjid/mosque, or where they teach Qur'an (Makaranta)." },
    { figures: [
        { order: 1, pattern: [2, 1, 2, 1], starId: 'usman' },
      ], text: "one will die in his/her hometown, the same day, with a scholar or well-known person in your town." },
    { figures: [
        { order: 1, pattern: [1, 1, 1, 2], starId: 'hassan-hussein' },
      ], text: "one will die in a village or on mountains." },
    { figures: [
        { order: 1, pattern: [2, 1, 1, 2], starId: 'ali' },
        { order: 2, pattern: [2, 2, 2, 2], starId: 'musah' },
      ], text: "one will die in a farm or bush." },
    { figures: [
        { order: 1, pattern: [1, 1, 2, 1], starId: 'yussif' },
      ], text: "one will die in a very rich or wealthy place, or a rainy or watery place." },
    { figures: [
        { order: 1, pattern: [1, 2, 2, 1], starId: 'sulemana' },
      ], text: "one will die in a place where they break stone, or in mountains." },
    { figures: [
        { order: 1, pattern: [2, 2, 2, 1], starId: 'ayuba' },
      ], text: "one will die in an old shrine, or a damaged or dirty place." },
    { figures: [
        { order: 1, pattern: [2, 1, 2, 2], starId: 'umar' },
      ], text: "one will die in a fearful or robbery-prone place." },
    { figures: [
        { order: 1, pattern: [2, 2, 1, 2], starId: 'iddris' },
      ], text: "one will die in a peaceful or joyful place, or around a river or sea." },
    { figures: [
        { order: 1, pattern: [1, 1, 2, 2], starId: 'kalla-allahu' },
      ], text: "one will die in a big town or city \u2014 a well-respected, well-arranged place." },
    { figures: [
        { order: 1, pattern: [2, 2, 1, 1], starId: 'nuhu' },
      ], text: "one will die in a palace, a flagstaff house, or where there is a river." },
    { figures: [
        { order: 1, pattern: [1, 2, 1, 2], starId: 'issah' },
      ], text: "one will die in a damaged place, a place of war, or among animals." },
    { figures: [
        { order: 1, pattern: [1, 2, 1, 1], starId: 'yunus' },
      ], text: "one will die in a place of knowledge, a joyful place, cool, or where there are a lot of trees." },
    { figures: [
        { order: 1, pattern: [1, 1, 1, 1], starId: 'ibrahim' },
      ], text: "one will die in a waterlogged area, or where water runs \u2014 a cool and peaceful place." },
  ],
};

export const CH142_KIDNAP_LOCATION: OutcomeTable = {
  chapterNumber: 142,
  houses: [],
  entries: [
    { figures: [
        { order: 1, pattern: [1, 1, 2, 1], starId: 'yussif' },
      ], text: "he/she is kidnapped in his/her own house." },
    { figures: [
        { order: 1, pattern: [1, 2, 2, 2], starId: 'adam' },
      ], text: "he/she is in one of the closest houses, or a neighbor's." },
    { figures: [
        { order: 1, pattern: [2, 1, 1, 1], starId: 'mahadi' },
      ], text: "he/she is in one of his/her family members' house." },
    { figures: [
        { order: 1, pattern: [2, 2, 1, 2], starId: 'iddris' },
      ], text: "he/she is in his/her father's or mother's house." },
    { figures: [
        { order: 1, pattern: [1, 1, 1, 1], starId: 'ibrahim' },
      ], text: "he/she is in one of his/her children's house." },
    { figures: [
        { order: 1, pattern: [1, 2, 1, 2], starId: 'issah' },
      ], text: "he/she is in a sick person's house, close to him or her." },
    { figures: [
        { order: 1, pattern: [2, 1, 2, 2], starId: 'umar' },
      ], text: "he/she is in his or her girlfriend's/boyfriend's, or wife's/husband's house." },
    { figures: [
        { order: 1, pattern: [2, 2, 2, 1], starId: 'ayuba' },
      ], text: "he/she is in a funeral house." },
    { figures: [
        { order: 1, pattern: [1, 1, 2, 2], starId: 'kalla-allahu' },
      ], text: "he/she is on a journey \u2014 they are taking him/her somewhere out of towns." },
    { figures: [
        { order: 1, pattern: [1, 2, 2, 1], starId: 'sulemana' },
      ], text: "he/she is in a chief's, king's, or a well-known and respected person's house." },
    { figures: [
        { order: 1, pattern: [2, 1, 1, 2], starId: 'ali' },
      ], text: "he/she is in his/her ex's house." },
    { figures: [
        { order: 1, pattern: [2, 2, 1, 1], starId: 'nuhu' },
      ], text: "he/she is in his/her enemy's house \u2014 and so on, up to the end of the stars." },
  ],
};

/** Constant figures the final edition names (chapters 107, 108, 118, 119). */
export const CONSTANT_FIGURES = {
  nazir: { chapterNumber: 107, pattern: [1, 2, 2, 2], starId: 'adam' },
  nutik: { chapterNumber: 108, pattern: [2, 1, 2, 2], starId: 'umar' },
  itisal: { chapterNumber: 118, pattern: [2, 2, 1, 2], starId: 'iddris' },
  ifusal: { chapterNumber: 119, pattern: [2, 2, 2, 1], starId: 'ayuba' },
} as const;

/** The four figures chapter 142 gives NO outcome for (the source ends "and so on, up to the end of the stars"). */
export const CH142_SOURCE_INCOMPLETE_STAR_IDS = ['hassan-hussein', 'yunus', 'usman', 'musah'] as const;
