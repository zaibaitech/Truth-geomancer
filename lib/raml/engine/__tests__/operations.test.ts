import { describe, expect, it } from 'vitest';
import { buildChartModel } from '../chartModel';
import {
  ADD_FIGURE_TO_HOUSE,
  ADD_MULTIPLE_HOUSES,
  CHECK_ELEMENT,
  CHECK_FIGURE_PRESENT_IN_CHART,
  CHECK_HOUSE,
  CHECK_LINE_STATE,
  COMPARE_RESULTS,
  COUNT_ELEMENTS,
  COUNT_FIGURE_OCCURRENCES,
  EXTRACT_ELEMENT,
  MATCH_FIGURE,
  MATCH_QUALITIES,
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
