// Stage 2 of the engine's question coverage (Kanzul Mikban chapters 4-17,
// added on top of the original 5-question pilot — see questions/index.ts).
// Same fixture chart as the rest of the suite; every expected figure/
// outcome below was hand-computed against the addition rule before being
// relied on here (see /tmp/calc.mjs-style derivation in the PR description).
import { describe, expect, it } from 'vitest';
import { runEngine } from '../index';
import { fixtureChart } from './fixtures';

const chart = fixtureChart();

describe('Hunting/searching (ch.4) — fully blocked by omitted figures', () => {
  const result = runEngine(chart, 'hunting-in-water-and-on-land-and-searching')!;
  it('still returns a reading (not null) with an honest insufficient_data result', () => {
    expect(result).not.toBeNull();
    expect(result.overallResult).toBe('insufficient_data');
    expect(result.methods[0].method.status).toBe('uncertain');
    expect(result.methods[0].calculation).not.toBeNull(); // H10 is still shown
    expect(result.methods[0].verdict).toBeNull(); // status !== 'verified' -> no verdict, per the engine's own gate
  });
});

describe('Fight/war/court, H6 variant (ch.5) — fully blocked', () => {
  const result = runEngine(chart, 'if-you-will-win-a-fight-war-or')!;
  it('reports insufficient_data across both uncomputable methods', () => {
    expect(result.overallResult).toBe('insufficient_data');
    expect(result.methods).toHaveLength(2);
    result.methods.forEach((m) => expect(m.method.status).toBe('uncertain'));
  });
});

describe('Enemy/thief location (ch.6) — fully blocked', () => {
  it('reports insufficient_data', () => {
    const result = runEngine(chart, 'if-you-want-to-know-where-your-enemy')!;
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('Marriage and its blessings (ch.7)', () => {
  const result = runEngine(chart, 'marriage-and-its-blessings')!;

  it('Method 1: H1+H7+H4+H10 = Sulemana (level direction) -> uncertain (neither branch matches)', () => {
    const m1 = result.methods.find((m) => m.method.id === 'marriage-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('sulemana');
    expect(m1.verdict!.outcome).toBe('uncertain');
  });

  it('Method 2: sand-extract of H4/H8/H14/H16 = Iddris, found in chart -> favourable', () => {
    const m2 = result.methods.find((m) => m.method.id === 'marriage-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('iddris');
    expect(m2.verdict!.outcome).toBe('favourable');
  });

  it('Method 3: H4+H6+H12+H16 = Nuhu (air) -> unfavourable (not sand/fire)', () => {
    const m3 = result.methods.find((m) => m.method.id === 'marriage-method-3')!;
    expect(m3.calculation!.resultFigure.figureId).toBe('nuhu');
    expect(m3.verdict!.outcome).toBe('unfavourable');
  });

  it('Method 4 is uncertain (named figures omitted)', () => {
    const m4 = result.methods.find((m) => m.method.id === 'marriage-method-4')!;
    expect(m4.method.status).toBe('uncertain');
  });

  it('reports a conflict between Method 2 (favourable) and Method 3 (unfavourable)', () => {
    expect(result.calculationDetails.consensus.level).toBe('conflict');
  });
});

describe('Stay in a particular place (ch.8)', () => {
  it('H2+H16 = Issah, upward+bad -> unfavourable with a "not good to stay" note', () => {
    const result = runEngine(chart, 'if-one-will-stay-in-a-particular-place')!;
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('issah');
    expect(m1.verdict!.outcome).toBe('unfavourable');
    expect(m1.verdict!.interpretation).toContain('not good to stay');
  });
});

describe('Sickness survival (ch.9)', () => {
  const result = runEngine(chart, 'sickness-if-he-she-will-survive')!;

  it('Method 1: (H4+H6)+H8 = Iddris, good, found -> favourable with an Allah-cause note', () => {
    const m1 = result.methods.find((m) => m.method.id === 'sickness-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('iddris');
    expect(m1.verdict!.outcome).toBe('favourable');
    expect(m1.verdict!.interpretation).toContain('from Allah');
  });

  it('Method 2: H2+H5+H8+H11 = Adam, found -> favourable', () => {
    const m2 = result.methods.find((m) => m.method.id === 'sickness-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('adam');
    expect(m2.verdict!.outcome).toBe('favourable');
  });

  it('Method 3 uncertain (omitted figures); overall methods agree favourable', () => {
    const m3 = result.methods.find((m) => m.method.id === 'sickness-method-3')!;
    expect(m3.method.status).toBe('uncertain');
    expect(result.calculationDetails.consensus.level).toBe('agree');
    expect(result.overallResult).toBe('favourable');
  });
});

describe('Lost thing still around or gone (ch.10)', () => {
  const result = runEngine(chart, 'if-your-lost-thing-is-still-around-or')!;

  it('Method 1: H1+H5 = Ayuba, not found -> unfavourable', () => {
    const m1 = result.methods.find((m) => m.method.id === 'lost-around-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('ayuba');
    expect(m1.verdict!.outcome).toBe('unfavourable');
  });

  it('Method 2: H5+H16 = Hassan & Hussein, upward -> unfavourable ("out of town")', () => {
    const m2 = result.methods.find((m) => m.method.id === 'lost-around-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('hassan-hussein');
    expect(m2.verdict!.outcome).toBe('unfavourable');
  });

  it('Method 3: H8+H9 = Ibrahim (level) -> uncertain', () => {
    const m3 = result.methods.find((m) => m.method.id === 'lost-around-method-3')!;
    expect(m3.calculation!.resultFigure.figureId).toBe('ibrahim');
    expect(m3.verdict!.outcome).toBe('uncertain');
  });

  it('Method 4: H5+H6 = Ali (level) -> uncertain, but still notes the found-in-chart fact', () => {
    const m4 = result.methods.find((m) => m.method.id === 'lost-around-method-4')!;
    expect(m4.calculation!.resultFigure.figureId).toBe('ali');
    expect(m4.verdict!.outcome).toBe('uncertain');
    expect(m4.verdict!.interpretation).toMatch(/see it/);
  });

  it('Method 5: H1+H7 = Hassan & Hussein, not found -> unfavourable', () => {
    const m5 = result.methods.find((m) => m.method.id === 'lost-around-method-5')!;
    expect(m5.calculation!.resultFigure.figureId).toBe('hassan-hussein');
    expect(m5.verdict!.outcome).toBe('unfavourable');
  });

  it('the 3 computable methods (1, 2, 5) agree unfavourable', () => {
    expect(result.calculationDetails.consensus.level).toBe('agree');
    expect(result.overallResult).toBe('unfavourable');
  });
});

describe('Success at home vs. travel away (ch.11)', () => {
  const result = runEngine(chart, 'if-you-want-to-know-if-you-will-2')!;

  it('Method 1: H1+H2+H7+H8 = Kalla Allahu, upward -> unfavourable ("run from home")', () => {
    const m1 = result.methods.find((m) => m.method.id === 'success-at-home-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('kalla-allahu');
    expect(m1.verdict!.outcome).toBe('unfavourable');
  });

  it('Method 2: same houses, Kalla Allahu is a fire figure -> unfavourable ("run from home")', () => {
    const m2 = result.methods.find((m) => m.method.id === 'success-at-home-method-2')!;
    expect(m2.calculation!.resultFigure.element).toBe('fire');
    expect(m2.verdict!.outcome).toBe('unfavourable');
  });

  it('both methods agree on this chart, despite using two different axes', () => {
    expect(result.calculationDetails.consensus.level).toBe('agree');
  });
});

describe('Rich or not (ch.12)', () => {
  it('H1+H7+H4+H8 = Ali, air element -> favourable ("you will be rich")', () => {
    const result = runEngine(chart, 'if-you-want-to-know-if-you-will-3')!;
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('ali');
    expect(m1.verdict!.outcome).toBe('favourable');
  });
});

describe('Children from a lady (ch.13)', () => {
  const result = runEngine(chart, 'if-you-will-get-children-from-a-lady')!;

  it('Method 1 (EXTRACT_LINES mixed-element construction): fire@H1,air@H5,water@H4,sand@H10 = Ibrahim -> uncertain (middle-good, not addressed)', () => {
    const m1 = result.methods.find((m) => m.method.id === 'children-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('ibrahim');
    expect(m1.calculation!.housesUsed).toEqual([1, 5, 4, 10]);
    expect(m1.verdict!.outcome).toBe('uncertain');
  });

  it('Method 2: H1+H5+H11+H14 = Adam (fire) -> favourable ("very fast")', () => {
    const m2 = result.methods.find((m) => m.method.id === 'children-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('adam');
    expect(m2.verdict!.outcome).toBe('favourable');
  });

  it('Method 3 uncertain (omitted figures)', () => {
    const m3 = result.methods.find((m) => m.method.id === 'children-method-3')!;
    expect(m3.method.status).toBe('uncertain');
  });

  it('Method 4: H6+H10 = Ibrahim (level) -> uncertain', () => {
    const m4 = result.methods.find((m) => m.method.id === 'children-method-4')!;
    expect(m4.calculation!.resultFigure.figureId).toBe('ibrahim');
    expect(m4.verdict!.outcome).toBe('uncertain');
  });

  it('Method 5: water-extract of H2/H5/H7/H15 = Nuhu, water line opened + good -> favourable', () => {
    const m5 = result.methods.find((m) => m.method.id === 'children-method-5')!;
    expect(m5.calculation!.resultFigure.figureId).toBe('nuhu');
    expect(m5.calculation!.resultFigure.qualities.lineStates.water).toBe('opened');
    expect(m5.verdict!.outcome).toBe('favourable');
  });

  it('the 2 computable methods (2, 5) agree favourable', () => {
    expect(result.calculationDetails.consensus.level).toBe('agree');
    expect(result.overallResult).toBe('favourable');
  });
});

describe('Pregnancy stability (ch.14)', () => {
  it('H1+H5+H4+H10 = Ali, middle-good -> uncertain, reports insufficient_data overall', () => {
    const result = runEngine(chart, 'if-a-pregnancy-is-going-to-be-stable')!;
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('ali');
    expect(m1.verdict!.outcome).toBe('uncertain');
    expect(result.overallResult).toBe('insufficient_data');
  });
});

describe('Things will be better (ch.15)', () => {
  it('8-house sum = Ali, middle-good -> mixed (this method addresses all 3 fortune branches)', () => {
    const result = runEngine(chart, 'if-things-will-be-better-for-the-questioner')!;
    const m1 = result.methods[0];
    expect(m1.calculation!.resultFigure.figureId).toBe('ali');
    expect(m1.verdict!.outcome).toBe('mixed');
    expect(result.overallResult).toBe('mixed');
  });
});

describe('Overcome enemy (ch.16)', () => {
  const result = runEngine(chart, 'if-you-will-overcome-your-enemy-or-not')!;

  it('Method 1: H1+H12+H8+H13 = Hassan & Hussein (water) -> mixed ("overcome but not die")', () => {
    const m1 = result.methods.find((m) => m.method.id === 'overcome-enemy-method-1')!;
    expect(m1.calculation!.resultFigure.figureId).toBe('hassan-hussein');
    expect(m1.verdict!.outcome).toBe('mixed');
  });

  it('Method 2: H1+H12+H13+H14 = Yunus, good -> favourable', () => {
    const m2 = result.methods.find((m) => m.method.id === 'overcome-enemy-method-2')!;
    expect(m2.calculation!.resultFigure.figureId).toBe('yunus');
    expect(m2.verdict!.outcome).toBe('favourable');
  });

  it('reports "mixed" consensus (one favourable, one mixed — not a hard conflict)', () => {
    expect(result.calculationDetails.consensus.level).toBe('mixed');
  });

  it('reports overallResult as "mixed" too, matching the consensus level (Prompt 3.5 fix: a tied favourable/mixed count must not silently pick a side)', () => {
    expect(result.overallResult).toBe('mixed');
  });
});

describe('Timing of an event (ch.17) — fully blocked', () => {
  it('reports insufficient_data across both uncomputable methods', () => {
    const result = runEngine(chart, 'if-something-will-happen-in-an-hour-day')!;
    expect(result.overallResult).toBe('insufficient_data');
    result.methods.forEach((m) => expect(m.method.status).toBe('uncertain'));
  });
});
