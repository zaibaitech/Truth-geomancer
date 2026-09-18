// Chapter 151 ("Dreams and Their Interpretations") — Cast catalogue
// reconnection and, later, full automatic-reading registration.
//
// History: Prompt 31 (see COVERAGE.md) restored all sixteen figures into
// content/manuscripts/dreamInterpretations.ts and wired them into the book
// reader, but lib/raml/questionAvailability.ts — what the Cast catalogue
// and its picker badge actually read — was never updated, so it kept
// telling users the figures were missing after they'd already been
// restored (fixed: badge/note corrected, this file's Tests B-E). Chapter
// 151 then stayed a "no-automatic-reading" entry because its own casting
// instruction ("pair them") was never defined anywhere in either
// manuscript — until the product owner obtained a direct clarification
// from the manuscript's author. See
// lib/raml/engine/questions/dreamsAndInterpretations.ts's own header for
// the full evidence and the exact procedure; this file's Tests A/F/G and
// its regression guard now assert the REGISTERED state.
import { describe, expect, it } from 'vitest';
import { KM_CHAPTERS } from '@/lib/server/content/kanzulMikban';
import { KM_CHAPTER_META } from '@/content/manuscripts/kanzulMikbanMeta';
import { QUESTION_REGISTRY } from '../questions';
import { getQuestionAvailability } from '@/lib/raml/questionAvailability';
import { catalogEntry } from '@/lib/raml/questionCatalog';
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

  it('is a real, resolvable Cast catalogue selection — now a genuine "engine" entry, not "no-automatic-reading"', () => {
    const availability = getQuestionAvailability(CH151_ID);
    expect(availability.kind).toBe('engine');
  });

  it('the catalogue entry routes to the real engine question, with no badge and a non-zero method count', () => {
    const entry = catalogEntry(CH151_ID)!;
    expect(entry.engineQuestionId).toBe(CH151_ID);
    expect(entry.methodCount).toBeGreaterThan(0);
    expect(entry.availability.kind).toBe('engine');
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

describe('Test F: Chapter 151 is not incorrectly marked "Figures missing" or "Method undefined" now that both blockers are resolved', () => {
  it('the availability is a plain engine entry — no badge, no "missing"/"undefined" note at all', () => {
    const availability = getQuestionAvailability(CH151_ID);
    expect(availability.kind).toBe('engine');
    // An 'engine' entry structurally has no badge/note fields — the type
    // itself (EngineAvailability = { kind: 'engine' }) makes a stale
    // "Figures missing"/"Method undefined" string impossible to attach.
    expect('badge' in availability).toBe(false);
    expect('note' in availability).toBe(false);
  });

  it('the catalogue never shows a badge for this entry', () => {
    const entry = catalogEntry(CH151_ID)!;
    expect(entry.availability.kind).not.toBe('no-automatic-reading');
  });
});

describe('Test G: a valid Chapter 151 figure resolves to its correct source interpretation', () => {
  it('every one of the sixteen canonical figures, looked up by pattern alone, resolves to its own correct interpretation text markers', () => {
    // The "matching" half of the chapter's own method (Section 8): given a
    // resulting four-row figure, find which of the 16 source
    // interpretations it identifies.
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

  it('chapter 151 IS now a computed engine question — the author-clarified pairing procedure is registered (see dreamsAndInterpretations.ts)', () => {
    expect(QUESTION_REGISTRY[CH151_ID]).toBeDefined();
    expect(QUESTION_REGISTRY[CH151_ID].methods.length).toBeGreaterThan(0);
  });
});

describe('Regression guard (Section 12): Chapter 151 must never again be marked as having missing figures or an undefined method while both are resolved', () => {
  it('the figure count and the interpretation count stay equal at 16 — if this ever drifts, the reading logic above needs re-auditing', () => {
    const full = KM_CHAPTERS.find((c) => c.id === CH151_ID)!;
    const interpretationCount = full.paragraphs.flatMap((p) => parseDreamParagraph(p).items).length;
    expect(DREAM_INTERPRETATION_FIGURES.length).toBe(interpretationCount);
  });

  it('as long as every interpretation 1-16 has a resolvable figure and the question stays registered, the availability must never fall back to "no-automatic-reading"', () => {
    const allSixteenResolve = Array.from({ length: 16 }, (_, i) => i + 1).every((n) => {
      try {
        return getDreamInterpretationPattern(n) !== undefined;
      } catch {
        return false;
      }
    });
    expect(allSixteenResolve).toBe(true);
    expect(QUESTION_REGISTRY[CH151_ID]).toBeDefined();

    const availability = getQuestionAvailability(CH151_ID);
    expect(availability.kind).toBe('engine');
  });
});
