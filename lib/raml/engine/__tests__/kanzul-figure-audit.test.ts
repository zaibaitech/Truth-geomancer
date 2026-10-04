// Prompt 57 — keeps the Kanzul figure audit honest. A "[figures omitted]"
// placeholder may exist only where the audit accounts for it; a figure may be
// marked restored only as a real canonical STARS id.
import { describe, expect, it } from 'vitest';
import { KM_CHAPTERS } from '@/lib/server/content/kanzulMikban';
import { STARS } from '@/content/stars';
import { QUESTION_REGISTRY } from '../questions';
import { KANZUL_FIGURE_AUDIT } from '../kanzulFigureAudit';
import { CH5_H1_H8_DIFFICULT, CH5_H6_WIN, CH6_H4_H10_OPEN_LAND, RESTORED_FIGURE_CONDITIONS, starIdsOf, type RestoredFigureCondition } from '../kanzulRestoredFigures';
import { buildChartModel } from '../chartModel';
import { fixtureChart } from './fixtures';

const PLACEHOLDER = /\[figures omitted/g;
const countIn = (n: number) =>
  (KM_CHAPTERS.find((c) => c.number === n)?.paragraphs.join(' ').match(PLACEHOLDER) ?? []).length;

describe('Kanzul figure audit', () => {
  it('accounts for every chapter that still has a placeholder, with the exact count', () => {
    const actual = KM_CHAPTERS.filter((c) => c.number !== null && countIn(c.number) > 0)
      .map((c) => [c.number as number, countIn(c.number as number)]);
    expect(actual).toEqual(KANZUL_FIGURE_AUDIT.filter((e) => e.placeholders > 0).map((e) => [e.chapter, e.placeholders]));
  });

  it('restored figures use valid canonical ids, and only RESTORED / SOURCE_INCOMPLETE entries claim any', () => {
    const ids = new Set(STARS.map((s) => s.id));
    for (const e of KANZUL_FIGURE_AUDIT) {
      for (const r of e.restored) for (const f of r.figureIds) expect(ids.has(f), `ch.${e.chapter}: ${f}`).toBe(true);
      if (e.status === 'RESTORED') expect(e.restored.length, `ch.${e.chapter}`).toBeGreaterThan(0);
      if (['SOURCE_AMBIGUOUS_OVERLAPPING_OUTCOMES', 'SOURCE_CONTRADICTION', 'SOURCE_ANOMALY', 'SOURCE_PRESENT_UNREGISTERED', 'CONSTANT_FIGURE_UNDEFINED', 'NON_FIGURE_PLACEHOLDER'].includes(e.status)) {
        expect(e.restored, `ch.${e.chapter} must not claim restored figures`).toEqual([]);
      }
    }
  });

  it('every method named by the audit exists; RESTORED ones are verified and uncoded, blocked ones are never claimed verified', () => {
    const methods = new Map(Object.values(QUESTION_REGISTRY).flatMap((q) => q.methods.map((m) => [m.id, m] as const)));
    const NOT_VERIFIED = ['SOURCE_AMBIGUOUS_OVERLAPPING_OUTCOMES', 'SOURCE_INCOMPLETE', 'CONSTANT_FIGURE_UNDEFINED'];
    for (const e of KANZUL_FIGURE_AUDIT) {
      for (const id of e.methods) {
        const m = methods.get(id);
        expect(m, id).toBeDefined();
        if (NOT_VERIFIED.includes(e.status)) expect(m!.status, `${id} (${e.status})`).not.toBe('verified');
        if (e.status === 'RESTORED') {
          expect(m!.status, id).toBe('verified');
          expect(m!.reviewReasonCode, id).toBeUndefined();
        }
      }
    }
  });

  it('restored chapters 5 and 6 carry the verified figures and no placeholder', () => {
    expect(starIdsOf(CH5_H6_WIN)).toEqual(['kalla-allahu', 'ayuba', 'musah', 'mahadi', 'adam', 'ibrahim', 'yunus']);
    expect(starIdsOf(CH5_H1_H8_DIFFICULT)).toEqual(['hassan-hussein', 'issah', 'yunus', 'ayuba']);
    expect(starIdsOf(CH6_H4_H10_OPEN_LAND)).toEqual(['musah', 'adam', 'iddris', 'ayuba']);
    for (const n of [5, 6]) expect(countIn(n)).toBe(0);
    const audit = (n: number) => KANZUL_FIGURE_AUDIT.find((e) => e.chapter === n)!;
    expect(audit(5).status).toBe('RESTORED');
    expect(audit(6).status).toBe('RESTORED');
    // The restored list must be what the audit records, per condition.
    expect(audit(5).restored.map((r) => r.figureIds)).toEqual([starIdsOf(CH5_H6_WIN), starIdsOf(CH5_H1_H8_DIFFICULT)]);
    expect(audit(6).restored.map((r) => r.figureIds)).toEqual([starIdsOf(CH6_H4_H10_OPEN_LAND)]);
  });

  it('every restored dot pattern equals the canonical STARS pattern for its id', () => {
    for (const c of RESTORED_FIGURE_CONDITIONS) {
      for (const f of c.figures) {
        const star = STARS.find((s) => s.id === f.starId);
        expect(star, f.starId).toBeDefined();
        expect(f.pattern).toEqual(star!.pattern);
      }
      // No figure listed twice within one condition.
      expect(new Set(starIdsOf(c)).size).toBe(c.figures.length);
    }
  });

  it('the chapter text names each restored figure under its own condition', () => {
    const text = (n: number) => KM_CHAPTERS.find((c) => c.number === n)!.paragraphs.join(' ');
    const nameOf = (id: string) => STARS.find((s) => s.id === id)!.name;
    const ch5 = text(5);
    const split = ch5.indexOf('They are as follows');
    for (const id of starIdsOf(CH5_H6_WIN)) expect(ch5.slice(0, split)).toContain(nameOf(id));
    for (const id of starIdsOf(CH5_H1_H8_DIFFICULT)) expect(ch5.slice(split)).toContain(nameOf(id));
    for (const id of starIdsOf(CH6_H4_H10_OPEN_LAND)) expect(text(6)).toContain(nameOf(id));
  });

  it('the restored methods evaluate a chart with a listed / unlisted figure in the stated houses', () => {
    const methodsById = new Map(Object.values(QUESTION_REGISTRY).flatMap((q) => q.methods.map((m) => [m.id, m] as const)));
    const chart = fixtureChart();
    const ctx = (id: string) => methodsById.get(id)!;
    // Sweep every figure through each method via a stubbed calculation, so both
    // the listed and the unlisted branches are exercised.
    const run = (id: string, figureId: string) => {
      const m = ctx(id);
      const star = STARS.find((s) => s.id === figureId)!;
      const base = m.calculate(buildChartModel(chart));
      return m.evaluate({ ...base, resultFigure: { ...base.resultFigure, figureId, figureName: star.name } } as never, buildChartModel(chart));
    };
    const expectations: [string, RestoredFigureCondition, string][] = [
      ['fight-war-location-method-1', CH5_H6_WIN, 'favourable'],
      ['fight-war-location-method-2', CH5_H1_H8_DIFFICULT, 'unfavourable'],
      ['enemy-location-method-1', CH6_H4_H10_OPEN_LAND, 'descriptive'],
    ];
    for (const [id, cond, outcome] of expectations) {
      const listed = new Set(starIdsOf(cond));
      for (const s of STARS) {
        expect(run(id, s.id).outcome, `${id} / ${s.id}`).toBe(listed.has(s.id) ? outcome : 'uncertain');
      }
    }
  });

  it('no method is coded figures_omitted_by_transcription any more, and every other blocked method is accounted for by the audit', () => {
    const all = Object.values(QUESTION_REGISTRY).flatMap((q) => q.methods);
    expect(all.filter((m) => m.reviewReasonCode === 'figures_omitted_by_transcription').map((m) => m.id)).toEqual([]);
    const audited = new Set(KANZUL_FIGURE_AUDIT.flatMap((e) => e.methods));
    const SOURCE_CODES = ['source_ambiguous_overlapping_outcomes', 'source_incomplete', 'constant_figure_undefined'];
    expect(all.filter((m) => m.reviewReasonCode && SOURCE_CODES.includes(m.reviewReasonCode)).filter((m) => !audited.has(m.id)).map((m) => m.id)).toEqual([]);
  });

  it('every audited chapter number exists in the transcription, in ascending order, once', () => {
    const nums = KANZUL_FIGURE_AUDIT.map((e) => e.chapter);
    expect(nums).toEqual([...nums].sort((a, b) => a - b));
    expect(new Set(nums).size).toBe(nums.length);
    for (const n of nums) expect(KM_CHAPTERS.some((c) => c.number === n), `ch.${n}`).toBe(true);
  });
});
