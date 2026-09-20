// Shared request-body chart validator (Prompt 27C), factored out of
// app/api/raml/reading-verdicts/route.ts's own original copy so the new
// reading/practice routes don't each duplicate it. Structural validation
// only — the chart is the caller's own already-cast result, never a
// privilege-bearing value, so this exists to avoid crashes on malformed
// input, not to establish trust.
import type { Chart, ChartHouse } from '@/lib/raml/casting';
import { getStarById } from '@/content/stars';

function isValidChartHouse(h: unknown): h is ChartHouse {
  if (typeof h !== 'object' || h === null) return false;
  const house = h as Record<string, unknown>;
  if (typeof house.n !== 'number' || house.n < 1 || house.n > 16) return false;
  if (!Array.isArray(house.pattern) || house.pattern.length !== 4) return false;
  if (!house.pattern.every((d) => d === 1 || d === 2)) return false;
  if (typeof house.star !== 'object' || house.star === null) return false;
  const star = house.star as Record<string, unknown>;
  return typeof star.id === 'string' && typeof star.name === 'string';
}

export function isValidChart(c: unknown): c is Chart {
  if (typeof c !== 'object' || c === null) return false;
  const chart = c as Record<string, unknown>;
  return Array.isArray(chart.houses) && chart.houses.length === 16 && chart.houses.every(isValidChartHouse);
}

/** Fill missing canonical star fields (element, pattern metadata, etc.)
 * from the existing STARS table when a house already names a known star
 * by id. Slim serialized charts can legally arrive with only `{id, name}`;
 * Method 4 (and any other element-dependent check) still needs the
 * canonical element.
 *
 * Lookup is by star id only. Unknown ids are left untouched — never invent
 * an element, and never guess from the supplied name or pattern. */
export function hydrateCanonicalStars(chart: Chart): Chart {
  return {
    ...chart,
    houses: chart.houses.map((house): ChartHouse => {
      const canonical = getStarById(house.star.id);
      if (!canonical) return house;
      return { ...house, star: canonical };
    }),
  };
}