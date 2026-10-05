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
import { QUESTION_REGISTRY } from '@/lib/raml/engine/questions';
import { AUTOMATIC_READING_UNAVAILABLE_NOTICE, SOURCE_INCOMPLETE_NOTICE } from '@/lib/raml/customerText';
import { getReadingResult, toCustomerReading } from './readingService';

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

describe('getReadingResult equals runReading() with only the customer-facing wording changed', () => {
  for (const [label, questionId] of Object.entries(CASES)) {
    it(`${label}: ${questionId}`, () => {
      expect(getReadingResult(chart, questionId)).toEqual(toCustomerReading(runReading(chart, questionId)!));
    });
  }

  it('a consolidated duplicate resolves to the same result as its canonical question', () => {
    const resolved = resolveEngineQuestionId('if-a-sick-person-has-long-life-repeated');
    expect(getReadingResult(chart, resolved)).toEqual(toCustomerReading(runReading(chart, resolved)!));
  });

  it('an unregistered question returns null from both, identically', () => {
    expect(getReadingResult(chart, 'not-a-real-question-id')).toBeNull();
    expect(runReading(chart, 'not-a-real-question-id')).toBeNull();
  });
});

// Customer-safe wording must never change what was computed: for EVERY registered
// question, the result differs from the raw engine result only in review notes,
// source quotes and the embedded interpretation sentence.
describe('customer-safe wording changes text only, for every registered question', () => {
  const strip = (r: NonNullable<ReturnType<typeof runReading>>) => ({
    ...r,
    detailedInterpretation: '',
    methodResults: r.methodResults.map((m) => ({ ...m, reviewNote: m.reviewNote ? 'note' : null, sourceQuote: '' })),
  });
  it('outcomes, figures, houses, verdicts and statuses are identical to the engine\'s own', () => {
    for (const id of Object.keys(QUESTION_REGISTRY)) {
      const raw = runReading(chart, id)!;
      expect(strip(getReadingResult(chart, id)!), id).toEqual(strip(raw));
    }
  });

  it('no reading exposes internal review, audit or transcription wording', () => {
    const INTERNAL = /final edition|author|audit|restor|prompt \d|this project|codebase|not yet|figures omitted|types\.ts|KM_EDITION_NOTE|withheld rather/i;
    for (const id of Object.keys(QUESTION_REGISTRY)) {
      const r = getReadingResult(chart, id)!;
      expect(r.detailedInterpretation, id).not.toMatch(INTERNAL);
      for (const m of r.methodResults) {
        expect(m.reviewNote ?? '', `${id}/${m.id} note`).not.toMatch(INTERNAL);
        expect(m.sourceQuote, `${id}/${m.id} quote`).not.toMatch(INTERNAL);
        if (m.reviewNote) expect([SOURCE_INCOMPLETE_NOTICE, AUTOMATIC_READING_UNAVAILABLE_NOTICE]).toContain(m.reviewNote);
      }
    }
  });
});
