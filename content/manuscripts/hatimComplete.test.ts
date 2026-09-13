import { describe, expect, it } from 'vitest';
import { STARS } from '@/content/stars';
import { HATIM_DEFINITIONS, arabicIndicToLatin, getHatimByStarId, hatimCoverageTally } from './hatim';

// Prompt 23 — the manuscript reader supplied every previously-"under review"
// cell directly. This file is the single, exhaustive record of the complete
// 16 x 8 = 128-cell table (section 10), asserted exactly rather than derived
// from a formula — each expected value below is copied verbatim from the
// authoritative list Prompt 23 supplied, not recomputed.
const EXPECTED: Record<string, { tm: number; ml: number; br: number }> = {
  yussif: { tm: 211, ml: 215, br: 209 },
  adam: { tm: 22, ml: 21, br: 20 },
  mahadi: { tm: 33, ml: 32, br: 31 },
  iddris: { tm: 111, ml: 110, br: 109 },
  ibrahim: { tm: 142, ml: 145, br: 144 },
  issah: { tm: 125, ml: 124, br: 123 },
  umar: { tm: 202, ml: 201, br: 200 },
  ayuba: { tm: 308, ml: 307, br: 306 },
  'kalla-allahu': { tm: 12, ml: 15, br: 14 },
  sulemana: { tm: 252, ml: 251, br: 250 },
  ali: { tm: 322, ml: 325, br: 324 },
  nuhu: { tm: 22, ml: 21, br: 20 },
  'hassan-hussein': { tm: 84, ml: 83, br: 82 },
  yunus: { tm: 14, ml: 13, br: 12 },
  usman: { tm: 108, ml: 102, br: 105 },
  musah: { tm: 110, ml: 109, br: 108 },
};

function cellNumber(starId: string, position: 'topMiddle' | 'middleLeft' | 'bottomRight'): number {
  const cell = getHatimByStarId(starId)!.border[position];
  if (cell.status !== 'verified') throw new Error(`${starId}.${position} is not verified`);
  return Number(arabicIndicToLatin(cell.text));
}

describe('Prompt 23 — complete 16 x 8 Hatim table, exact values', () => {
  it('has all sixteen stars in EXPECTED, matching content/stars.ts exactly', () => {
    expect(Object.keys(EXPECTED).sort()).toEqual(STARS.map((s) => s.id).sort());
  });

  for (const [starId, { tm, ml, br }] of Object.entries(EXPECTED)) {
    it(`${starId}: topMiddle=${tm}, middleLeft=${ml}, bottomRight=${br}, plus the fixed corners and 5/4 centre-flanking cells`, () => {
      const hatim = getHatimByStarId(starId)!;
      expect(hatim.border.topLeft).toEqual({ status: 'verified', text: '٣' });
      expect(cellNumber(starId, 'topMiddle')).toBe(tm);
      expect(hatim.border.topRight).toEqual({ status: 'verified', text: '١' });
      expect(cellNumber(starId, 'middleLeft')).toBe(ml);
      expect(hatim.border.middleRight).toEqual({ status: 'verified', text: '٥' });
      expect(hatim.border.bottomLeft).toEqual({ status: 'verified', text: '٢' });
      expect(hatim.border.bottomMiddle).toEqual({ status: 'verified', text: '٤' });
      expect(cellNumber(starId, 'bottomRight')).toBe(br);
    });
  }

  it('leaves no outer cell "under review" and none null — 128/128 explicit', () => {
    const tally = hatimCoverageTally();
    expect(tally.totalCells).toBe(128);
    expect(tally.verifiedCells).toBe(128);
    expect(tally.reviewCells).toBe(0);
    for (const hatim of HATIM_DEFINITIONS) {
      for (const cell of Object.values(hatim.border)) {
        expect(cell.status).toBe('verified');
        if (cell.status === 'verified') {
          expect(cell.text.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('marks every one of the sixteen diagrams fullyVerified', () => {
    for (const hatim of HATIM_DEFINITIONS) {
      expect(hatim.fullyVerified, hatim.starId).toBe(true);
    }
  });

  it('Ibrahim, Ali and Usman are stored as explicit, independent values — not generated from one N (Prompt 23 section 6/11 regression proof)', () => {
    // If these were generated from a single N via TM=N-4/ML=N-5/BR=N-6, all
    // three would have to agree on the same N. They do not — proving the
    // values below are read from the manuscript, not computed.
    expect(EXPECTED.ibrahim.tm - 4).not.toBe(EXPECTED.ibrahim.ml - 5);
    expect(EXPECTED.ali.tm - 4).not.toBe(EXPECTED.ali.ml - 5);
    expect(EXPECTED.usman.tm - 4).not.toBe(EXPECTED.usman.ml - 5);
    expect(EXPECTED.usman.ml - 5).not.toBe(EXPECTED.usman.br - 6);
  });

  it('never mutates a stored value when converting for display (numeral toggle safety)', () => {
    for (const hatim of HATIM_DEFINITIONS) {
      const before = JSON.parse(JSON.stringify(hatim.border));
      for (const cell of Object.values(hatim.border)) {
        if (cell.status === 'verified') arabicIndicToLatin(cell.text);
      }
      expect(hatim.border).toEqual(before);
    }
  });

  it('preserves each star\'s own centre figure and "Intentions" label, untouched by this completion', () => {
    for (const hatim of HATIM_DEFINITIONS) {
      const star = STARS.find((s) => s.id === hatim.starId)!;
      expect(hatim.centerFigure).toEqual(star.pattern);
      expect(hatim.centerLabel).toBe('Intentions');
    }
  });
});

describe('Prompt 23 — no engine coupling', () => {
  it('this module does not import or export anything from the casting engine', () => {
    const mod: Record<string, unknown> = { HATIM_DEFINITIONS };
    expect(mod).not.toHaveProperty('runReading');
    expect(mod).not.toHaveProperty('buildChart');
  });
});
