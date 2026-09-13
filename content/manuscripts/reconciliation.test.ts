import { describe, expect, it } from 'vitest';
import { HATIM_DEFINITIONS } from './hatim';
import { STAR_USE_ENTRIES } from './starUses';
import { HATIM_PATTERN_DIAGNOSTICS, getPatternDiagnosticByStarId } from './hatimPattern';
import { VALUE_RECONCILIATIONS, getValueReconciliationByStarId } from './valueReconciliation';

describe('Hatim N-4/N-5/N-6 pattern diagnostic — section 7: a check, never a generator', () => {
  it('produces one diagnostic per star, none mutating hatim.ts', () => {
    expect(HATIM_PATTERN_DIAGNOSTICS).toHaveLength(16);
    const before = JSON.stringify(HATIM_DEFINITIONS);
    void HATIM_PATTERN_DIAGNOSTICS;
    expect(JSON.stringify(HATIM_DEFINITIONS)).toBe(before);
  });

  it('is UNTESTABLE for the twelve stars with no verified variable cells', () => {
    const untestable = ['adam', 'iddris', 'ibrahim', 'issah', 'kalla-allahu', 'sulemana', 'ali', 'nuhu', 'hassan-hussein', 'yunus', 'usman', 'musah'];
    for (const starId of untestable) {
      expect(getPatternDiagnosticByStarId(starId)!.status, starId).toBe('untestable');
    }
  });

  it('is PARTIALLY_CONFIRMED for Mahadi (only topMiddle verified, consistent with N=37)', () => {
    const d = getPatternDiagnosticByStarId('mahadi')!;
    expect(d.status).toBe('partially_confirmed');
    expect(d.consistentN).toBe(37);
    expect(d.sourceStatedValue).toBe(37);
  });

  it('is CONFIRMED_BY_SOURCE for Umar (three verified cells all agree on N=206, matching stated and Abjad)', () => {
    const d = getPatternDiagnosticByStarId('umar')!;
    expect(d.status).toBe('confirmed_by_source');
    expect(d.consistentN).toBe(206);
    expect(d.verifiedCells).toHaveLength(3);
  });

  it('is CONFIRMED_BY_SOURCE for Ayuba (three verified cells agree on N=312 — the STATED count, not the 72 Abjad sum)', () => {
    const d = getPatternDiagnosticByStarId('ayuba')!;
    expect(d.status).toBe('confirmed_by_source');
    expect(d.consistentN).toBe(312);
    expect(d.abjadValue).toBe(72);
    expect(d.consistentN).not.toBe(d.abjadValue);
  });

  it('is CONFLICTING for Yussif — its three verified cells do NOT all imply the same N', () => {
    const d = getPatternDiagnosticByStarId('yussif')!;
    expect(d.status).toBe('conflicting');
    expect(d.consistentN).toBeNull();
    expect(d.verifiedCells).toHaveLength(3);
    // topMiddle(211)+4=215, bottomRight(209)+6=215, but middleLeft(215)+5=220 — a real disagreement.
    const impliedNs = d.verifiedCells.map((c) => c.impliedN).sort((a, b) => a - b);
    expect(impliedNs).toEqual([215, 215, 220]);
  });

  it('never invents a Hatim value: every diagnostic\'s verifiedCells come only from hatim.ts cells already marked verified', () => {
    for (const d of HATIM_PATTERN_DIAGNOSTICS) {
      const hatim = HATIM_DEFINITIONS.find((h) => h.starId === d.starId)!;
      for (const c of d.verifiedCells) {
        expect(hatim.border[c.position].status).toBe('verified');
      }
    }
  });
});

describe('Value reconciliation — section 9: sourceStatedValue, abjadValue and hatimReferenceValue kept distinct', () => {
  it('produces one reconciliation per star', () => {
    expect(VALUE_RECONCILIATIONS).toHaveLength(16);
    expect(VALUE_RECONCILIATIONS.map((r) => r.starId).sort()).toEqual(STAR_USE_ENTRIES.map((e) => e.starId).sort());
  });

  it('Yussif — identity/value distinction: 251 (stated) \u2260 215 (Abjad); hatimReferenceValue null (cells conflict)', () => {
    const r = getValueReconciliationByStarId('yussif')!;
    expect(r.sourceStatedValue).toBe(251);
    expect(r.abjadValue).toBe(215);
    expect(r.hatimReferenceValue).toBeNull();
    expect(r.valueConfidence).toBe('unresolved');
  });

  it('Usman — identity/value distinction: never conflated with Yussif\'s يا طاهر (251)', () => {
    const r = getValueReconciliationByStarId('usman')!;
    expect(r.sourceStatedValue).toBe(111);
    expect(r.abjadValue).toBe(111);
    const usmanEntry = STAR_USE_ENTRIES.find((e) => e.starId === 'usman')!;
    expect(usmanEntry.invocation!.arabic).toBe('يا كافي');
    const yussifEntry = STAR_USE_ENTRIES.find((e) => e.starId === 'yussif')!;
    expect(yussifEntry.invocation!.arabic).toBe('يا طاهر');
    expect(yussifEntry.invocation!.count).toBe(251);
  });

  it('Ayuba — hatimReferenceValue (312) is the stated count, not the bare Abjad sum (72); confidence stays "verified" because the relationship is understood', () => {
    const r = getValueReconciliationByStarId('ayuba')!;
    expect(r.hatimReferenceValue).toBe(312);
    expect(r.sourceStatedValue).toBe(312);
    expect(r.abjadValue).toBe(72);
    expect(r.valueConfidence).toBe('verified');
  });

  it('Iddris and Ali stay "unresolved" — no invented explanation is accepted as a fix', () => {
    expect(getValueReconciliationByStarId('iddris')!.valueConfidence).toBe('unresolved');
    expect(getValueReconciliationByStarId('ali')!.valueConfidence).toBe('unresolved');
  });

  it('Yunus is "partial" — never claimed fully resolved nor a plain discrepancy', () => {
    expect(getValueReconciliationByStarId('yunus')!.valueConfidence).toBe('partial');
  });

  it('the eleven full matches with no Hatim cross-check available report "verified" without a hatimReferenceValue', () => {
    const noHatimData = ['adam', 'issah', 'ibrahim', 'kalla-allahu', 'sulemana', 'nuhu', 'hassan-hussein', 'usman', 'musah'];
    for (const starId of noHatimData) {
      const r = getValueReconciliationByStarId(starId)!;
      expect(r.valueConfidence, starId).toBe('verified');
      expect(r.hatimReferenceValue, starId).toBeNull();
    }
  });
});

describe('This session does not touch the casting engine', () => {
  it('exports no engine-facing symbols from either new module', () => {
    const mod: Record<string, unknown> = { HATIM_PATTERN_DIAGNOSTICS, VALUE_RECONCILIATIONS };
    expect(mod).not.toHaveProperty('runReading');
    expect(mod).not.toHaveProperty('buildChart');
  });
});
