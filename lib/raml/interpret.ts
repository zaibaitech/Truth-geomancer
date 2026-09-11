import type { Chart, ChartHouse } from './casting';
import { addPatterns } from './casting';
import { getStarByPattern, ELEMENT_LABEL, type Element, type Star } from '@/content/stars';

function houseAt(chart: Chart, n: number): ChartHouse {
  const h = chart.houses[n - 1];
  if (!h) throw new Error(`Chart has no house ${n}`);
  return h;
}

function sumHouses(chart: Chart, ns: number[]): Star {
  let pattern = houseAt(chart, ns[0]).pattern;
  for (const n of ns.slice(1)) {
    pattern = addPatterns(pattern, houseAt(chart, n).pattern);
  }
  return getStarByPattern(pattern);
}

export interface BurujiResult {
  method: string;
  houses: number[];
  star: Star;
}

/** "Knowing your star (Buruji)" — three traditional methods from Chapter 6. */
export function findBuruji(chart: Chart): BurujiResult[] {
  return [
    { method: 'House 1 alone', houses: [1], star: houseAt(chart, 1).star },
    { method: 'Houses 2 + 4 + 10 + 16', houses: [2, 4, 10, 16], star: sumHouses(chart, [2, 4, 10, 16]) },
    { method: 'Houses 1 + 8', houses: [1, 8], star: sumHouses(chart, [1, 8]) },
  ];
}

export interface SpiritualStrength {
  tally: Record<Element, number>;
  dominant: Element;
  verdict: string;
}

const STRENGTH_VERDICT: Record<Element, string> = {
  sand: 'Spiritually active and doing well — keep it up.',
  water: 'Spiritually okay, but do not relax.',
  fire: 'Below where it should be — serious prayer is needed.',
  air: 'Spiritually at zero — a wake-up call. Either the prayers are missing, or they are the wrong ones.',
};

/** "To know how spiritually strong one is" — Houses 1, 10, 13, 14, 15. */
export function spiritualStrength(chart: Chart): SpiritualStrength {
  const ns = [1, 10, 13, 14, 15];
  const tally: Record<Element, number> = { fire: 0, air: 0, water: 0, sand: 0 };
  for (const n of ns) tally[houseAt(chart, n).star.element] += 1;

  let dominant: Element = 'sand';
  (Object.keys(tally) as Element[]).forEach((el) => {
    if (tally[el] > tally[dominant]) dominant = el;
  });

  return { tally, dominant, verdict: STRENGTH_VERDICT[dominant] };
}

export interface CausesResult {
  houses: number[];
  star: Star;
  reading: string;
}

const CAUSE_BY_ELEMENT: Record<Element, string> = {
  fire: 'Enmity — most likely a dispute between the querent (or their family) and someone else.',
  air: 'Enemies who have taken the matter to idol-worshippers out of envy over money or a dispute, to bind the querent’s success.',
  water: 'Jinn spirits — possibly a spiritual marriage, or exposure to a bad wind.',
  sand: 'From Allah or from the ancestors, rather than from any human enemy.',
};

/** "Reasons why things are not moving" — Houses 1, 6, 8, 16. */
export function findCauses(chart: Chart): CausesResult {
  const houses = [1, 6, 8, 16];
  const star = sumHouses(chart, houses);
  return { houses, star, reading: CAUSE_BY_ELEMENT[star.element] };
}

export interface GeneralSadaqahResult {
  houses: number[];
  star: Star;
}

/** "Checking for sadaqah in a chart" — Houses 1 + 6, combined. */
export function generalSadaqah(chart: Chart): GeneralSadaqahResult {
  const houses = [1, 6];
  return { houses, star: sumHouses(chart, houses) };
}

export function elementLabel(el: Element): string {
  return ELEMENT_LABEL[el];
}
