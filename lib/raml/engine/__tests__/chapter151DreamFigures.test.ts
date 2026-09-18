// Chapter 151 ("Dreams and Their Interpretations") — Cast catalogue
// reconnection. Prompt 31 (see COVERAGE.md) already restored all sixteen
// figures into content/manuscripts/dreamInterpretations.ts and wired them
// into the book reader, but lib/raml/questionAvailability.ts — what the
// Cast catalogue and its picker badge actually read — was never updated,
// so it kept telling users the figures were missing after they'd already
// been restored. These tests cover the fix (Tests A-G from the prompt
// spec) and lock in the regression it exists to prevent (Section 12).
import { describe, expect, it } from 'vitest';
import { KM_CHAPTERS } from '@/lib/server/content/kanzulMikban';
import { KM_CHAPTER_META } from '@/content/manuscripts/kanzulMikbanMeta';
import { QUESTION_REGISTRY } from '../questions';
import { getQuestionAvailability } from '@/lib/raml/questionAvailability';
import { STARS } from '@/content/stars';
import {
  DREAM_INTERPRETATION_FIGURES,
  findDreamInterpretationsByPattern,
  getDreamInterpretationPattern,
  getDreamInterpretationStarId,
  parseDreamParagraph,
} from '@/content/manuscripts/dreamInterpretations';

const CH151_ID = 'dreams-and-their-interpretations';

describe('Test A: Chapter 151 resolves correctly', () => {
  it('exists in both the public chapter metadata and the full chapter data as chapter 151', () => {
    const meta = KM_CHAPTER_META.find((c) => c.id === CH151_ID);
    const full = KM_CHAPTERS.find((c) => c.id === CH151_ID);
    expect(meta?.number).toBe(151);
    expect(full?.number).toBe(151);
    expect(meta?.title).toBe('Dreams and Their Interpretations');
  });

  it('is a real, resolvable Cast catalogue selection (a "no-automatic-reading" entry, not an unknown intention)', () => {
    const availability = getQuestionAvailability(CH151_ID);
    expect(availability.kind).toBe('no-automatic-reading');
  });
});

describe('Test B: exactly sixteen numbered interpretations exist', () => {
  it('DREAM_INTERPRETATION_FIGURES has 16 entries, numbered 1-16', () => {
    expect(DREAM_INTERPRETATION_FIGURES).toHaveLength(16);
    expect(DREAM_INTERPRETATION_FIGURES.map((f) => f.number)).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
  });

  it('the chapter\'s own source paragraphs contain exactly 16 "N. If it\'s" markers, matching the figure count', () => {
    const full = KM_CHAPTERS.find((c) => c.id === CH151_ID)!;
    const items = full.paragraphs.flatMap((p) => parseDreamParagraph(p).items);
    expect(items).toHaveLength(16);
    expect(items.map((i) => i.number)).toEqual(DREAM_INTERPRETATION_FIGURES.map((f) => f.number));
  });
});

describe('Test C: every interpretation 1-16 individually has a figure', () => {
  for (let n = 1; n <= 16; n++) {
    it(`interpretation #${n} resolves to a non-null figure`, () => {
      expect(() => getDreamInterpretationPattern(n)).not.toThrow();
      expect(getDreamInterpretationPattern(n)).toBeDefined();
    });
  }
});

describe('Test D: every restored figure conforms to the canonical four-line geomantic figure representation', () => {
  for (let n = 1; n <= 16; n++) {
    it(`interpretation #${n}'s figure is a real STARS figure with four rows, each 1 or 2 dots`, () => {
      const starId = getDreamInterpretationStarId(n);
      const star = STARS.find((s) => s.id === starId);
      expect(star, `no STARS entry for "${starId}"`).toBeDefined();

      const pattern = getDreamInterpretationPattern(n);
      expect(pattern).toEqual(star!.pattern);
      expect(pattern).toHaveLength(4);
      pattern.forEach((row) => expect([1, 2]).toContain(row));
    });
  }
});

describe('Test E: each figure maps to the correct numbered interpretation', () => {
  for (let n = 1; n <= 16; n++) {
    it(`interpretation #${n}'s own figure matches back to #${n} (and only entries sharing that exact figure)`, () => {
      const pattern = getDreamInterpretationPattern(n);
      const matches = findDreamInterpretationsByPattern(pattern);
      expect(matches).toContain(n);
      // Every number the reverse lookup returns must itself print this
      // exact pattern — never a same-count coincidence.
      matches.forEach((m) => expect(getDreamInterpretationPattern(m)).toEqual(pattern));
    });
  }

  it('the one genuine source duplicate (#1 and #4, both Yussif) round-trips to exactly {1, 4} — no more, no fewer', () => {
    const pattern = getDreamInterpretationPattern(1);
    expect(findDreamInterpretationsByPattern(pattern).sort()).toEqual([1, 4]);
  });
});

describe('Test F: Chapter 151 is not incorrectly marked "Figures missing" now that all source figures are present', () => {
  it('the picker badge is no longer "Figures missing"', () => {
    const availability = getQuestionAvailability(CH151_ID);
    if (availability.kind !== 'no-automatic-reading') throw new Error('expected a no-automatic-reading entry');
    expect(availability.badge).not.toBe('Figures missing');
  });

  it('the explanatory note no longer claims the figures were not preserved or are missing', () => {
    const availability = getQuestionAvailability(CH151_ID);
    if (availability.kind !== 'no-automatic-reading') throw new Error('expected a no-automatic-reading entry');
    expect(availability.note).not.toMatch(/not preserved/i);
    expect(availability.note.toLowerCase()).not.toContain('figures missing');
    expect(availability.note.toLowerCase()).not.toContain('figure that identifies');
  });

  it('the note instead correctly states the figures are restored, and names the real remaining blocker', () => {
    const availability = getQuestionAvailability(CH151_ID);
    if (availability.kind !== 'no-automatic-reading') throw new Error('expected a no-automatic-reading entry');
    expect(availability.note).toMatch(/restored|shown in the chapter/i);
    expect(availability.note).toMatch(/combine|pair/i);
  });
});

describe('Test G: a valid Chapter 151 figure resolves to its correct source interpretation', () => {
  it('every one of the sixteen canonical figures, looked up by pattern alone, resolves to its own correct interpretation text markers', () => {
    // Simulates the "matching" half of the chapter's own method (Section 8):
    // given a resulting four-row figure, find which of the 16 source
    // interpretations it identifies. The other half — deriving that
    // resulting figure from a cast chart via the chapter's own undefined
    // "pair them" step — is deliberately not implemented; see the
    // "Chapter 151 is not registered" tests in source-reconciliation.test.ts
    // and questions-stage9.test.ts for why, and this file's own comment
    // header for the full explanation.
    for (let n = 1; n <= 16; n++) {
      const pattern = getDreamInterpretationPattern(n);
      const resolved = findDreamInterpretationsByPattern(pattern);
      expect(resolved.length).toBeGreaterThan(0);
      resolved.forEach((m) => {
        const star = STARS.find((s) => s.id === getDreamInterpretationStarId(m));
        expect(star!.pattern).toEqual(pattern);
      });
    }
  });

  it('chapter 151 is still correctly NOT a computed engine question — the "pair them" step remains undefined by the source, and this project never invents an unsourced calculation rule', () => {
    expect(QUESTION_REGISTRY[CH151_ID]).toBeUndefined();
  });
});

describe('Regression guard (Section 12): Chapter 151 must never again be marked as having missing figures while its 16 source figures are present', () => {
  it('the figure count and the interpretation count stay equal at 16 — if this ever drifts, the badge logic above needs re-auditing', () => {
    const full = KM_CHAPTERS.find((c) => c.id === CH151_ID)!;
    const interpretationCount = full.paragraphs.flatMap((p) => parseDreamParagraph(p).items).length;
    expect(DREAM_INTERPRETATION_FIGURES.length).toBe(interpretationCount);
  });

  it('as long as every interpretation 1-16 has a resolvable figure, the availability badge must not be "Figures missing"', () => {
    const allSixteenResolve = Array.from({ length: 16 }, (_, i) => i + 1).every((n) => {
      try {
        return getDreamInterpretationPattern(n) !== undefined;
      } catch {
        return false;
      }
    });
    expect(allSixteenResolve).toBe(true);

    const availability = getQuestionAvailability(CH151_ID);
    if (availability.kind === 'no-automatic-reading') {
      expect(availability.badge).not.toBe('Figures missing');
    }
  });
});
