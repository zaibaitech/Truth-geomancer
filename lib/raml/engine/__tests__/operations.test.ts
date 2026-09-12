import { describe, expect, it } from 'vitest';
import { buildChartModel } from '../chartModel';
import {
  ADD_FIGURE_TO_HOUSE,
  ADD_FIGURES,
  ADD_MULTIPLE_HOUSES,
  CHECK_ELEMENT,
  CHECK_ELEMENT_ADJACENT_REPETITION,
  CHECK_FIGURE_ADJACENT_REPETITION,
  CHECK_FIGURE_PRESENT_IN_CHART,
  CHECK_HOUSE,
  CHECK_LINE_STATE,
  COMPARE_RESULTS,
  CAST_OUT_BY,
  COUNT_DIRECTION,
  COUNT_ELEMENTS,
  COUNT_FIGURE_OCCURRENCES,
  COUNT_FORTUNE,
  COUNT_OPENED_LINES,
  COUNT_TOTAL_DOTS,
  EXTRACT_ELEMENT,
  EXTRACT_LINES,
  FIND_FIGURE_QUARTER,
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

describe('ADD_FIGURES (Prompt 7 — shared by chs. 62, 67, 74)', () => {
  it('adds two already-computed figures, same math as ADD_MULTIPLE_HOUSES', () => {
    const h1 = CHECK_HOUSE(chart, 1).figure; // Yussif 1121
    const h2 = CHECK_HOUSE(chart, 2).figure; // Adam 1222
    // same-parity -> double(2), different -> single(1): [2,1,2,1] = Usman
    const { figure } = ADD_FIGURES([h1, h2]);
    expect(figure.figureId).toBe('usman');
  });

  it('adds three or more figures left-to-right, same result as chaining ADD_MULTIPLE_HOUSES', () => {
    const h1 = CHECK_HOUSE(chart, 1).figure;
    const h2 = CHECK_HOUSE(chart, 2).figure;
    const h3 = CHECK_HOUSE(chart, 3).figure; // Mahadi 2111
    const { figure } = ADD_FIGURES([h1, h2, h3]);
    const { figure: viaHouses } = ADD_MULTIPLE_HOUSES(chart, [1, 2, 3]);
    expect(figure.dotPattern).toEqual(viaHouses.dotPattern);
  });

  it('unions every input figure\'s own sourceHouses, in order', () => {
    const a = EXTRACT_ELEMENT(chart, [1, 5, 9, 13], 'fire').figure;
    const b = EXTRACT_ELEMENT(chart, [2, 6, 10, 14], 'air').figure;
    const { figure } = ADD_FIGURES([a, b]);
    expect(figure.sourceHouses).toEqual([1, 5, 9, 13, 2, 6, 10, 14]);
  });

  it('throws with fewer than 2 figures', () => {
    const h1 = CHECK_HOUSE(chart, 1).figure;
    expect(() => ADD_FIGURES([h1])).toThrow();
  });
});

describe('COUNT_OPENED_LINES (ch.78)', () => {
  it('counts single-dot lines across the whole chart', () => {
    // Cross-checked against COUNT_TOTAL_DOTS: 33 opened (x1) + 31 closed (x2) = 95.
    expect(COUNT_OPENED_LINES(chart).count).toBe(33);
  });

  it('counts single-dot lines across a house subset (ch.78: h1-h6)', () => {
    // H1=3, H2=1, H3=3, H4=1, H5=2, H6=2 -> 12
    expect(COUNT_OPENED_LINES(chart, [1, 2, 3, 4, 5, 6]).count).toBe(12);
  });

  it('throws for an out-of-range house in the subset', () => {
    expect(() => COUNT_OPENED_LINES(chart, [1, 17])).toThrow();
  });
});

describe('FIND_FIGURE_QUARTER (Prompt 6 — shared by chs. 31, 35, 55)', () => {
  it('finds a figure that only occurs in the Mothers quarter (H1-4)', () => {
    // Yussif (1121) occurs only at H1 on the fixture chart.
    const yussifPattern = chart.houses[0].dotPattern;
    expect(FIND_FIGURE_QUARTER(chart, yussifPattern).quarter).toBe('mothers');
  });

  it('finds a figure that occurs (only) in the Daughters quarter (H5-8)', () => {
    // Issah (1212) occurs at H6 and H8 on the fixture chart — both Daughters.
    const issahPattern = chart.houses[5].dotPattern;
    expect(FIND_FIGURE_QUARTER(chart, issahPattern).quarter).toBe('daughters');
  });

  it('finds a figure that occurs (only) in the Nieces quarter (H9-12)', () => {
    // Usman (2121) occurs at H9 and H10 on the fixture chart — both Nieces.
    const usmanPattern = chart.houses[8].dotPattern;
    expect(FIND_FIGURE_QUARTER(chart, usmanPattern).quarter).toBe('nieces');
  });

  it('finds a figure that occurs (only) in the Witnesses/Judge/Reconciler quarter (H13-16)', () => {
    // Musah (2222) occurs only at H13 on the fixture chart.
    const musahPattern = chart.houses[12].dotPattern;
    expect(FIND_FIGURE_QUARTER(chart, musahPattern).quarter).toBe('witnesses');
  });

  it('returns null when the pattern matches none of the chart\'s own 16 houses', () => {
    // Ayuba (2221) is not among this fixture chart's 16 star ids.
    const ayubaPattern: Pattern = [2, 2, 2, 1];
    expect(FIND_FIGURE_QUARTER(chart, ayubaPattern).quarter).toBeNull();
  });

  it('is deterministic — repeated calls on the same chart/pattern always agree', () => {
    const pattern = chart.houses[0].dotPattern;
    const a = FIND_FIGURE_QUARTER(chart, pattern).quarter;
    const b = FIND_FIGURE_QUARTER(chart, pattern).quarter;
    expect(a).toBe(b);
  });
});

describe('COUNT_TOTAL_DOTS / CAST_OUT_BY (ch.56)', () => {
  it('sums every line of every house in the whole chart (hand-verified against the fixture patterns)', () => {
    // H1 1121=5, H2 1222=7, H3 2111=5, H4 2212=7, H5 1122=6, H6 1212=6,
    // H7 2211=6, H8 1212=6, H9 2121=6, H10 2121=6, H11 2112=6, H12 1221=6,
    // H13 2222=8, H14 1111=4, H15 1111=4, H16 2212=7 → 95
    expect(COUNT_TOTAL_DOTS(chart).total).toBe(95);
  });

  it('sums only the given house subset when provided', () => {
    // H1..H4 = 5+7+5+7 = 24
    expect(COUNT_TOTAL_DOTS(chart, [1, 2, 3, 4]).total).toBe(24);
  });

  it('throws for an out-of-range house in the subset', () => {
    expect(() => COUNT_TOTAL_DOTS(chart, [1, 17])).toThrow();
  });

  it('"casts out by 3s": maps any positive total into 1..3, remainder 0 -> 3', () => {
    expect(CAST_OUT_BY(95, 3)).toBe(2); // 95 = 31*3 + 2
    expect(CAST_OUT_BY(9, 3)).toBe(3); // exact multiple -> n, never 0
    expect(CAST_OUT_BY(1, 3)).toBe(1);
    expect(CAST_OUT_BY(4, 3)).toBe(1);
  });

  it('also works for other moduli, e.g. casting out by 4s', () => {
    expect(CAST_OUT_BY(8, 4)).toBe(4);
    expect(CAST_OUT_BY(10, 4)).toBe(2);
  });

  it('rejects a non-positive total or modulus', () => {
    expect(() => CAST_OUT_BY(0, 3)).toThrow();
    expect(() => CAST_OUT_BY(5, 0)).toThrow();
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

  it('throws for an out-of-range house in the subset, rather than silently ignoring it', () => {
    const yussifPattern = chart.houses[0].dotPattern;
    expect(() => CHECK_FIGURE_PRESENT_IN_CHART(chart, yussifPattern, [1, 17])).toThrow();
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

  it('handles an empty house subset without crashing (a real, non-error edge case, unlike an out-of-range house number)', () => {
    expect(COUNT_FORTUNE(chart, [])).toEqual({ good: 0, middleGood: 0, bad: 0 });
    expect(COUNT_DIRECTION(chart, [])).toEqual({ upward: 0, downward: 0 });
  });

  it('throws for an out-of-range house in the subset, same as every other house-taking operation', () => {
    expect(() => COUNT_FORTUNE(chart, [1, 17])).toThrow();
    expect(() => COUNT_DIRECTION(chart, [0])).toThrow();
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

  it('is deterministic: the same 4 houses, called twice, produce a structurally identical secondary chart', () => {
    // Compared on .houses only, not the whole chart object — buildChart
    // stamps a fresh createdAt (real wall-clock time) on every call, so two
    // back-to-back calls can legitimately land on different milliseconds;
    // that's not a determinism bug, it's just not "structural."
    const first = RECAST_FROM_HOUSES(chart, [3, 7, 11, 15]);
    const second = RECAST_FROM_HOUSES(chart, [3, 7, 11, 15]);
    expect(JSON.stringify(first.chart.houses)).toBe(JSON.stringify(second.chart.houses));
  });

  it('is order-SENSITIVE (unlike ADD_MULTIPLE_HOUSES): the 4 houses become Mothers 1-4 in the exact order given, so reordering them changes the resulting chart', () => {
    // This is the key audit finding for RECAST_FROM_HOUSES: geomantic
    // ADDITION is associative/commutative (order never matters — see
    // ADD_MULTIPLE_HOUSES above), but building 4 fresh MOTHERS is not —
    // Daughters/Nieces are derived by reading a fixed line position ACROSS
    // the 4 Mothers in order, so which house becomes Mother 1 vs. Mother 3
    // genuinely changes every house of the derived chart. Kanzul Mikban ch.34
    // Method 1 names its houses "h3, h7, h11 and h15" in a specific order;
    // this implementation reads them in exactly that left-to-right order —
    // a reasonable, deterministic interpretation, but a real interpretive
    // choice worth keeping visible rather than silently assumed.
    const inOrder = RECAST_FROM_HOUSES(chart, [3, 7, 11, 15]);
    const reordered = RECAST_FROM_HOUSES(chart, [15, 11, 7, 3]);
    expect(JSON.stringify(inOrder.chart)).not.toBe(JSON.stringify(reordered.chart));
  });

  it('produces a structurally valid 16-house chart with a real createdAt timestamp', () => {
    const { chart: newChart } = RECAST_FROM_HOUSES(chart, [3, 7, 11, 15]);
    expect(newChart.houses).toHaveLength(16);
    newChart.houses.forEach((h, i) => {
      expect(h.houseNumber).toBe(i + 1);
      expect(h.dotPattern).toHaveLength(4);
      expect(h.figureId).toBeTruthy();
    });
    expect(typeof newChart.createdAt).toBe('string');
  });

  it('throws for an out-of-range house, same input validation every other operation already relies on', () => {
    expect(() => RECAST_FROM_HOUSES(chart, [3, 7, 11, 17])).toThrow();
    expect(() => RECAST_FROM_HOUSES(chart, [0, 7, 11, 15])).toThrow();
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

  it('tags every outcome-model consensus with kind: "outcome" and a null descriptiveAnswer', () => {
    const c = COMPARE_RESULTS([mk('favourable', 'a')]);
    expect(c.kind).toBe('outcome');
    expect(c.descriptiveAnswer).toBeNull();
  });
});

describe('COMPARE_RESULTS — descriptive questions (Prompt 4.5)', () => {
  const mkDescriptive = (answer: string, id = 'm'): MethodResult => ({
    method: { id, label: id, status: 'verified', source: { book: 'kanzul-mikban', chapterId: 'x', quote: '' } },
    calculation: null,
    verdict: { outcome: 'descriptive', label: answer, interpretation: `The answer is ${answer}.`, descriptiveAnswer: answer },
  });
  const mkUncomputable = (id = 'm'): MethodResult => ({
    method: { id, label: id, status: 'uncertain', source: { book: 'kanzul-mikban', chapterId: 'x', quote: '' } },
    calculation: null,
    verdict: null,
  });

  it('reports "agree" and the shared answer when every counted method matches (categorical equality, not a favourable/unfavourable tally)', () => {
    const c = COMPARE_RESULTS([mkDescriptive('east', 'a'), mkDescriptive('east', 'b'), mkDescriptive('east', 'c')], 'descriptive');
    expect(c.kind).toBe('descriptive');
    expect(c.level).toBe('agree');
    expect(c.descriptiveAnswer).toBe('east');
    // The favourable/unfavourable/mixed tally fields stay at zero — a descriptive
    // question was never voted on that axis, so nothing should populate it.
    expect(c.favourableCount).toBe(0);
    expect(c.unfavourableCount).toBe(0);
    expect(c.mixedCount).toBe(0);
  });

  it('reports "disagree" (not "mixed" or "conflict") when counted methods give different categorical answers', () => {
    const c = COMPARE_RESULTS([mkDescriptive('east', 'a'), mkDescriptive('west', 'b')], 'descriptive');
    expect(c.level).toBe('disagree');
    expect(c.descriptiveAnswer).toBeNull(); // no single answer to report on a real mismatch
  });

  it('a single descriptive method agrees with itself, same as the outcome model', () => {
    const c = COMPARE_RESULTS([mkDescriptive('water', 'a')], 'descriptive');
    expect(c.level).toBe('agree');
    expect(c.descriptiveAnswer).toBe('water');
  });

  it('reports insufficient_data when a descriptive question has nothing computable, honestly labeled with kind: "descriptive"', () => {
    const c = COMPARE_RESULTS([mkUncomputable('a'), mkUncomputable('b')], 'descriptive');
    expect(c.kind).toBe('descriptive');
    expect(c.level).toBe('insufficient_data');
    expect(c.descriptiveAnswer).toBeNull();
  });

  it('respects the question\'s declared resultKind even if every method happens to fail — never silently reclassified as an outcome question', () => {
    // Passing resultKind explicitly (as ruleEngine.ts now does, from
    // question.resultKind) rather than inferring it from verdict shapes
    // means a descriptive question with zero surviving verdicts still
    // reports kind: 'descriptive', not kind: 'outcome'.
    const c = COMPARE_RESULTS([mkUncomputable('a')], 'descriptive');
    expect(c.kind).toBe('descriptive');
  });

  it('defaults to the outcome model when resultKind is omitted, for full backward compatibility', () => {
    const favourable: MethodResult = {
      method: { id: 'a', label: 'a', status: 'verified', source: { book: 'kanzul-mikban', chapterId: 'x', quote: '' } },
      calculation: null,
      verdict: { outcome: 'favourable', label: '', interpretation: '' },
    };
    const c = COMPARE_RESULTS([favourable]);
    expect(c.kind).toBe('outcome');
  });
});
