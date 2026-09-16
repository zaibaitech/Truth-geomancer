// Prompt 27B, Phase 2 — behavioral-equivalence fixture, captured BEFORE
// methodParser.ts/methodVerdicts.ts move server-side, and re-run
// UNCHANGED afterward against the relocated modules. A passing test here
// after the move proves CURRENT BEHAVIOR = NEW SERVER-SIDE BEHAVIOR byte
// for byte — the move is a pure relocation, not a reimplementation.
//
// Four representative chapters, chosen by probing every chapter against
// the same hand-verified fixture chart used across the engine test suite:
//   - the hand-authored tier (both methods)
//   - a parser-tier chapter with one clean + one ambiguous method
//   - a parser-tier chapter with one null (unparsed) + one clean method
//   - a chapter with NO parseable methods at all (getMethodVerdicts
//     returns null, not an array of nulls — the two are different
//     contracts and both need covering)
import { describe, expect, it } from 'vitest';
import { fixtureChart } from '@/lib/raml/engine/__tests__/fixtures';
import { getMethodVerdicts } from './methodVerdicts';

describe('methodVerdicts/methodParser behavioral fixture (captured pre-move)', () => {
  const chart = fixtureChart();

  it('hand-authored tier: if-she-s-going-to-stay-in-the', () => {
    expect(getMethodVerdicts('if-she-s-going-to-stay-in-the', chart)).toEqual([
      {
        label: 'Method 1',
        methodText:
          "Pick H9 and H8 and add them. Upward → she will not stay forever. Downward → she will stay, Insha'Allah.",
        housesUsed: [9, 8],
        calculationSteps: ['H9 (Usman) + H8 (Issah) = Ibrahim'],
        result: {
          houses: [9, 8],
          pattern: [1, 1, 1, 1],
          starId: 'ibrahim',
          starName: 'Ibrahim',
          classicalName: 'Via',
          element: 'water',
          fortune: 'neutral',
          upDown: 'level',
        },
        interpretation:
          "This figure's top and bottom lines match, so the book's upward/downward test doesn't resolve cleanly here — read Method 1's own wording above alongside the resulting figure to judge for yourself.",
        ambiguous: true,
      },
      {
        label: 'Method 2',
        methodText:
          "Pick (H2 and H7) then (H4 and H10), add them all. Good+Downward → stays and enjoys it. Good+Upward → leaves despite enjoying it. Bad+Downward → stays but doesn't enjoy it. Bad+Upward → leaves immediately.",
        housesUsed: [2, 7, 4, 10],
        calculationSteps: [
          'H2 (Adam) + H7 (Nuhu) = Yunus',
          'H4 (Iddris) + H10 (Usman) = Mahadi',
          'Yunus + Mahadi = Kalla Allahu',
        ],
        result: {
          houses: [2, 7, 4, 10],
          pattern: [1, 1, 2, 2],
          starId: 'kalla-allahu',
          starName: 'Kalla Allahu',
          classicalName: 'Fortuna Minor',
          element: 'fire',
          fortune: 'good',
          upDown: 'upward',
        },
        interpretation: 'She will leave even though she enjoys the stay.',
        ambiguous: false,
      },
    ]);
  });

  it('parser tier, clean + ambiguous mix: traveling-business-and-if-you-will-return-from', () => {
    const result = getMethodVerdicts('traveling-business-and-if-you-will-return-from', chart);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(3);
    expect(result![0]).toMatchObject({ label: 'Method 1', ambiguous: true, result: { starId: 'umar' } });
    expect(result![1]).toMatchObject({
      label: 'Method 2',
      ambiguous: false,
      interpretation: 'you will return with money',
      result: { starId: 'ali' },
    });
    expect(result![2]).toBeNull();
  });

  it('parser tier, null + clean mix: if-you-will-get-children-from-a-lady', () => {
    const result = getMethodVerdicts('if-you-will-get-children-from-a-lady', chart);
    expect(result).not.toBeNull();
    expect(result![0]).toBeNull();
    expect(result![1]).toMatchObject({
      label: 'Method 2',
      ambiguous: false,
      interpretation: 'you will have kids very fast',
      result: { starId: 'adam' },
    });
  });

  it('no parseable methods at all: if-you-want-to-know-if-you-will returns null, not an array of nulls', () => {
    expect(getMethodVerdicts('if-you-want-to-know-if-you-will', chart)).toBeNull();
  });
});
