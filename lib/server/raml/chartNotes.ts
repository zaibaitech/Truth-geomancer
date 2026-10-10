// SERVER-ONLY. The paid per-chart star notes shown by the Overview and Sadaqah tabs of a cast chart: the
// house-6 / house-2 meaning of the figures sitting in the Judge, Wealth and Illness houses, and the
// sadaqah offering for the chart's own sadaqah figure. They are computed here, on the server, from the
// chart the visitor posted, and returned only by app/api/raml/chart-notes/route.ts after the same
// General Reading entitlement check the rest of the Master reading uses. Remedies are never returned: no
// screen shows them. Nothing here is imported by client code.
import type { Chart, ChartHouse } from '@/lib/raml/casting';
import { getStarByPattern } from '@/content/stars';
import { generalSadaqah } from '@/lib/raml/interpret';
import { STAR_NOTES } from '@/lib/server/content/starNotes';

export interface ChartNotes {
  /** House-6 meaning of the figure in House 15 (the Judge). */
  judgeHouse6: string;
  /** House-2 meaning of the figure in House 2 (Wealth). */
  wealthHouse2: string;
  /** House-6 meaning of the figure in House 6 (Illness & Enemies). */
  illnessHouse6: string;
  /** The chart's sadaqah figure (House 1 + House 6) with its offering and day. */
  sadaqah: { figureName: string; houses: number[]; offering: string; day: string };
}

function notesFor(starId: string) {
  const n = STAR_NOTES[starId];
  if (!n) throw new Error(`No star notes for ${starId}`);
  return n;
}

/** The figure is derived from the house's validated dot pattern, never from a posted figure id or name. */
const starIdOf = (h: ChartHouse) => getStarByPattern(h.pattern).id;

/** Built only from the posted chart's own dot patterns, looked up on the server. */
export function buildChartNotes(chart: Chart): ChartNotes {
  const sad = generalSadaqah(chart);
  const sadNotes = notesFor(sad.star.id);
  return {
    judgeHouse6: notesFor(starIdOf(chart.houses[14])).house6.meaning,
    wealthHouse2: notesFor(starIdOf(chart.houses[1])).house2.meaning,
    illnessHouse6: notesFor(starIdOf(chart.houses[5])).house6.meaning,
    sadaqah: { figureName: sad.star.name, houses: sad.houses, offering: sadNotes.sadaqah.offering, day: sadNotes.sadaqah.day },
  };
}
