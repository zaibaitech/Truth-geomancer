// Classical (Western/Arabic geomancy tradition) attributes for the 16 figures,
// mapped onto our 16 named stars by their shared dot-pattern.
//
// Why this file exists: Kanzul Mikban's own methods constantly resolve to a
// verdict via qualities the book treats as fixed per figure — "good", "bad",
// "upward", "downward" — but neither source manuscript actually tabulates
// which figure carries which quality (confirmed by exhaustive search of both
// texts). Rather than leave every such method un-automatable, this file
// supplies the standard classical-tradition attributes for the same 16
// binary patterns, clearly labeled as adapted from that outside tradition —
// NOT confirmed against this manuscript's own (undocumented) system.
//
// Sourcing:
// - `fortune` (good/bad/neutral): the classical Fortune of each of the 16
//   Latin-named figures (Via, Populus, Fortuna Major/Minor, Puer, Puella,
//   Amissio, Acquisitio, Laetitia, Tristitia, Rubeus, Albus, Coniunctio,
//   Carcer, Caput/Cauda Draconis).
// - `upDown` (upward/downward/"level"): derived structurally — compare the
//   figure's first line (Fire) against its last line (Earth). Differing
//   lines give a clear Upward (1 over 2) or Downward (2 over 1) reading, in
//   line with the classical Exiting/Entering figure distinction, cross-
//   checked 8/8 against an independently sourced named list. Where the two
//   lines match, the axis is genuinely ambiguous — real sources disagree
//   specifically on those 8 patterns — so those are marked "level" rather
//   than forced to a guess.
//
// If a verified attribution table for THIS manuscript's own system turns up,
// prefer it over this file for any chapter it covers.

import type { Pattern } from './stars';

export type Fortune = 'good' | 'bad' | 'neutral';
export type UpDown = 'upward' | 'downward' | 'level';

export interface ClassicalAttribute {
  starId: string;
  classicalName: string;
  pattern: Pattern;
  fortune: Fortune;
  upDown: UpDown;
}

export const CLASSICAL_ATTRIBUTES: Record<string, ClassicalAttribute> = {
  yussif: { starId: 'yussif', classicalName: 'Puer', pattern: [1, 1, 2, 1], fortune: 'bad', upDown: 'level' },
  adam: { starId: 'adam', classicalName: 'Laetitia', pattern: [1, 2, 2, 2], fortune: 'good', upDown: 'upward' },
  mahadi: { starId: 'mahadi', classicalName: 'Caput Draconis', pattern: [2, 1, 1, 1], fortune: 'good', upDown: 'downward' },
  iddris: { starId: 'iddris', classicalName: 'Albus', pattern: [2, 2, 1, 2], fortune: 'good', upDown: 'level' },
  ibrahim: { starId: 'ibrahim', classicalName: 'Via', pattern: [1, 1, 1, 1], fortune: 'neutral', upDown: 'level' },
  issah: { starId: 'issah', classicalName: 'Amissio', pattern: [1, 2, 1, 2], fortune: 'bad', upDown: 'upward' },
  umar: { starId: 'umar', classicalName: 'Rubeus', pattern: [2, 1, 2, 2], fortune: 'bad', upDown: 'level' },
  ayuba: { starId: 'ayuba', classicalName: 'Tristitia', pattern: [2, 2, 2, 1], fortune: 'bad', upDown: 'downward' },
  'kalla-allahu': { starId: 'kalla-allahu', classicalName: 'Fortuna Minor', pattern: [1, 1, 2, 2], fortune: 'good', upDown: 'upward' },
  sulemana: { starId: 'sulemana', classicalName: 'Carcer', pattern: [1, 2, 2, 1], fortune: 'bad', upDown: 'level' },
  ali: { starId: 'ali', classicalName: 'Coniunctio', pattern: [2, 1, 1, 2], fortune: 'neutral', upDown: 'level' },
  nuhu: { starId: 'nuhu', classicalName: 'Fortuna Major', pattern: [2, 2, 1, 1], fortune: 'good', upDown: 'downward' },
  'hassan-hussein': { starId: 'hassan-hussein', classicalName: 'Cauda Draconis', pattern: [1, 1, 1, 2], fortune: 'bad', upDown: 'upward' },
  yunus: { starId: 'yunus', classicalName: 'Puella', pattern: [1, 2, 1, 1], fortune: 'good', upDown: 'level' },
  usman: { starId: 'usman', classicalName: 'Acquisitio', pattern: [2, 1, 2, 1], fortune: 'good', upDown: 'downward' },
  musah: { starId: 'musah', classicalName: 'Populus', pattern: [2, 2, 2, 2], fortune: 'neutral', upDown: 'level' },
};

export function getClassicalAttribute(starId: string): ClassicalAttribute {
  const attr = CLASSICAL_ATTRIBUTES[starId];
  if (!attr) throw new Error(`No classical attribute mapped for star id "${starId}"`);
  return attr;
}

export const FORTUNE_LABEL: Record<Fortune, string> = {
  good: 'Good',
  bad: 'Bad',
  neutral: 'Neutral',
};

export const UPDOWN_LABEL: Record<UpDown, string> = {
  upward: 'Upward',
  downward: 'Downward',
  level: 'Level (unclear)',
};
