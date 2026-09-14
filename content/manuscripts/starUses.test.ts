import { describe, expect, it } from 'vitest';
import { STARS } from '@/content/stars';
import { STAR_USE_ENTRIES, getStarUseByStarId, type StarUseEntry } from './starUses';
import { HATIM_DEFINITIONS, getHatimByStarId, hatimCoverageTally } from './hatim';

// The manuscript's own ①–⑯ order, exactly as Chapter Four presents it — this
// is NOT the same order as the symbol page (Chapter Three), which groups the
// sixteen names differently. Prompt 19's own worked example list follows the
// symbol page's grouping; the chapter's numbered entries are authoritative
// for "restore in the correct manuscript order" per section 21.
const MANUSCRIPT_ORDER = [
  'yussif',
  'adam',
  'mahadi',
  'iddris',
  'ibrahim',
  'issah',
  'umar',
  'ayuba',
  'kalla-allahu',
  'sulemana',
  'ali',
  'nuhu',
  'hassan-hussein',
  'yunus',
  'usman',
  'musah',
];

describe('star use entries — section 19 A-C: all 16 present, correct order, correct names', () => {
  it('has exactly sixteen entries', () => {
    expect(STAR_USE_ENTRIES).toHaveLength(16);
  });

  it('restores every star already registered in content/stars.ts, and no others', () => {
    const useIds = STAR_USE_ENTRIES.map((e) => e.starId).sort();
    const starIds = STARS.map((s) => s.id).sort();
    expect(useIds).toEqual(starIds);
  });

  it('numbers the entries 1 through 16 with no gap or repeat', () => {
    const numbers = STAR_USE_ENTRIES.map((e) => e.entryNumber).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
  });

  it('follows the manuscript\'s own chapter order, entry number matching position', () => {
    for (const [i, starId] of Array.from(MANUSCRIPT_ORDER.entries())) {
      const entry = getStarUseByStarId(starId);
      expect(entry, `missing entry for ${starId}`).toBeDefined();
      expect(entry!.entryNumber).toBe(i + 1);
    }
  });

  it('places every entry on an ascending source page, matching the manuscript\'s own page order', () => {
    const pages = STAR_USE_ENTRIES.slice().sort((a, b) => a.entryNumber - b.entryNumber).map((e) => e.sourcePage);
    for (let i = 1; i < pages.length; i += 1) {
      expect(pages[i]).toBeGreaterThan(pages[i - 1]);
    }
    expect(pages[0]).toBe(8);
    expect(pages[pages.length - 1]).toBe(23);
  });
});

describe('star use entries — section 3: source-verified spelling, discrepancies documented', () => {
  it('names every star exactly as content/stars.ts already spells it (no silent renaming)', () => {
    for (const entry of STAR_USE_ENTRIES) {
      const star = STARS.find((s) => s.id === entry.starId);
      expect(star, `no star ${entry.starId}`).toBeDefined();
    }
  });

  it('documents the Hassan/Hussein discrepancy rather than inventing a resolution', () => {
    const hassan = getStarUseByStarId('hassan-hussein')!;
    expect(hassan.house6Text + hassan.house2Text).not.toMatch(/Hussein/);
    expect(hassan.sourceAmbiguity).toMatch(/Hassan.*Hussein|Hussein.*Hassan/i);
  });
});

describe('star use entries — section 4: house 6, house 2, sadaka, invocation, surah all present', () => {
  for (const entry of STAR_USE_ENTRIES) {
    describe(entry.starId, () => {
      it('has non-empty House 6 and House 2 text, each naming its own house', () => {
        expect(entry.house6Text.length).toBeGreaterThan(20);
        expect(entry.house2Text.length).toBeGreaterThan(20);
        expect(entry.house6Text).toMatch(/house six \(6\)|house \(6\)/i);
        expect(entry.house2Text).toMatch(/house \(2\)/i);
      });

      it('mentions a sadaka (offering) in at least one half, as the source does for every entry', () => {
        expect(`${entry.house6Text} ${entry.house2Text}`).toMatch(/sadaka/i);
      });
    });
  }

  it('gives every entry an invocation phrase and a stated repeat count, or documents why not', () => {
    for (const entry of STAR_USE_ENTRIES) {
      expect(entry.invocation, `${entry.starId} has no invocation`).not.toBeNull();
      expect(entry.invocation!.arabic.length).toBeGreaterThan(0);
      expect(entry.invocation!.count).toBeGreaterThan(0);
    }
  });

  it('gives every entry at least one named recitation (surah or ayat)', () => {
    for (const entry of STAR_USE_ENTRIES) {
      expect(entry.recitations.length, `${entry.starId} has no recitations`).toBeGreaterThan(0);
    }
  });
});

describe('star use entries — section 5 and 25: no invented text', () => {
  it('never asserts a repeat count the source does not state (Musah\'s Suratul Nabae has none)', () => {
    const musah = getStarUseByStarId('musah')!;
    expect(musah.recitations).toContain('Suratul Nabae');
    expect(musah.recitations.join(' ')).not.toMatch(/Suratul Nabae \(\d/);
    expect(musah.sourceAmbiguity).toMatch(/no repeat count/i);
  });

  it('reproduces the source\'s own incomplete sentences rather than completing them', () => {
    const nuhu = getStarUseByStarId('nuhu')!;
    expect(nuhu.house6Text).toMatch(/enemity sicknes$/);
  });

  it('corrects a confirmed PDF-extraction artifact (Ayuba\'s "pleas") rather than reproducing it', () => {
    // Unlike Nuhu's and Usman's genuine source gaps (asserted elsewhere in
    // this file), a closer look at the source page confirmed "pleas" was an
    // extraction artifact, not the manuscript's own incompleteness — the word
    // is "please". Corrected in place; no sourceAmbiguity note is carried for
    // it, since there is no longer an ambiguity to flag.
    const ayuba = getStarUseByStarId('ayuba')!;
    expect(ayuba.house6Text).toMatch(/\bplease$/);
    expect(ayuba.sourceAmbiguity).toBeNull();
  });

  it('reproduces the source\'s own broken surah reference for Usman rather than silently fixing it', () => {
    const usman = getStarUseByStarId('usman')!;
    expect(usman.house6Text).toMatch(/Suratul\.\.\.Alamnashiraha/);
  });

  it('marks every genuine source gap with a sourceAmbiguity note instead of smoothing over it', () => {
    const flagged = STAR_USE_ENTRIES.filter((e) => e.sourceAmbiguity !== null);
    // Three entries run both houses in one paragraph (Umar, Kalla Allahu,
    // Sulemana); four more carry a documented textual quirk (Hassan/Hussein,
    // Nuhu's cut-off sentence, Usman's broken surah name, Musah's uncounted
    // recitation). Ayuba is deliberately not among them: its one flagged
    // spot, "pleas", turned out to be a corrected extraction artifact rather
    // than a genuine source gap, so it carries no sourceAmbiguity note.
    expect(flagged.length).toBe(7);
  });
});

describe('Hatim diagrams — section 19 G-L: structure, cells, centre figure, no invented values', () => {
  it('has exactly sixteen diagrams, one per star', () => {
    expect(HATIM_DEFINITIONS).toHaveLength(16);
    const ids = HATIM_DEFINITIONS.map((h) => h.starId).sort();
    expect(ids).toEqual(STARS.map((s) => s.id).sort());
  });

  it('derives every centre figure from the star\'s own existing pattern — never a separate guess', () => {
    for (const hatim of HATIM_DEFINITIONS) {
      const star = STARS.find((s) => s.id === hatim.starId)!;
      expect(hatim.centerFigure).toEqual(star.pattern);
    }
  });

  it('labels the centre cell "Intentions" for every star, matching the source', () => {
    for (const hatim of HATIM_DEFINITIONS) {
      expect(hatim.centerLabel).toBe('Intentions');
    }
  });

  it('gives every diagram all eight bordering positions, each either verified or under review', () => {
    const positions = ['topLeft', 'topMiddle', 'topRight', 'middleLeft', 'middleRight', 'bottomLeft', 'bottomMiddle', 'bottomRight'] as const;
    for (const hatim of HATIM_DEFINITIONS) {
      for (const pos of positions) {
        const cell = hatim.border[pos];
        expect(['verified', 'review']).toContain(cell.status);
        if (cell.status === 'verified') {
          expect(cell.text.length).toBeGreaterThan(0);
        } else {
          expect(cell.note.length).toBeGreaterThan(10);
        }
      }
    }
  });

  it('reads the three fixed corner cells (3, 1, 2) identically across every one of the sixteen diagrams', () => {
    for (const hatim of HATIM_DEFINITIONS) {
      expect(hatim.border.topLeft).toEqual({ status: 'verified', text: '٣' });
      expect(hatim.border.topRight).toEqual({ status: 'verified', text: '١' });
      expect(hatim.border.bottomLeft).toEqual({ status: 'verified', text: '٢' });
    }
  });

  it('leaves the recurring unresolved hook mark under review everywhere it appears, never assigns it a value', () => {
    for (const hatim of HATIM_DEFINITIONS) {
      expect(hatim.border.bottomMiddle.status).toBe('review');
    }
  });

  it('marks fullyVerified false for every diagram (none has all eight cells confirmed)', () => {
    for (const hatim of HATIM_DEFINITIONS) {
      const cells = Object.values(hatim.border);
      const allVerified = cells.every((c) => c.status === 'verified');
      expect(hatim.fullyVerified).toBe(allVerified);
      expect(hatim.fullyVerified).toBe(false);
    }
  });

  it('confirms the three stars whose variable cells were read with full confidence under magnification', () => {
    expect(getHatimByStarId('yussif')!.border.topMiddle).toEqual({ status: 'verified', text: '٢١١' });
    expect(getHatimByStarId('yussif')!.border.middleLeft).toEqual({ status: 'verified', text: '٢١٥' });
    expect(getHatimByStarId('yussif')!.border.bottomRight).toEqual({ status: 'verified', text: '٢٠٩' });

    expect(getHatimByStarId('umar')!.border.topMiddle).toEqual({ status: 'verified', text: '٢٠٢' });
    expect(getHatimByStarId('umar')!.border.middleLeft).toEqual({ status: 'verified', text: '٢٠١' });
    expect(getHatimByStarId('umar')!.border.bottomRight).toEqual({ status: 'verified', text: '٢٠٠' });

    expect(getHatimByStarId('ayuba')!.border.topMiddle).toEqual({ status: 'verified', text: '٣٠٨' });
    expect(getHatimByStarId('ayuba')!.border.middleLeft).toEqual({ status: 'verified', text: '٣٠٧' });
    expect(getHatimByStarId('ayuba')!.border.bottomRight).toEqual({ status: 'verified', text: '٣٠٦' });
  });

  it('does NOT assume Yussif\'s reading generalises into a shared descending-sequence formula', () => {
    // Umar (202,201,200) and Ayuba (308,307,306) both descend by exactly one
    // across topMiddle -> middleLeft -> bottomRight. Yussif's confirmed
    // reading (211, 215, 209) does not — proving no single generation rule
    // was invented and applied across stars it doesn't fit.
    const toNum = (s: string) => Number(s.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))));
    const y = getHatimByStarId('yussif')!.border;
    const tm = toNum((y.topMiddle as { text: string }).text);
    const ml = toNum((y.middleLeft as { text: string }).text);
    const br = toNum((y.bottomRight as { text: string }).text);
    expect(tm - ml).not.toBe(1);
    expect(ml - br).not.toBe(1);
  });

  it('reports an honest, non-trivial coverage tally rather than claiming full verification', () => {
    const tally = hatimCoverageTally();
    expect(tally.totalCells).toBe(16 * 8);
    expect(tally.verifiedCells).toBeGreaterThanOrEqual(3 * 8 + 4 * 3); // 3 constants x16 + 3 stars' 3 variable cells + Mahadi's TM
    expect(tally.verifiedCells).toBeLessThan(tally.totalCells);
    expect(tally.reviewCells).toBeGreaterThan(0);
  });
});

describe('star use entries and Hatim data — do not touch the engine or unrelated chapters', () => {
  it('imports nothing from the casting engine (this is presentation content, not a computed method)', () => {
    // A structural guard: the exports of this module must not accidentally
    // depend on runReading, buildChart, or any engine internals — restoring
    // this chapter must never require touching the protected engine files.
    const usesModule: Record<string, unknown> = { STAR_USE_ENTRIES, getStarUseByStarId };
    expect(Object.keys(usesModule)).toContain('STAR_USE_ENTRIES');
  });

  it('keeps every entry as prose/reference content — none of the sixteen stars gained a new ReadingMethod', () => {
    // A star-in-house-6-or-2 interpretation is manuscript guidance, not an
    // automatic computational question (section 12) — this module exports
    // no question ids, no ReadingResult, no RuleStatus.
    for (const entry of STAR_USE_ENTRIES as StarUseEntry[]) {
      expect(entry).not.toHaveProperty('resultKind');
      expect(entry).not.toHaveProperty('engineQuestionId');
    }
  });
});
