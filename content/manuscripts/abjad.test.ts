import { describe, expect, it } from 'vitest';
import { STAR_USE_ENTRIES } from './starUses';
import { HATIM_DEFINITIONS } from './hatim';
import {
  ABJAD_VALIDATIONS,
  abjadStatusLabel,
  abjadValue,
  getAbjadValidationByStarId,
  stripCallingParticle,
} from './abjad';

describe('Abjad validation — section 15: diagnostic only, never overrides the manuscript', () => {
  it('computes one validation per invocation, matching all sixteen stars', () => {
    expect(ABJAD_VALIDATIONS).toHaveLength(16);
    const ids = ABJAD_VALIDATIONS.map((v) => v.starId).sort();
    expect(ids).toEqual(STAR_USE_ENTRIES.map((e) => e.starId).sort());
  });

  it('strips only the standalone calling participle "يا", not letters that merely contain it', () => {
    expect(stripCallingParticle('يا الله')).toBe('الله');
    expect(stripCallingParticle('يا حي يا قيوم')).toBe('حي قيوم');
  });

  it('computes the classical Abjad-kabir sum for a known name', () => {
    expect(abjadValue('الله')).toBe(66);
    expect(abjadValue('جبار')).toBe(206);
  });

  it('reports MATCH for the eleven invocations whose stated count equals the bare name\'s Abjad sum', () => {
    const matches = ['adam', 'mahadi', 'issah', 'ibrahim', 'umar', 'kalla-allahu', 'sulemana', 'nuhu', 'hassan-hussein', 'usman', 'musah'];
    for (const starId of matches) {
      const v = getAbjadValidationByStarId(starId)!;
      expect(v.status, `${starId} expected match: ${v.computedValue} vs ${v.statedValue}`).toBe('match');
    }
  });

  it('reports DISCREPANCY rather than silently correcting the manuscript for the four full-mismatch invocations', () => {
    const discrepancies = ['yussif', 'iddris', 'ayuba', 'ali'];
    for (const starId of discrepancies) {
      const v = getAbjadValidationByStarId(starId)!;
      expect(v.status, `${starId} expected discrepancy`).toBe('discrepancy');
      expect(v.note).not.toBeNull();
    }
  });

  it('reports Yunus as a PARTIAL MATCH (one word of its two-name phrase matches), not a plain discrepancy', () => {
    const v = getAbjadValidationByStarId('yunus')!;
    expect(v.status).toBe('partial_match');
    expect(v.note).not.toBeNull();
  });

  it('labels every status with the precise, non-euphemistic wording (section 10) — never "verified" for a discrepancy', () => {
    expect(abjadStatusLabel(getAbjadValidationByStarId('adam')!)).toBe('MATCH');
    expect(abjadStatusLabel(getAbjadValidationByStarId('yunus')!)).toBe('PARTIAL MATCH');
    expect(abjadStatusLabel(getAbjadValidationByStarId('ali')!)).toBe('SOURCE SPELLING UNRESOLVED');
    expect(abjadStatusLabel(getAbjadValidationByStarId('iddris')!)).toBe('SOURCE VALUE \u2260 ABJAD');
    expect(abjadStatusLabel(getAbjadValidationByStarId('ayuba')!)).toBe('SOURCE VALUE \u2260 ABJAD');
    expect(abjadStatusLabel(getAbjadValidationByStarId('yussif')!)).toBe('SOURCE VALUE \u2260 ABJAD');
  });

  it('never mutates the manuscript-stated invocation count, regardless of match/discrepancy', () => {
    for (const entry of STAR_USE_ENTRIES) {
      const v = getAbjadValidationByStarId(entry.starId)!;
      expect(v.statedValue).toBe(entry.invocation!.count);
    }
  });

  describe('Yussif — the specific reconciliation case (section 5)', () => {
    it('computes Yussif\'s bare-name Abjad (215) distinct from the stated recitation count (251)', () => {
      const v = getAbjadValidationByStarId('yussif')!;
      expect(v.divineNameOnly).toBe('طاهر');
      expect(v.computedValue).toBe(215);
      expect(v.statedValue).toBe(251);
    });

    it('cross-checks that 215 matches the already source-verified Hatim middle-left cell, without changing either value', () => {
      const v = getAbjadValidationByStarId('yussif')!;
      const hatim = HATIM_DEFINITIONS.find((h) => h.starId === 'yussif')!;
      const middleLeft = hatim.border.middleLeft as { status: 'verified'; text: string };
      const toLatin = (s: string) => Number(s.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))));
      expect(toLatin(middleLeft.text)).toBe(v.computedValue);
    });

    it('does NOT replace the supplied 211/210/209 hypothesis over the source-verified 211/215/209 reading', () => {
      // This session had no new manuscript images to re-inspect Yussif's Hatim
      // against. The task prompt's own working table suggests 210 for the
      // middle-left cell, but the existing app data (produced from an actual
      // high-magnification pass over the source photograph) reads 215, and
      // 215 independently matches this file's Abjad calculation of طاهر.
      // Absent new image evidence, the previously source-verified value is
      // kept — not overwritten by a secondhand, unverified working table.
      const hatim = HATIM_DEFINITIONS.find((h) => h.starId === 'yussif')!;
      expect(hatim.border.middleLeft).toEqual({ status: 'verified', text: '٢١٥' });
    });
  });

  it('Ayuba: stated count (312) mismatches the bare-name Abjad (72), but matches the source-verified Hatim geometry', () => {
    const v = getAbjadValidationByStarId('ayuba')!;
    expect(v.computedValue).toBe(72);
    expect(v.statedValue).toBe(312);
    const hatim = HATIM_DEFINITIONS.find((h) => h.starId === 'ayuba')!;
    expect(hatim.border.topMiddle).toEqual({ status: 'verified', text: '٣٠٨' }); // 312 - 4
    expect(hatim.border.middleLeft).toEqual({ status: 'verified', text: '٣٠٧' }); // 312 - 5
    expect(hatim.border.bottomRight).toEqual({ status: 'verified', text: '٣٠٦' }); // 312 - 6
  });

  it('Umar: stated count (206) matches both the bare-name Abjad and the Hatim\'s N-4/N-5/N-6 geometry', () => {
    const v = getAbjadValidationByStarId('umar')!;
    expect(v.status).toBe('match');
    const hatim = HATIM_DEFINITIONS.find((h) => h.starId === 'umar')!;
    expect(hatim.border.topMiddle).toEqual({ status: 'verified', text: '٢٠٢' }); // 206 - 4
    expect(hatim.border.middleLeft).toEqual({ status: 'verified', text: '٢٠١' }); // 206 - 5
    expect(hatim.border.bottomRight).toEqual({ status: 'verified', text: '٢٠٠' }); // 206 - 6
  });

  it('Yunus: stated count (18) matches only the "حي" half of the combined two-name invocation', () => {
    const v = getAbjadValidationByStarId('yunus')!;
    expect(v.divineNameOnly).toBe('حي قيوم');
    expect(abjadValue('حي')).toBe(18);
    expect(v.computedValue).not.toBe(18); // full phrase (174) does not equal the stated count
    expect(v.status).toBe('partial_match');
  });
});

describe('Abjad validation module — does not touch the engine', () => {
  it('exports no engine-facing types (this is content-side diagnostics only)', () => {
    const mod: Record<string, unknown> = { ABJAD_VALIDATIONS };
    expect(mod).not.toHaveProperty('runReading');
    expect(mod).not.toHaveProperty('buildChart');
  });
});
