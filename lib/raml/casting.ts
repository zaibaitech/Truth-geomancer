import type { DotRow, Pattern } from '@/content/stars';
import { getStarByPattern, type Star } from '@/content/stars';

export interface ChartHouse {
  n: number;
  pattern: Pattern;
  star: Star;
}

export interface Chart {
  houses: ChartHouse[]; // 16, index 0 => house 1
  createdAt: string;
}

/** Reduce a raw dot count (from tapping or a random draw) to 1 or 2, per the
 * counting method: subtract 16 while above it, then treat odd totals as a
 * single dot and even totals as a double dot on the final reduction step. */
export function reduceCount(rawCount: number): DotRow {
  let n = rawCount;
  if (n <= 0) n = 1;
  while (n > 16) n -= 16;
  return (n % 2 === 0 ? 2 : 1) as DotRow;
}

/** Classical geomantic addition: same parity -> double dot, different parity
 * -> single dot. Matches the book's own worked examples (2+2=2, 1+2=1, 1+1=2). */
export function addRows(a: DotRow, b: DotRow): DotRow {
  return (a === b ? 2 : 1) as DotRow;
}

export function addPatterns(a: Pattern, b: Pattern): Pattern {
  return [
    addRows(a[0], b[0]),
    addRows(a[1], b[1]),
    addRows(a[2], b[2]),
    addRows(a[3], b[3]),
  ];
}

/** Turn 4 Mother patterns into the 4 Daughters by reading across each line
 * of all four Mothers in turn (the standard "Bazdaaho" rearrangement). */
export function deriveDaughters(mothers: [Pattern, Pattern, Pattern, Pattern]): Pattern[] {
  const daughters: Pattern[] = [];
  for (let line = 0; line < 4; line++) {
    daughters.push([
      mothers[0][line],
      mothers[1][line],
      mothers[2][line],
      mothers[3][line],
    ]);
  }
  return daughters;
}

/** Build the full 16-house chart from 4 freshly cast Mother figures. */
export function buildChart(mothers: [Pattern, Pattern, Pattern, Pattern]): Chart {
  const daughters = deriveDaughters(mothers);
  const first8 = [...mothers, ...daughters]; // houses 1-8

  const nieces: Pattern[] = [
    addPatterns(first8[0], first8[1]), // h9  = h1+h2
    addPatterns(first8[2], first8[3]), // h10 = h3+h4
    addPatterns(first8[4], first8[5]), // h11 = h5+h6
    addPatterns(first8[6], first8[7]), // h12 = h7+h8
  ];

  const rightWitness = addPatterns(nieces[0], nieces[1]); // h13 = h9+h10
  const leftWitness = addPatterns(nieces[2], nieces[3]); // h14 = h11+h12
  const judge = addPatterns(rightWitness, leftWitness); // h15 = h13+h14
  const reconciler = addPatterns(judge, first8[0]); // h16 = h15+h1

  const patterns: Pattern[] = [
    ...first8,
    ...nieces,
    rightWitness,
    leftWitness,
    judge,
    reconciler,
  ];

  const houses: ChartHouse[] = patterns.map((pattern, i) => ({
    n: i + 1,
    pattern,
    star: getStarByPattern(pattern),
  }));

  return { houses, createdAt: new Date().toISOString() };
}

/** Cast a single Mother by generating 4 random line reductions — the digital
 * equivalent of drawing four lines of sand dots and counting them off. */
export function castRandomMother(): Pattern {
  return [
    reduceCount(1 + Math.floor(Math.random() * 16)),
    reduceCount(1 + Math.floor(Math.random() * 16)),
    reduceCount(1 + Math.floor(Math.random() * 16)),
    reduceCount(1 + Math.floor(Math.random() * 16)),
  ];
}

export function castRandomChart(): Chart {
  const mothers = [castRandomMother(), castRandomMother(), castRandomMother(), castRandomMother()] as [
    Pattern,
    Pattern,
    Pattern,
    Pattern,
  ];
  return buildChart(mothers);
}
