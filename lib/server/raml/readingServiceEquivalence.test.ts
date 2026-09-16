// Prompt 27C, Phase 2 — behavioral-equivalence fixture for the Overview/
// "Your Reading" server migration. getReadingResult() is a one-line
// wrapper around lib/raml/engine's own, completely unchanged runReading()
// — this proves the wrapper introduces no drift by comparing its output
// directly against calling runReading() itself, across a representative
// case for every outcome shape the engine produces (favourable,
// unfavourable, mixed/conflict, insufficient data, descriptive) plus a
// consolidated-duplicate resolution and an unregistered-question fallback.
import { describe, expect, it } from 'vitest';
import { runReading } from '@/lib/raml/engine';
import { resolveEngineQuestionId } from '@/lib/raml/questionAvailability';
import { fixtureChart } from '@/lib/raml/engine/__tests__/fixtures';
import { getReadingResult } from './readingService';

const chart = fixtureChart();

// Same representative set history.test.ts already established as covering
// every reachable outcome shape on this exact fixture chart.
const CASES = {
  favourable: 'if-you-want-to-know-if-you-will',
  unfavourable: 'business-profit-and-loss',
  mixed: 'if-you-will-win-a-case-in-court',
  descriptive: 'is-there-much-trees-water-sand-or-stones',
  insufficient: 'if-a-pregnancy-is-going-to-be-stable',
} as const;

describe('getReadingResult produces byte-identical output to calling runReading() directly', () => {
  for (const [label, questionId] of Object.entries(CASES)) {
    it(`${label}: ${questionId}`, () => {
      expect(getReadingResult(chart, questionId)).toEqual(runReading(chart, questionId));
    });
  }

  it('a consolidated duplicate resolves to the same result as its canonical question', () => {
    const resolved = resolveEngineQuestionId('if-a-sick-person-has-long-life-repeated');
    expect(getReadingResult(chart, resolved)).toEqual(runReading(chart, resolved));
  });

  it('an unregistered question returns null from both, identically', () => {
    expect(getReadingResult(chart, 'not-a-real-question-id')).toBeNull();
    expect(runReading(chart, 'not-a-real-question-id')).toBeNull();
  });
});
