import { describe, expect, it } from 'vitest';
import { buildChartModel } from '../chartModel';
import {
  ADD_FIGURE_TO_HOUSE,
  ADD_MULTIPLE_HOUSES,
  CHECK_ELEMENT,
  CHECK_ELEMENT_ADJACENT_REPETITION,
  CHECK_FIGURE_ADJACENT_REPETITION,
  CHECK_FIGURE_PRESENT_IN_CHART,
  CHECK_HOUSE,
  CHECK_LINE_STATE,
  COMPARE_RESULTS,
  COUNT_DIRECTION,
  COUNT_ELEMENTS,
  COUNT_FIGURE_OCCURRENCES,
  COUNT_FORTUNE,
  EXTRACT_ELEMENT,
  EXTRACT_LINES,
  MATCH_FIGURE,
  MATCH_QUALITIES,
  RECAST_FROM_HOUSES,
} from '../operations';
import type { MethodResult } from '../types';
import type { Pattern } from '@/content/stars';
import { fixtureChart, FIXTURE_STAR_IDS } from './fixtures';

const chart = buildChartModel(fixtureChart());

describe('CHECK_HOUSE', () => {
  it('reads the correct figure at every house — no manual selection, just an index', () => {
    FIXTURE_STAR_IDS.forEach((expectedId, i) => {
      const { figure } = CHECK_HOUSE(chart, i + 1);
      expect(figure.figureId).toBe(expectedId);
      expect(figure.sourceHouses).toEqual([i + 1]);
    });
  });

  it('throws for an out-of-range house rather than silently returning something', () => {
    expect(() => CHECK_HOUSE(chart, 17)).toThrow();
    expect(() => CHECK_HOUSE(chart, 0)).toThrow();
  });
});

describe('ADD_MULTIPLE_HOUSES', () => {
  it('adds two houses correctly (H3 + H7 = Umar, hand-verified)', () => {
    const { figure, trace } = ADD_MULTIPLE_HOUSES(chart, [3, 7]);
    expect(figure.figureId).toBe('umar');
    expect(trace.description).toContain('H3');
    expect(trace.description).toContain('H7');
  });

  it('adding 4 houses is order- and grouping-independent (associativity)', () => {
    const direct = ADD_MULTIPLE_HOUSES(chart, [3, 7, 11, 15]);
    const shuffled = ADD_MULTIPLE_HOUSES(chart, [15, 3, 11, 7]);
    expect(direct.figure.figureId).toBe(shuffled.figure.figureId);
    expect(direct.figure.figureId).toBe('yussif'); // hand-verified: Mahadi+Nuhu+Ali+Ibrahim
  });

  it('rejects fewer than 2 houses', () => {
    expect(() => ADD_MULTIPLE_HOUSES(chart, [1])).toThrow();
  });
});

describe('ADD_FIGURE_TO_HOUSE', () => {
  it('chains correctly: (H2+H11) then +H7 = Yussif (hand-verified)', () => {
    const step1 = ADD_MULTIPLE_HOUSES(chart, [2, 11]);
    const step2 = ADD_FIGURE_TO_HOUSE(chart, step1.figure, 7);
    expect(step2.figure.figureId).toBe('yussif');
  });
});

describe('CHECK_FIGURE_PRESENT_IN_CHART / COUNT_FIGURE_OCCURRENCES', () => {
  it('finds a figure that does occur in the fixture chart (Yussif, at H1)', () => {
    const yussifPattern = chart.houses[0].dotPattern;
    expect(CHECK_FIGURE_PRESENT_IN_CHART(chart, yussifPattern).found).toBe(true);
    expect(COUNT_FIGURE_OCCURRENCES(chart, yussifPattern).count).toBe(1);
  });

  it('counts a figure occurring more than once (Issah appears at H6 and H8)', () => {
    const issahPattern = chart.houses[5].dotPattern;
    expect(COUNT_FIGURE_OCCURRENCES(chart, issahPattern).count).toBe(2);
  });

  it('correctly reports a figure absent from the chart (Ayuba does not occur)', () => {
    const ayuba: Pattern = [2, 2, 2, 1];
    expect(CHECK_FIGURE_PRESENT_IN_CHART(chart, ayuba).found).toBe(false);
    expect(COUNT_FIGURE_OCCURRENCES(chart, ayuba).count).toBe(0);
  });
});

describe('EXTRACT_ELEMENT', () => {
  it('reads one element line across 4 houses and stacks a new figure (hand-verified)', () => {
    // Fire line of H3(Mahadi)=2, H7(Nuhu)=2, H11(Ali)=2, H15(Ibrahim)=1 -> [2,2,2,1] = Ayuba
    const { figure } = EXTRACT_ELEMENT(chart, [3, 7, 11, 15], 'fire');
    expect(figure.dotPattern).toEqual([2, 2, 2, 1]);
    expect(figure.figureId).toBe('ayuba');
  });

  it('rejects a house list that is not exactly 4 long', () => {
    expect(() => EXTRACT_ELEMENT(chart, [3, 7, 11], 'fire')).toThrow();
    expect(() => EXTRACT_ELEMENT(chart, [3, 7, 11, 15, 1], 'fire')).toThrow();
  });
});

describe('EXTRACT_LINES (general form: a different element per house)', () => {
  it('reads a different named line from each of 4 houses (hand-verified, Kanzul Mikban ch.13 shape)', () => {
    // fire@H1(Yussif=[1,1,2,1])=1, air@H5(Kalla Allahu=[1,1,2,2])=1,
    // water@H4(Iddris=[2,2,1,2])=1, sand@H10(Usman=[2,1,2,1])=1 -> [1,1,1,1] = Ibrahim
    const { figure } = EXTRACT_LINES(chart, [
      { house: 1, element: 'fire' },
      { house: 5, element: 'air' },
      { house: 4, element: 'water' },
      { house: 10, element: 'sand' },
    ]);
    expect(figure.dotPattern).toEqual([1, 1, 1, 1]);
    expect(figure.figureId).toBe('ibrahim');
  });

  it('is what EXTRACT_ELEMENT delegates to (same element per house reproduces EXTRACT_ELEMENT exactly)', () => {
    const viaExtractElement = EXTRACT_ELEMENT(chart, [3, 7, 11, 15], 'fire').figure;
    const viaExtractLines = EXTRACT_LINES(chart, [3, 7, 11, 15].map((house) => ({ house, element: 'fire' as const }))).figure;
    expect(viaExtractLines.dotPattern).toEqual(viaExtractElement.dotPattern);
  });

  it('rejects anything other than exactly 4 picks', () => {
    expect(() => EXTRACT_LINES(chart, [{ house: 1, element: 'fire' }])).toThrow();
  });
});

describe('CHECK_ELEMENT / CHECK_LINE_STATE', () => {
  it('reports the correct element for a figure', () => {
    const { figure } = CHECK_HOUSE(chart, 11); // Ali
    expect(CHECK_ELEMENT(figure).element).toBe('air');
  });

  it('reports opened for a single dot and closed for a double dot, per line', () => {
    const { figure } = CHECK_HOUSE(chart, 1); // Yussif = [1,1,2,1]
    expect(CHECK_LINE_STATE(figure, 'fire')).toBe('opened');
    expect(CHECK_LINE_STATE(figure, 'air')).toBe('opened');
    expect(CHECK_LINE_STATE(figure, 'water')).toBe('closed');
    expect(CHECK_LINE_STATE(figure, 'sand')).toBe('opened');
  });
});

describe('COUNT_ELEMENTS', () => {
  it('tallies elements across the whole chart', () => {
    const tally = COUNT_ELEMENTS(chart);
    expect(tally.fire + tally.air + tally.water + tally.sand).toBe(16);
  });

  it('tallies elements across a specific house subset', () => {
    const tally = COUNT_ELEMENTS(chart, [1, 2, 3, 4]);
    expect(tally.fire + tally.air + tally.water + tally.sand).toBe(4);
  });
});

describe('MATCH_FIGURE / MATCH_QUALITIES', () => {
  it('matches a figure by id', () => {
    const { figure } = CHECK_HOUSE(chart, 1);
    expect(MATCH_FIGURE(figure, 'yussif')).toBe(true);
    expect(MATCH_FIGURE(figure, 'adam')).toBe(false);
  });

  it('matches on fortune and direction together', () => {
    const { figure } = CHECK_HOUSE(chart, 2); // Adam: good, upward
    expect(MATCH_QUALITIES(figure, { fortune: 'good', direction: 'upward' })).toBe(true);
    expect(MATCH_QUALITIES(figure, { fortune: 'bad' })).toBe(false);
  });
});

describe('CHECK_FIGURE_PRESENT_IN_CHART with a house subset (ch.35)', () => {
  it('restricts the search to the given houses, unlike the whole-chart form', () => {
    const yussifPattern = chart.houses[0].dotPattern; // H1 only
    expect(CHECK_FIGURE_PRESENT_IN_CHART(chart, yussifPattern, [1, 2, 3, 4]).found).toBe(true);
    expect(CHECK_FIGURE_PRESENT_IN_CHART(chart, yussifPattern, [5, 6, 7, 8]).found).toBe(false);
    // Still finds it chart-wide when no subset is given — fully backward compatible.
    expect(CHECK_FIGURE_PRESENT_IN_CHART(chart, yussifPattern).found).toBe(true);
  });
});

describe('COUNT_FORTUNE / COUNT_DIRECTION (chs. 20, 22)', () => {
  it('tallies fortune across the whole fixture chart (hand-verified against classicalAttributes.ts)', () => {
    // good: H2,H3,H4,H5,H7,H9,H10,H16=8 · bad: H1,H6,H8,H12=4 · middleGood: H11,H13,H14,H15=4
    expect(COUNT_FORTUNE(chart)).toEqual({ good: 8, middleGood: 4, bad: 4 });
  });

  it('tallies direction across the whole fixture chart, excluding "level" houses from either side', () => {
    // upward: H2,H5,H6,H8=4 · downward: H3,H7,H9,H10=4 · the remaining 8 are level (null), counted in neither
    expect(COUNT_DIRECTION(chart)).toEqual({ upward: 4, downward: 4 });
  });

  it('respects an explicit house subset, same shape as COUNT_ELEMENTS', () => {
    expect(COUNT_FORTUNE(chart, [1, 2, 3, 4])).toEqual({ good: 3, middleGood: 0, bad: 1 });
  });
});

describe('CHECK_FIGURE_ADJACENT_REPETITION / CHECK_ELEMENT_ADJACENT_REPETITION (ch.32)', () => {
  it('finds a figure repeating in two consecutive houses (Usman at H9 and H10)', () => {
    const usmanPattern = chart.houses[8].dotPattern;
    expect(CHECK_FIGURE_ADJACENT_REPETITION(chart, usmanPattern).found).toBe(true);
  });

  it('does not report adjacency for a figure that only occurs once (Ali, H11 alone)', () => {
    const aliPattern = chart.houses[10].dotPattern;
    expect(CHECK_FIGURE_ADJACENT_REPETITION(chart, aliPattern).found).toBe(false);
  });

  it('finds an element repeating in two consecutive houses (sand at H9/H10, water at H14/H15)', () => {
    expect(CHECK_ELEMENT_ADJACENT_REPETITION(chart, 'sand').found).toBe(true);
    expect(CHECK_ELEMENT_ADJACENT_REPETITION(chart, 'water').found).toBe(true);
  });

  it('correctly reports no adjacent repetition for an element that never occupies two consecutive houses (air)', () => {
    expect(CHECK_ELEMENT_ADJACENT_REPETITION(chart, 'air').found).toBe(false);
  });
});

describe('RECAST_FROM_HOUSES (ch.34 method 1)', () => {
  it('treats 4 named houses as fresh Mothers and derives a whole new 16-house chart (hand-verified)', () => {
    const { chart: newChart, trace } = RECAST_FROM_HOUSES(chart, [3, 7, 11, 15]);
    expect(newChart.houses).toHaveLength(16);
    expect(newChart.houses[0].figureId).toBe('mahadi'); // new Mother 1 = old H3
    expect(newChart.houses[12].figureId).toBe('yussif'); // new H13, hand-verified
    expect(trace.description).toContain('H3');
    expect(trace.description).toContain('H15');
  });

  it('does not mutate or otherwise touch the original chart', () => {
    const before = JSON.stringify(chart);
    RECAST_FROM_HOUSES(chart, [3, 7, 11, 15]);
    expect(JSON.stringify(chart)).toBe(before);
  });
});

describe('COMPARE_RESULTS (method consensus)', () => {
  const mk = (outcome: 'favourable' | 'unfavourable' | 'mixed' | 'uncertain', id = 'm'): MethodResult => ({
    method: { id, label: id, status: 'verified', source: { book: 'kanzul-mikban', chapterId: 'x', quote: '' } },
    calculation: null,
    verdict: outcome === 'uncertain' ? null : { outcome, label: '', interpretation: '' },
  });

  it('reports agreement when every computable method favours the same outcome', () => {
    const c = COMPARE_RESULTS([mk('favourable', 'a'), mk('favourable', 'b'), mk('favourable', 'c')]);
    expect(c.level).toBe('agree');
    expect(c.favourableCount).toBe(3);
  });

  it('reports mostly_agree when a clear majority (but not all) agree', () => {
    const c = COMPARE_RESULTS([mk('favourable', 'a'), mk('favourable', 'b'), mk('unfavourable', 'c')]);
    expect(c.level).toBe('mostly_agree');
  });

  it('reports conflict on a clean favourable-vs-unfavourable split', () => {
    const c = COMPARE_RESULTS([mk('favourable', 'a'), mk('unfavourable', 'b')]);
    expect(c.level).toBe('conflict');
  });

  it('reports conflict on a three-way even split including a mixed result', () => {
    const c = COMPARE_RESULTS([mk('favourable', 'a'), mk('unfavourable', 'b'), mk('mixed', 'c')]);
    expect(c.level).toBe('conflict');
  });

  it('excludes uncertain methods from the tally rather than treating them as a vote', () => {
    const c = COMPARE_RESULTS([mk('favourable', 'a'), mk('favourable', 'b'), mk('uncertain', 'c')]);
    expect(c.level).toBe('agree');
    expect(c.verifiableCount).toBe(2);
    expect(c.uncertainCount).toBe(1);
  });

  it('reports insufficient_data when nothing is computable', () => {
    const c = COMPARE_RESULTS([mk('uncertain', 'a'), mk('uncertain', 'b')]);
    expect(c.level).toBe('insufficient_data');
  });

  it('handles a single verifiable method as agreement with itself', () => {
    const c = COMPARE_RESULTS([mk('favourable', 'a')]);
    expect(c.level).toBe('agree');
  });
});
