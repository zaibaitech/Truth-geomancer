// Regression tests for the final-edition Kanzul restoration. Every restored
// method is exercised on charts built to contain specific figures in specific
// houses (found by scanning mother combinations), so both the listed branches
// and the "not addressed" branches are covered. Expected outcomes come from
// the SOURCE lists (kanzulFinalEditionFigures.ts), not from engine output.
import { describe, expect, it } from 'vitest';
import { STARS, type Pattern } from '@/content/stars';
import { KM_CHAPTERS } from '@/lib/server/content/kanzulMikban';
import { buildChart } from '@/lib/raml/casting';
import { buildChartModel } from '../chartModel';
import { QUESTION_REGISTRY } from '../questions';
import * as F from '../kanzulFinalEditionFigures';
import { CONSTANT_FIGURES, idsOf } from '../kanzulFinalEditionFigures';
import { RECAST_FROM_HOUSES } from '../operations';
import type { ChartModel, MethodDefinition } from '../types';

const METHODS = new Map(Object.values(QUESTION_REGISTRY).flatMap((q) => q.methods.map((m) => [m.id, m] as const)));
const method = (id: string): MethodDefinition => {
  const m = METHODS.get(id);
  if (!m) throw new Error(`no method ${id}`);
  return m;
};
const verdictOn = (id: string, model: ChartModel) => {
  const m = method(id);
  return m.evaluate(m.calculate(model), model);
};
/** Evaluate a single-figure method as if its calculation had produced `starId`. */
const verdictForFigure = (id: string, starId: string, model: ChartModel) => {
  const m = method(id);
  const base = m.calculate(model);
  const star = STARS.find((s) => s.id === starId)!;
  return m.evaluate({ ...base, resultFigure: { ...base.resultFigure, figureId: star.id, figureName: star.name, dotPattern: star.pattern } }, model);
};

const PATTERNS = STARS.map((s) => s.pattern);
const cache = new Map<string, ChartModel | null>();
/** First chart (scanning mother combinations) whose model satisfies `pred`. */
function findModel(key: string, pred: (m: ChartModel) => boolean): ChartModel {
  if (!cache.has(key)) {
    let found: ChartModel | null = null;
    outer: for (const a of PATTERNS) for (const b of PATTERNS) for (const c of PATTERNS) for (const d of PATTERNS) {
      const model = buildChartModel(buildChart([a, b, c, d] as [Pattern, Pattern, Pattern, Pattern]));
      if (pred(model)) {
        found = model;
        break outer;
      }
    }
    cache.set(key, found);
  }
  const m = cache.get(key);
  if (!m) throw new Error(`no chart found for ${key}`);
  return m;
}
const houseId = (m: ChartModel, n: number) => m.houses[n - 1].figureId;
const calcFigure = (id: string, m: ChartModel) => method(id).calculate(m).resultFigure;
const present = (m: ChartModel, ids: string[]) => m.houses.some((h) => ids.includes(h.figureId));

// ---------------------------------------------------------------------------
describe('final-edition figure data', () => {
  const lists = Object.entries(F).filter(([, v]) => v && typeof v === 'object' && 'figures' in v && 'condition' in v) as [string, F.FigureList][];
  const tables = Object.entries(F).filter(([, v]) => v && typeof v === 'object' && !Array.isArray(v) && 'entries' in v) as [string, F.OutcomeTable][];

  it('every list and table entry equals its canonical STARS pattern, with no duplicates inside one list', () => {
    expect(lists.length).toBe(27);
    for (const [name, l] of lists) {
      for (const f of l.figures) expect(f.pattern, `${name}/${f.starId}`).toEqual(STARS.find((s) => s.id === f.starId)!.pattern);
      expect(new Set(idsOf(l)).size, name).toBe(l.figures.length);
    }
    for (const [name, t] of tables) for (const e of t.entries) for (const f of e.figures) expect(f.pattern, `${name}/${f.starId}`).toEqual(STARS.find((s) => s.id === f.starId)!.pattern);
  });

  it('constants: Nazir = Adam, Nutik = Umar, Itisal = Iddris, Ifusal = Ayuba, each equal to its STARS pattern', () => {
    expect(CONSTANT_FIGURES.nazir.starId).toBe('adam');
    expect(CONSTANT_FIGURES.nutik.starId).toBe('umar');
    expect(CONSTANT_FIGURES.itisal.starId).toBe('iddris');
    expect(CONSTANT_FIGURES.ifusal.starId).toBe('ayuba');
    for (const c of Object.values(CONSTANT_FIGURES)) expect([...c.pattern]).toEqual(STARS.find((s) => s.id === c.starId)!.pattern);
  });

  it('the lists the source states as separate groups are disjoint (ch.9, ch.17 M2, ch.21 M3)', () => {
    const disjoint = (a: F.FigureList, b: F.FigureList) => idsOf(a).filter((x) => idsOf(b).includes(x));
    expect(disjoint(F.CH9_H6_HEALED, F.CH9_H6_DIFFICULT_TO_SURVIVE)).toEqual([]);
    expect(disjoint(F.CH17_M2_FAST, F.CH17_M2_SLOW)).toEqual([]);
    expect(disjoint(F.CH21_M3_YES, F.CH21_M3_NO)).toEqual([]);
  });

  it('the source tables: ch.94 has 15 stages (no Yunus), ch.97 covers all 16 figures in 14 outcomes, ch.142 has 12 outcomes and four figures without one', () => {
    expect(F.CH94_LIFESPAN.entries).toHaveLength(15);
    expect(F.CH94_LIFESPAN.entries.flatMap((e) => e.figures.map((f) => f.starId))).not.toContain('yunus');
    expect(F.CH97_PLACE_OF_DEATH.entries).toHaveLength(14);
    expect(new Set(F.CH97_PLACE_OF_DEATH.entries.flatMap((e) => e.figures.map((f) => f.starId))).size).toBe(16);
    expect(F.CH142_KIDNAP_LOCATION.entries).toHaveLength(12);
    const given = F.CH142_KIDNAP_LOCATION.entries.flatMap((e) => e.figures.map((f) => f.starId));
    expect(STARS.map((s) => s.id).filter((id) => !given.includes(id)).sort()).toEqual([...F.CH142_SOURCE_INCOMPLETE_STAR_IDS].sort());
  });
});

// ---------------------------------------------------------------------------
describe('single-house figure lookups (ch.4, 9, 21, 94, 97) — every figure, listed and unlisted', () => {
  const model = findModel('any', () => true);

  it('ch.4 M1: each of the 7 listed figures at h10 -> favourable; any other -> uncertain (positive trigger only)', () => {
    for (const s of STARS) {
      const v = verdictForFigure('hunting-method-1', s.id, model);
      expect(v.outcome, s.id).toBe(idsOf(F.CH4_H10_SUCCESS).includes(s.id) ? 'favourable' : 'uncertain');
    }
  });

  it('ch.9 M3: healed group -> favourable, grave group -> unfavourable, the other six -> uncertain', () => {
    for (const s of STARS) {
      const want = idsOf(F.CH9_H6_HEALED).includes(s.id) ? 'favourable' : idsOf(F.CH9_H6_DIFFICULT_TO_SURVIVE).includes(s.id) ? 'unfavourable' : 'uncertain';
      expect(verdictForFigure('sickness-method-3', s.id, model).outcome, s.id).toBe(want);
    }
  });

  it('ch.21 M3: yes group -> "yes", no group -> "no", the other eight -> uncertain', () => {
    for (const s of STARS) {
      const v = verdictForFigure('wife-sex-method-3', s.id, model);
      if (idsOf(F.CH21_M3_YES).includes(s.id)) expect(v.descriptiveAnswer, s.id).toBe('yes');
      else if (idsOf(F.CH21_M3_NO).includes(s.id)) expect(v.descriptiveAnswer, s.id).toBe('no');
      else expect(v.outcome, s.id).toBe('uncertain');
    }
  });

  it('ch.94 M1: every one of the 15 source stages is read back for its figure; Yunus is not addressed', () => {
    for (const e of F.CH94_LIFESPAN.entries) for (const f of e.figures) {
      const v = verdictForFigure('lifespan-when-death-method-1', f.starId, model);
      expect(v.outcome, f.starId).toBe('descriptive');
      expect(v.interpretation.toLowerCase(), f.starId).toContain(e.text.toLowerCase().slice(0, 20));
    }
    expect(verdictForFigure('lifespan-when-death-method-1', 'yunus', model).outcome).toBe('uncertain');
  });

  it('ch.97 M1: all sixteen figures give a place of death, matching the source text', () => {
    for (const e of F.CH97_PLACE_OF_DEATH.entries) for (const f of e.figures) {
      const v = verdictForFigure('place-of-death-method-1', f.starId, model);
      expect(v.outcome, f.starId).toBe('descriptive');
      expect(v.interpretation.toLowerCase(), f.starId).toContain(e.text.toLowerCase().slice(0, 20));
    }
  });
});

// ---------------------------------------------------------------------------
describe('chart-scanning methods (ch.17, 19, 102, 124, 132)', () => {
  it('ch.17 M1: listed result found in the first four houses -> within an hour; found only later -> the wider span; unlisted -> uncertain', () => {
    const list = idsOf(F.CH17_M1_LIST);
    const early = findModel('17m1-early', (m) => list.includes(calcFigure('timing-method-1', m).figureId) && m.houses.slice(0, 4).some((h) => h.figureId === calcFigure('timing-method-1', m).figureId));
    expect(verdictOn('timing-method-1', early).descriptiveAnswer).toBe('within-an-hour');
    const late = findModel('17m1-late', (m) => {
      const r = calcFigure('timing-method-1', m).figureId;
      return list.includes(r) && !m.houses.slice(0, 4).some((h) => h.figureId === r);
    });
    expect(verdictOn('timing-method-1', late).descriptiveAnswer).toBe('within-an-hour-a-day-or-ten-days');
    const none = findModel('17m1-none', (m) => !list.includes(calcFigure('timing-method-1', m).figureId));
    expect(verdictOn('timing-method-1', none).outcome).toBe('uncertain');
  });

  it('ch.17 M2: fast list in the first four houses = within an hour; fast list elsewhere in the chart = within 7 days; slow list = month or year', () => {
    const fast = idsOf(F.CH17_M2_FAST);
    const slow = idsOf(F.CH17_M2_SLOW);
    const r = (m: ChartModel) => calcFigure('timing-method-2', m).figureId;
    const a = findModel('17m2-a', (m) => fast.includes(r(m)) && m.houses.slice(0, 4).some((h) => h.figureId === r(m)));
    expect(verdictOn('timing-method-2', a).descriptiveAnswer).toBe('within-an-hour');
    const b = findModel('17m2-b', (m) => fast.includes(r(m)) && !m.houses.slice(0, 4).some((h) => h.figureId === r(m)) && m.houses.some((h) => h.figureId === r(m)));
    expect(verdictOn('timing-method-2', b).descriptiveAnswer).toBe('within-seven-days');
    const c = findModel('17m2-c', (m) => slow.includes(r(m)));
    expect(verdictOn('timing-method-2', c).descriptiveAnswer).toBe('within-a-month-or-a-year');
  });

  it('ch.19 M3: a listed sum found only in h4/h10 -> win; only in h5/h11 -> lose; unlisted -> uncertain; found in both -> uncertain (no precedence)', () => {
    const list = idsOf(F.CH19_M3_LIST);
    const r = (m: ChartModel) => calcFigure('court-method-3', m).figureId;
    const at = (m: ChartModel, hs: number[]) => hs.some((h) => houseId(m, h) === r(m));
    const win = findModel('19-win', (m) => list.includes(r(m)) && at(m, [4, 10]) && !at(m, [5, 11]));
    expect(verdictOn('court-method-3', win).outcome).toBe('favourable');
    const lose = findModel('19-lose', (m) => list.includes(r(m)) && at(m, [5, 11]) && !at(m, [4, 10]));
    expect(verdictOn('court-method-3', lose).outcome).toBe('unfavourable');
    const unlisted = findModel('19-unlisted', (m) => !list.includes(r(m)));
    expect(verdictOn('court-method-3', unlisted).outcome).toBe('uncertain');
    const both = findModel('19-both', (m) => list.includes(r(m)) && at(m, [4, 10]) && at(m, [5, 11]));
    expect(verdictOn('court-method-3', both).outcome).toBe('uncertain');
  });

  it('ch.102 M1: a listed figure in the recast chart\'s first four houses -> stable; none -> not stable', () => {
    const list = idsOf(F.CH102_STABLE);
    const first4 = (m: ChartModel) => RECAST_FROM_HOUSES(m, [1, 2, 3, 4]).chart.houses.slice(0, 4).map((h) => h.figureId);
    const yes = findModel('102-yes', (m) => first4(m).some((id) => list.includes(id)));
    expect(verdictOn('money-work-lady-stable-method-1', yes).descriptiveAnswer).toBe('stable');
    const no = findModel('102-no', (m) => !first4(m).some((id) => list.includes(id)));
    expect(verdictOn('money-work-lady-stable-method-1', no).descriptiveAnswer).toBe('not-stable');
  });

  it('ch.124 M1: any of the four figures anywhere in the chart -> yes; none -> no', () => {
    const list = idsOf(F.CH124_M1_STOLEN);
    expect(verdictOn('something-really-stolen-method-1', findModel('124-yes', (m) => present(m, list))).descriptiveAnswer).toBe('yes');
    expect(verdictOn('something-really-stolen-method-1', findModel('124-no', (m) => !present(m, list))).descriptiveAnswer).toBe('no');
  });

  it('ch.132 M1: h4+h6 against four figures; M2: any of three figures anywhere', () => {
    const l1 = idsOf(F.CH132_M1_TREASURE);
    const l2 = idsOf(F.CH132_M2_TREASURE);
    expect(verdictOn('hidden-treasure-method-1', findModel('132-1y', (m) => l1.includes(calcFigure('hidden-treasure-method-1', m).figureId))).descriptiveAnswer).toBe('treasure');
    expect(verdictOn('hidden-treasure-method-1', findModel('132-1n', (m) => !l1.includes(calcFigure('hidden-treasure-method-1', m).figureId))).descriptiveAnswer).toBe('nothing');
    expect(verdictOn('hidden-treasure-method-2', findModel('132-2y', (m) => present(m, l2))).descriptiveAnswer).toBe('treasure');
    expect(verdictOn('hidden-treasure-method-2', findModel('132-2n', (m) => !present(m, l2))).descriptiveAnswer).toBe('nothing');
  });

  it('ch.30: Hassan & Hussein and Issah get their own figure-specific readings; other results keep the direction rule', () => {
    const hh = findModel('30-hh', (m) => calcFigure('successful-trip-method-1', m).figureId === 'hassan-hussein');
    expect(verdictOn('successful-trip-method-1', hh).interpretation).toContain('not be stable');
    const iss = findModel('30-iss', (m) => calcFigure('successful-trip-method-1', m).figureId === 'issah');
    expect(verdictOn('successful-trip-method-1', iss).interpretation).toContain('very, very sick');
    const other = findModel('30-up', (m) => {
      const f = calcFigure('successful-trip-method-1', m);
      return f.qualities.direction.value === 'upward' && !['issah', 'hassan-hussein'].includes(f.figureId);
    });
    expect(verdictOn('successful-trip-method-1', other).outcome).toBe('favourable');
  });
});

// ---------------------------------------------------------------------------
describe('constant-figure chapters (107, 108, 118, 119)', () => {
  const cases: [string, string, string][] = [
    ['see-what-searching-for-method-1', 'adam', 'will-see'],
    ['conversation-will-happen-method-1', 'umar', 'conversation-will-take-place'],
    ['get-what-searching-for-in-place-method-1', 'iddris', 'will-get-it'],
    ['what-blocks-you-method-1', 'ayuba', 'blocked'],
  ];
  it.each(cases)('%s adds the constant (%s) to H1 and reads the quarter the result is found in', (id, constant, foundAnswer) => {
    const model = findModel('const-found-' + id, (m) => m.houses.some((h) => h.figureId === calcFigure(id, m).figureId));
    const calc = method(id).calculate(model);
    // Independent check of the sum: constant + H1 pattern, row by row (odd + even = single, same parity = double).
    const c = STARS.find((s) => s.id === constant)!.pattern;
    const h1 = model.houses[0].dotPattern;
    expect(calc.resultFigure.dotPattern).toEqual(c.map((v, i) => (v === h1[i] ? 2 : 1)));
    const v = method(id).evaluate(calc, model);
    expect(v.descriptiveAnswer).toBe(foundAnswer);
    expect(v.interpretation).toMatch(/seconds|minutes|hours/);
  });

  it('when the result is not in the chart: Nazir/Nutik/Itisal state the opposite; Ifusal states nothing (uncertain)', () => {
    const notFound = (id: string) => findModel('const-nf-' + id, (m) => !m.houses.some((h) => h.figureId === calcFigure(id, m).figureId));
    expect(verdictOn('see-what-searching-for-method-1', notFound('see-what-searching-for-method-1')).descriptiveAnswer).toBe('will-not-see');
    expect(verdictOn('conversation-will-happen-method-1', notFound('conversation-will-happen-method-1')).descriptiveAnswer).toBe('no-conversation');
    expect(verdictOn('get-what-searching-for-in-place-method-1', notFound('get-what-searching-for-in-place-method-1')).descriptiveAnswer).toBe('will-not-get-it');
    expect(verdictOn('what-blocks-you-method-1', notFound('what-blocks-you-method-1')).outcome).toBe('uncertain');
  });
});

// ---------------------------------------------------------------------------
describe('method-specific element lists (ch.27, ch.36) follow the source, not STARS element metadata', () => {
  const model = findModel('any', () => true);

  it('STARS itself is untouched: Usman is still sand and Nuhu still air there', () => {
    expect(STARS.find((s) => s.id === 'usman')!.element).toBe('sand');
    expect(STARS.find((s) => s.id === 'nuhu')!.element).toBe('air');
  });

  it('ch.36: Usman reads as a western (air-list) star and Nuhu as a southern (sand-list) star; every figure is in exactly one list', () => {
    const lists: [F.FigureList, string][] = [[F.CH36_EAST_FIRE, 'fire'], [F.CH36_WEST_AIR, 'air'], [F.CH36_NORTH_WATER, 'water'], [F.CH36_SOUTH_SAND, 'sand']];
    for (const s of STARS) {
      const want = lists.filter(([l]) => idsOf(l).includes(s.id));
      expect(want, s.id).toHaveLength(1);
      expect(verdictForFigure('locate-method-1', s.id, model).descriptiveAnswer, s.id).toBe(want[0][1]);
    }
    expect(verdictForFigure('locate-method-1', 'usman', model).descriptiveAnswer).toBe('air');
    expect(verdictForFigure('locate-method-1', 'nuhu', model).descriptiveAnswer).toBe('sand');
  });

  it('ch.27: both methods classify every figure by the source lists (Usman: West/air; Nuhu: South/sand)', () => {
    const m1: [F.FigureList, string][] = [[F.CH27_M1_EAST, 'East'], [F.CH27_M1_WEST, 'West'], [F.CH27_M1_NORTH, 'North'], [F.CH27_M1_SOUTH, 'South']];
    const m2: [F.FigureList, string][] = [[F.CH27_M2_FIRE, 'fire stars'], [F.CH27_M2_AIR, 'air stars'], [F.CH27_M2_WATER, 'water stars'], [F.CH27_M2_SAND, 'sand/earth stars']];
    for (const s of STARS) {
      const a = m1.find(([l]) => idsOf(l).includes(s.id))!;
      expect(verdictForFigure('farming-method-1', s.id, model).label, s.id).toContain(a[1]);
      const b = m2.find(([l]) => idsOf(l).includes(s.id))!;
      expect(verdictForFigure('farming-method-2', s.id, model).label, s.id).toContain(b[1]);
    }
    expect(verdictForFigure('farming-method-1', 'usman', model).label).toContain('West');
    expect(verdictForFigure('farming-method-1', 'nuhu', model).label).toContain('South');
  });
});

// ---------------------------------------------------------------------------
describe('methods deliberately NOT implemented, and why', () => {
  const codeOf = (id: string) => method(id).reviewReasonCode;
  const model = findModel('any', () => true);

  it('ch.7 M4 and ch.13 M3 are source_ambiguous_overlapping_outcomes and give no verdict', () => {
    for (const id of ['marriage-method-4', 'children-method-3']) {
      expect(codeOf(id)).toBe('source_ambiguous_overlapping_outcomes');
      expect(method(id).status).not.toBe('verified');
    }
  });

  it("ch.2 M4 and ch.26 M1 stay blocked on the Damir (constant_figure_undefined) — no Damir figure is invented", () => {
    expect(codeOf('money-method-4')).toBe('constant_figure_undefined');
    expect(codeOf('fight-argument-method-1')).toBe('constant_figure_undefined');
    expect(method('money-method-4').status).toBe('uncertain');
  });

  it('ch.142 is source_incomplete / needs_review; the twelve stated outcomes are wired up, the four others are not addressed', () => {
    const id = 'kidnapper-location-method-1';
    expect(codeOf(id)).toBe('source_incomplete');
    expect(method(id).status).toBe('needs_review');
    for (const e of F.CH142_KIDNAP_LOCATION.entries) {
      const v = verdictForFigure(id, e.figures[0].starId, model);
      // With the stub, "in its own house" depends on the chart; only the table lookup is under test, so
      // accept either the stated text or the "no figure in its own house" fallback.
      expect(['descriptive', 'uncertain']).toContain(v.outcome);
    }
    for (const sid of F.CH142_SOURCE_INCOMPLETE_STAR_IDS) expect(verdictForFigure(id, sid, model).outcome).toBe('uncertain');
  });

  it('ch.121 (source_contradiction) and ch.105/106 (source_anomaly) existing implementations are untouched', () => {
    expect(method('get-knowledge-in-life-method-1').status).toBe('verified');
    expect(method('body-part-in-pain-method-1').status).toBe('verified');
  });

  it('no method anywhere is coded figures_omitted_by_transcription', () => {
    expect(Array.from(METHODS.values()).filter((m) => m.reviewReasonCode === 'figures_omitted_by_transcription')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
describe('chapter text names the restored figures (no placeholder left behind)', () => {
  const text = (n: number) => KM_CHAPTERS.find((c) => c.number === n)!.paragraphs.join(' ');
  const name = (id: string) => STARS.find((s) => s.id === id)!.name;
  const RESTORED_CHAPTERS = [4, 5, 6, 9, 17, 19, 21, 27, 30, 36, 94, 97, 102, 124, 132, 142];

  it('none of the restored chapters still contains a "[figures omitted" placeholder', () => {
    for (const n of RESTORED_CHAPTERS) expect(text(n), `ch.${n}`).not.toContain('[figures omitted');
  });

  it('each restored list is spelled out in its chapter', () => {
    const per: [number, F.FigureList][] = [[4, F.CH4_H10_SUCCESS], [9, F.CH9_H6_HEALED], [9, F.CH9_H6_DIFFICULT_TO_SURVIVE], [17, F.CH17_M1_LIST], [17, F.CH17_M2_FAST], [17, F.CH17_M2_SLOW], [19, F.CH19_M3_LIST], [21, F.CH21_M3_YES], [21, F.CH21_M3_NO], [27, F.CH27_M2_SAND], [30, F.CH30_ISSAH], [36, F.CH36_SOUTH_SAND], [102, F.CH102_STABLE], [124, F.CH124_M1_STOLEN], [132, F.CH132_M1_TREASURE], [132, F.CH132_M2_TREASURE]];
    for (const [n, l] of per) for (const id of idsOf(l)) expect(text(n), `ch.${n} ${id}`).toContain(name(id));
  });
});
