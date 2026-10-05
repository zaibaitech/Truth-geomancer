// Machine-readable Kanzul Mikban figure-completeness audit.
//
// History: the KM_CHAPTERS transcription replaced hand-drawn figures with
// "[figures omitted]" placeholders. Chapters 5 and 6 were restored from a
// manuscript scan (Prompt 58). The author-confirmed FINAL edition
// (docs/Kanzul-Mikban-Final-Edition.pdf) then supplied the remaining figure lists
// as embedded images; they were decoded to dot patterns and matched to STARS by
// exact pattern equality (kanzulFinalEditionFigures.ts). This audit records,
// per chapter, what that did.
//
// Statuses
//   RESTORED                                  figures supplied and implemented
//   SOURCE_AMBIGUOUS_OVERLAPPING_OUTCOMES     figures supplied, but outcomes share figures — NOT implemented
//   SOURCE_CONTRADICTION                      the edition contradicts itself (name vs drawn figure) — existing method untouched
//   SOURCE_ANOMALY                            the printed table is anomalous — existing method untouched
//   SOURCE_PRESENT_UNREGISTERED               figures supplied, no public question registered (by decision)
//   SOURCE_INCOMPLETE                         the source itself stops short
//   CONSTANT_FIGURE_UNDEFINED                 a constant figure (the Damir) the source never defines
//   NON_FIGURE_PLACEHOLDER                    placeholder not needed for evaluation

import {
  CH102_STABLE,
  CH124_M1_STOLEN,
  CH132_M1_TREASURE,
  CH132_M2_TREASURE,
  CH142_KIDNAP_LOCATION,
  CH17_M1_LIST,
  CH17_M2_FAST,
  CH17_M2_SLOW,
  CH19_M3_LIST,
  CH21_M3_NO,
  CH21_M3_YES,
  CH27_M1_EAST,
  CH27_M1_NORTH,
  CH27_M1_SOUTH,
  CH27_M1_WEST,
  CH27_M2_AIR,
  CH27_M2_FIRE,
  CH27_M2_SAND,
  CH27_M2_WATER,
  CH30_HASSAN_HUSSEIN,
  CH30_ISSAH,
  CH36_EAST_FIRE,
  CH36_NORTH_WATER,
  CH36_SOUTH_SAND,
  CH36_WEST_AIR,
  CH4_H10_SUCCESS,
  CH94_LIFESPAN,
  CH97_PLACE_OF_DEATH,
  CH9_H6_DIFFICULT_TO_SURVIVE,
  CH9_H6_HEALED,
  CONSTANT_FIGURES,
  idsOf,
  type FigureList,
  type OutcomeTable,
} from './kanzulFinalEditionFigures';
import { CH5_H1_H8_DIFFICULT, CH5_H6_WIN, CH6_H4_H10_OPEN_LAND, starIdsOf, type RestoredFigureCondition } from './kanzulRestoredFigures';

export type FigureAuditStatus =
  | 'COMPLETE'
  | 'RESTORED'
  | 'SOURCE_AMBIGUOUS_OVERLAPPING_OUTCOMES'
  | 'SOURCE_CONTRADICTION'
  | 'SOURCE_ANOMALY'
  | 'SOURCE_PRESENT_UNREGISTERED'
  | 'SOURCE_INCOMPLETE'
  | 'CONSTANT_FIGURE_UNDEFINED'
  | 'NON_FIGURE_PLACEHOLDER';

export interface FigureAuditEntry {
  /** KM_CHAPTERS `number`. */
  chapter: number;
  /** Count of "[figures omitted" placeholders currently in the transcription. */
  placeholders: number;
  status: FigureAuditStatus;
  /** Houses the figures are tested against, as stated in the source. */
  houses?: string[];
  /** Registered MethodDefinition ids whose verdict depends on these figures. */
  methods: string[];
  /** Why the entry is classified as it is. */
  note: string;
  /** Verified figures, as canonical STARS ids, per condition. */
  restored: { houses: string[]; meaning: string; figureIds: string[]; confidence: 'high' | 'medium'; source: string }[];
}

const SCAN = 'Manuscript scan, book pp. 22-23 (supplied in Prompt 58); every dot located by pixel position, rows read top to bottom, matched to STARS patterns';
const PDF = 'Final edition PDF: figure images decoded to dot patterns (rows top to bottom) and matched to STARS by exact pattern equality';

const scanCond = (c: RestoredFigureCondition) => ({ houses: c.houses.map((h) => `h${h}`), meaning: c.meaning, figureIds: starIdsOf(c), confidence: 'high' as const, source: SCAN });
const pdfList = (l: FigureList) => ({ houses: l.houses.map((h) => `h${h}`), meaning: l.condition, figureIds: idsOf(l), confidence: 'high' as const, source: PDF });
const pdfTable = (t: OutcomeTable, meaning: string) => ({
  houses: t.houses.map((h) => `h${h}`),
  meaning,
  figureIds: t.entries.flatMap((e) => e.figures.map((f) => f.starId)),
  confidence: 'high' as const,
  source: PDF,
});
const pdfConstant = (name: string, id: string) => ({ houses: ['h1'], meaning: `constant figure of ${name}`, figureIds: [id], confidence: 'high' as const, source: PDF });

const R = 'RESTORED' as const;
const C = 'COMPLETE' as const;

export const KANZUL_FIGURE_AUDIT: FigureAuditEntry[] = [
  { chapter: 2, placeholders: 0, status: 'CONSTANT_FIGURE_UNDEFINED', houses: ["Sirri Sa'ael"], methods: ['money-method-4'], note: "The edition lists four figures (Usman, Nuhu, Mahadi, Ayuba) to check the Damir against, but never defines the Damir (Sirri Sa'ael) itself. Blocked.", restored: [] },
  { chapter: 4, placeholders: 0, status: R, houses: ['h10'], methods: ['hunting-method-1'], note: 'Seven successful-search figures at h10.', restored: [pdfList(CH4_H10_SUCCESS)] },
  { chapter: 5, placeholders: 0, status: R, houses: ['h6', 'h1', 'h8'], methods: ['fight-war-location-method-1', 'fight-war-location-method-2'], note: 'Restored from the scan; the final edition matches it exactly. Yunus and Ayuba appear in BOTH the h6 win list and the h1/h8 difficulty list, as the source shows; they apply to different houses, so there is no conflict.', restored: [scanCond(CH5_H6_WIN), scanCond(CH5_H1_H8_DIFFICULT)] },
  { chapter: 6, placeholders: 0, status: R, houses: ['h4', 'h10'], methods: ['enemy-location-method-1'], note: 'Restored from the scan; the final edition matches it exactly.', restored: [scanCond(CH6_H4_H10_OPEN_LAND)] },
  { chapter: 7, placeholders: 0, status: 'SOURCE_AMBIGUOUS_OVERLAPPING_OUTCOMES', houses: ['h7'], methods: ['marriage-method-4'], note: 'Umar is listed under two outcomes (sick lady with a child; colored jealous lady). No precedence is stated, so nothing is implemented.', restored: [] },
  { chapter: 9, placeholders: 0, status: R, houses: ['h6'], methods: ['sickness-method-3'], note: 'Six healing figures and four grave figures at h6 (disjoint).', restored: [pdfList(CH9_H6_HEALED), pdfList(CH9_H6_DIFFICULT_TO_SURVIVE)] },
  { chapter: 13, placeholders: 0, status: 'SOURCE_AMBIGUOUS_OVERLAPPING_OUTCOMES', houses: ['h5'], methods: ['children-method-3'], note: 'Six figure groups for h5 overlap (Mahadi, Usman, Adam, Issah, Ayuba, Umar each appear in two groups). No precedence is stated, so nothing is implemented.', restored: [] },
  { chapter: 17, placeholders: 0, status: R, houses: ['h1+h6, h4+h16', 'h1+h13, h4+h12, h7+h10, h15+h16'], methods: ['timing-method-1', 'timing-method-2'], note: "Method 1: seven figures. Method 2: a fast list (eight) and a slow list (eight), disjoint. The closing 'the year will be good/hard' sentence names no star, so it is not implemented.", restored: [pdfList(CH17_M1_LIST), pdfList(CH17_M2_FAST), pdfList(CH17_M2_SLOW)] },
  { chapter: 18, placeholders: 0, status: 'SOURCE_PRESENT_UNREGISTERED', houses: ['h4+h10', 'h9+h10'], methods: [], note: 'Part A (will they steal you) M1 and M2 each give four figures (Usman, Sulemana, Ibrahim, Yunus; Nuhu, Ayuba, Ibrahim, Sulemana). No public question is registered for them, by decision. Part B is complete and verified.', restored: [] },
  { chapter: 19, placeholders: 0, status: R, houses: ['h4', 'h10', 'h5', 'h11'], methods: ['court-method-3'], note: 'Four figures: found in h4/h10 = win, found in h5/h11 = lose. Found in both pairs is left uncertain (no precedence stated).', restored: [pdfList(CH19_M3_LIST)] },
  { chapter: 21, placeholders: 0, status: R, houses: ['h7'], methods: ['wife-sex-method-3'], note: 'Four "yes" and four "no" figures at h7 (disjoint).', restored: [pdfList(CH21_M3_YES), pdfList(CH21_M3_NO)] },
  { chapter: 26, placeholders: 0, status: 'CONSTANT_FIGURE_UNDEFINED', houses: ['h1', 'h2', 'h8', 'h9', 'h12', 'h14'], methods: ['fight-argument-method-1'], note: "Every clause's figures are supplied, but the Sirri Sa'ael (Damir) clause — which the h8/h12 clauses depend on — needs a Damir figure the source never defines. Blocked.", restored: [] },
  { chapter: 27, placeholders: 0, status: R, houses: ['h1+h7+h4+h8', 'h1+h5+h10+h15'], methods: ['farming-method-1', 'farming-method-2'], note: 'METHOD-SPECIFIC mapping: the explicit lists put Usman with the West/air stars and Nuhu with the South/sand stars, differing from STARS element metadata (not changed).', restored: [pdfList(CH27_M1_EAST), pdfList(CH27_M1_WEST), pdfList(CH27_M1_NORTH), pdfList(CH27_M1_SOUTH), pdfList(CH27_M2_FIRE), pdfList(CH27_M2_AIR), pdfList(CH27_M2_WATER), pdfList(CH27_M2_SAND)] },
  { chapter: 29, placeholders: 0, status: C, methods: [], note: "The edition's list of eight water-opened figures is now in the book text (it is exactly the eight patterns with a single third row); the rule itself is computed from the line state.", restored: [] },
  { chapter: 30, placeholders: 0, status: R, methods: ['successful-trip-method-1'], note: 'Two named-figure branches were silent gaps in the transcription (no placeholder). Both figures are upward stars in STARS, so they are read as figure-specific exceptions to the direction rule.', restored: [pdfList(CH30_HASSAN_HUSSEIN), pdfList(CH30_ISSAH)] },
  { chapter: 36, placeholders: 0, status: R, houses: ['h1', 'h2', 'h3', 'h4'], methods: ['locate-method-1'], note: 'METHOD-SPECIFIC mapping: the explicit lists put Usman with the air (western) stars and Nuhu with the sand (southern) stars, differing from STARS element metadata (not changed).', restored: [pdfList(CH36_EAST_FIRE), pdfList(CH36_WEST_AIR), pdfList(CH36_NORTH_WATER), pdfList(CH36_SOUTH_SAND)] },
  { chapter: 42, placeholders: 0, status: C, methods: [], note: 'The edition\'s example figures (good-downward and good-upward stars) are now in the book text; the rule classifies by quality.', restored: [] },
  { chapter: 49, placeholders: 0, status: 'SOURCE_ANOMALY', methods: [], note: 'The edition lists Sulemana under BOTH the fire (near) stars and the sand (far) stars. The book text shows the edition\'s lists exactly as printed, including Sulemana in both. Following the explicit lists for Usman and Nuhu changes nothing in the method (both are in a "far" group either way), so the existing element-based method is untouched; the duplication is recorded, not repaired.', restored: [] },
  { chapter: 60, placeholders: 0, status: C, methods: [], note: 'The edition\'s example figures (good-downward and good-upward stars) are now in the book text; the rule classifies by quality.', restored: [] },
  { chapter: 61, placeholders: 0, status: C, methods: [], note: 'The edition\'s example figures for a good star are now in the book text; the rule classifies by quality.', restored: [] },
  { chapter: 94, placeholders: 0, status: R, houses: ['h8'], methods: ['lifespan-when-death-method-1'], note: 'Fifteen stages, one figure each. The edition gives no stage for Yunus (reported as not addressed, not guessed).', restored: [pdfTable(CH94_LIFESPAN, 'stage of life at death')] },
  { chapter: 95, placeholders: 0, status: 'SOURCE_PRESENT_UNREGISTERED', methods: [], note: 'Three figure groups (Youthful: Yunus, Hassan & Hussein, Umar, Nuhu, Iddris, Issah; Middle-Youth: Usman, Musah, Kalla Allahu, Ibrahim, Ali, Yussif; Youth and Old Age: Adam, Ayuba, Sulemana). No public question is registered, by decision; Mahadi is in none of them.', restored: [] },
  { chapter: 97, placeholders: 0, status: R, houses: ['h8'], methods: ['place-of-death-method-1'], note: 'Fourteen outcomes covering all sixteen figures (two outcomes name two figures each).', restored: [pdfTable(CH97_PLACE_OF_DEATH, 'place of death')] },
  { chapter: 102, placeholders: 0, status: R, houses: ['h1', 'h2', 'h3', 'h4'], methods: ['money-work-lady-stable-method-1'], note: 'Five figures checked in the recast chart\'s first four houses.', restored: [pdfList(CH102_STABLE)] },
  { chapter: 106, placeholders: 0, status: 'SOURCE_ANOMALY', methods: ['body-part-in-pain-method-1'], note: 'Chapter 106\'s printed body-part table gives a figure per part, but Sulemana is used for BOTH Head and Neck and Adam is never used. The existing house-number lookup is untouched; the anomaly is recorded, not repaired.', restored: [] },
  { chapter: 107, placeholders: 0, status: R, houses: ['h1'], methods: ['see-what-searching-for-method-1'], note: 'Nazir = Adam.', restored: [pdfConstant('Nazir', CONSTANT_FIGURES.nazir.starId)] },
  { chapter: 108, placeholders: 0, status: R, houses: ['h1'], methods: ['conversation-will-happen-method-1'], note: 'Nutik = Umar.', restored: [pdfConstant('Nutik', CONSTANT_FIGURES.nutik.starId)] },
  { chapter: 118, placeholders: 0, status: R, houses: ['h1'], methods: ['get-what-searching-for-in-place-method-1'], note: 'Itisal = Iddris.', restored: [pdfConstant('Itisal', CONSTANT_FIGURES.itisal.starId)] },
  { chapter: 119, placeholders: 0, status: R, houses: ['h1'], methods: ['what-blocks-you-method-1'], note: 'Ifusal = Ayuba.', restored: [pdfConstant('Ifusal', CONSTANT_FIGURES.ifusal.starId)] },
  { chapter: 121, placeholders: 0, status: 'SOURCE_CONTRADICTION', houses: ['h1', 'h9', 'h11'], methods: ['get-knowledge-in-life-method-1'], note: 'The final edition WRITES "Adam" but the figure DRAWN beside it decodes to Usman (2121). Both values recorded; the existing method (which uses Adam and Ali) is untouched.', restored: [] },
  { chapter: 124, placeholders: 0, status: R, methods: ['something-really-stolen-method-1'], note: 'Four figures searched for anywhere in the chart.', restored: [pdfList(CH124_M1_STOLEN)] },
  { chapter: 132, placeholders: 0, status: R, houses: ['h4', 'h6'], methods: ['hidden-treasure-method-1', 'hidden-treasure-method-2'], note: 'M1: h4+h6 against four figures. M2: any of three figures anywhere in the chart.', restored: [pdfList(CH132_M1_TREASURE), pdfList(CH132_M2_TREASURE)] },
  { chapter: 142, placeholders: 0, status: 'SOURCE_INCOMPLETE', methods: ['kidnapper-location-method-1'], note: 'Twelve outcomes are given and the source then ends "and so on, up to the end of the stars": Hassan & Hussein, Yunus, Usman and Musah have NO outcome and none is invented. The method is held at needs_review because "its own house" is never defined (read here as the figure\'s STARS number — an inference awaiting the author).', restored: [pdfTable(CH142_KIDNAP_LOCATION, 'where the kidnapped person is held')] },
];
