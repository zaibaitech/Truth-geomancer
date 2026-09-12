// Builds the engine's enriched ChartModel from the existing, unmodified
// Chart produced by lib/raml/casting.ts. This is purely an adapter — no
// casting math happens here, and nothing here can be wrong in a way that
// affects the chart itself, only in how its qualities are labeled.

import type { Chart } from '../casting';
import type { Pattern } from '@/content/stars';
import { getClassicalAttribute } from '@/content/classicalAttributes';
import { houseInfo } from '../houses';
import type { ChartModel, FigureQualities, HouseModel, LineStates } from './types';

const UNSOURCED = (quality: string) => ({
  kind: 'unsourced' as const,
  note: `Neither source manuscript tabulates which of the 16 figures carries "${quality}" — this project does not invent a value for it.`,
});

function lineStatesOf(pattern: Pattern): LineStates {
  const state = (v: number) => (v === 1 ? 'opened' : 'closed') as 'opened' | 'closed';
  return {
    fire: state(pattern[0]),
    air: state(pattern[1]),
    water: state(pattern[2]),
    sand: state(pattern[3]),
  };
}

export function qualitiesFor(starId: string, pattern: Pattern): FigureQualities {
  const attr = getClassicalAttribute(starId);
  const fortune = attr.fortune === 'neutral' ? 'middleGood' : attr.fortune;
  const direction = attr.upDown === 'level' ? null : attr.upDown;

  return {
    fortune: {
      value: fortune,
      status: 'verified',
      source: { kind: 'classical-tradition', note: 'Not tabulated by either source manuscript; see content/classicalAttributes.ts.' },
    },
    direction: {
      value: direction,
      status: 'verified',
      source: { kind: 'classical-tradition', note: 'Structurally derived (top vs. bottom line); "level" figures have no defined direction.' },
    },
    lineStates: lineStatesOf(pattern),
    stability: { value: null, status: 'needs_review', source: UNSOURCED('stable/unstable') },
    gender: { value: null, status: 'needs_review', source: UNSOURCED('male/female') },
    dayNight: { value: null, status: 'needs_review', source: UNSOURCED('day/night') },
  };
}

/** The one real entry point: adapt an existing Chart into a ChartModel. */
export function buildChartModel(chart: Chart): ChartModel {
  const houses: HouseModel[] = chart.houses.map((h) => {
    const info = houseInfo(h.n);
    return {
      houseNumber: h.n,
      role: info.role,
      figureId: h.star.id,
      figureName: h.star.name,
      classicalName: getClassicalAttribute(h.star.id).classicalName,
      dotPattern: h.pattern,
      element: h.star.element,
      qualities: qualitiesFor(h.star.id, h.pattern),
    };
  });
  return { houses, createdAt: chart.createdAt };
}

export function houseAt(model: ChartModel, n: number): HouseModel {
  const h = model.houses[n - 1];
  if (!h) throw new Error(`Chart model has no house ${n}`);
  return h;
}
