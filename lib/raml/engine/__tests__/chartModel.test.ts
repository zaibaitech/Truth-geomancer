import { describe, expect, it } from 'vitest';
import { buildChartModel } from '../chartModel';
import { fixtureChart, FIXTURE_STAR_IDS } from './fixtures';

describe('buildChartModel', () => {
  const model = buildChartModel(fixtureChart());

  it('produces exactly 16 houses, numbered 1-16 in order', () => {
    expect(model.houses).toHaveLength(16);
    model.houses.forEach((h, i) => expect(h.houseNumber).toBe(i + 1));
  });

  it('preserves the exact dot patterns and figure ids from the underlying chart', () => {
    model.houses.forEach((h, i) => expect(h.figureId).toBe(FIXTURE_STAR_IDS[i]));
  });

  it('assigns house roles matching the classical shield-chart layout', () => {
    expect(model.houses[0].role).toBe('mother'); // H1
    expect(model.houses[7].role).toBe('daughter'); // H8
    expect(model.houses[11].role).toBe('niece'); // H12
    expect(model.houses[14].role).toBe('judge'); // H15
    expect(model.houses[15].role).toBe('reconciler'); // H16
  });

  it('marks fortune and direction as verified but explicitly classical-tradition, not manuscript', () => {
    const h1 = model.houses[0];
    expect(h1.qualities.fortune.status).toBe('verified');
    expect(h1.qualities.fortune.source.kind).toBe('classical-tradition');
    expect(h1.qualities.direction.status).toBe('verified');
    expect(h1.qualities.direction.source.kind).toBe('classical-tradition');
  });

  it('represents a "level" figure as a null direction value, not a guess', () => {
    // Yussif (H1) has no defined upward/downward per content/classicalAttributes.ts
    const h1 = model.houses[0];
    expect(h1.figureId).toBe('yussif');
    expect(h1.qualities.direction.value).toBeNull();
  });

  it('derives line states directly and correctly from the dot pattern (manuscript-sourced, always verified)', () => {
    const h1 = model.houses[0]; // Yussif = [1,1,2,1]
    expect(h1.qualities.lineStates).toEqual({ fire: 'opened', air: 'opened', water: 'closed', sand: 'opened' });
    expect(h1.qualities.lineStates.fire).toBe('opened'); // no status field needed — this axis has no ambiguity
  });

  it('never invents a value for qualities the source material does not tabulate', () => {
    model.houses.forEach((h) => {
      expect(h.qualities.stability.value).toBeNull();
      expect(h.qualities.stability.status).toBe('needs_review');
      expect(h.qualities.gender.value).toBeNull();
      expect(h.qualities.gender.status).toBe('needs_review');
      expect(h.qualities.dayNight.value).toBeNull();
      expect(h.qualities.dayNight.status).toBe('needs_review');
    });
  });

  it('does not mutate its input chart', () => {
    const chart = fixtureChart();
    const before = JSON.stringify(chart);
    buildChartModel(chart);
    expect(JSON.stringify(chart)).toBe(before);
  });
});
