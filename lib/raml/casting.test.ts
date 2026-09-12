// Regression coverage for the EXISTING casting engine (untouched by this
// session's engine work) — confirms it still behaves exactly as documented
// before any engine code is trusted to build on top of it.
import { describe, expect, it } from 'vitest';
import { addPatterns, addRows, buildChart, deriveDaughters, reduceCount } from './casting';
import { getStarByPattern } from '@/content/stars';
import { fixtureChart, FIXTURE_STAR_IDS, FIXTURE_MOTHERS } from './engine/__tests__/fixtures';

describe('addRows (the book\'s own worked examples: 2+2=2, 1+2=1, 1+1=2)', () => {
  it('same parity -> double dot', () => {
    expect(addRows(2, 2)).toBe(2);
    expect(addRows(1, 1)).toBe(2);
  });
  it('different parity -> single dot', () => {
    expect(addRows(1, 2)).toBe(1);
    expect(addRows(2, 1)).toBe(1);
  });
});

describe('addPatterns', () => {
  it('applies addRows line-by-line', () => {
    expect(addPatterns([1, 1, 2, 2], [1, 2, 1, 2])).toEqual([2, 1, 1, 2]);
  });
});

describe('reduceCount', () => {
  it('reduces any count above 16 by repeated subtraction of 16', () => {
    expect(reduceCount(17)).toBe(reduceCount(1));
    expect(reduceCount(33)).toBe(reduceCount(1));
  });
  it('odd -> single dot, even -> double dot', () => {
    expect(reduceCount(1)).toBe(1);
    expect(reduceCount(2)).toBe(2);
    expect(reduceCount(15)).toBe(1);
    expect(reduceCount(16)).toBe(2);
  });
});

describe('deriveDaughters', () => {
  it('reads across the Mothers\' corresponding lines', () => {
    const mothers = FIXTURE_MOTHERS;
    const daughters = deriveDaughters(mothers);
    expect(daughters[0]).toEqual([mothers[0][0], mothers[1][0], mothers[2][0], mothers[3][0]]);
    expect(daughters).toHaveLength(4);
  });
});

describe('buildChart (full 16-house shield chart)', () => {
  const chart = fixtureChart();

  it('produces exactly 16 houses, numbered 1-16, matching the tapped Mothers at H1-H4', () => {
    expect(chart.houses).toHaveLength(16);
    chart.houses.forEach((h, i) => expect(h.n).toBe(i + 1));
    FIXTURE_MOTHERS.forEach((pattern, i) => expect(chart.houses[i].pattern).toEqual(pattern));
  });

  it('matches this test suite\'s hand-verified fixture exactly, house by house', () => {
    chart.houses.forEach((h, i) => expect(h.star.id).toBe(FIXTURE_STAR_IDS[i]));
  });

  it('derives the Judge (H15) as Right Witness + Left Witness, and the Reconciler (H16) as Judge + H1', () => {
    // H13 = Right Witness (H9+H10), H14 = Left Witness (H11+H12)
    const rightWitness = addPatterns(chart.houses[8].pattern, chart.houses[9].pattern);
    const leftWitness = addPatterns(chart.houses[10].pattern, chart.houses[11].pattern);
    expect(chart.houses[14].pattern).toEqual(addPatterns(rightWitness, leftWitness));
    expect(chart.houses[15].pattern).toEqual(addPatterns(chart.houses[14].pattern, chart.houses[0].pattern));
  });

  it('every house\'s star is resolvable by its own pattern (round-trips through getStarByPattern)', () => {
    chart.houses.forEach((h) => expect(getStarByPattern(h.pattern).id).toBe(h.star.id));
  });
});
