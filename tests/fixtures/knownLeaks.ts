// KNOWN-LEAK RATCHET BASELINE (Stage 1a), which may only SHRINK.
//
// These are leaks that exist in production TODAY (found in the Phase 1
// audit, 9 Oct 2026). Stage 1a does not fix them, because fixing them means
// changing casting/reader/search code that is out of scope. It records them
// so that:
//   * any NEW leak fails the guards immediately, and
//   * when a leak is fixed (Stage 1-0), the guard fails until the entry is
//     removed from this file, so the baseline can never silently grow back.
//
// Ids are sha256(group | normalised protected string), first 16 hex chars:
// stable and non-reversible, so no protected text is stored here.
//
// RECOMMENDATION: Stage 1-0 (needs Mario's approval) should move the
// restricted star fields and the Hatim values out of client-reachable modules,
// emptying L1 and L2 below.

// L1 (the per-star house-6 / house-2 meanings, remedies and sadaqah in client JS) was fixed: that content now
// lives in lib/server/content/starNotes.ts and is delivered only after an entitlement check. It must stay at
// zero: there is no baseline entry for it, so any reappearance fails the guards.
export type LeakId = 'L1' | 'L2' | 'L3';

export interface KnownClientModuleLeak {
  module: string;
  leak: LeakId;
  severity: 'high' | 'medium' | 'low';
  why: string;
}

/**
 * Protected modules that are reachable from 'use client' code today, so their
 * whole contents ship in public JS chunks. (Conservative static analysis.)
 */
export const KNOWN_CLIENT_REACHABLE_PROTECTED: KnownClientModuleLeak[] = [
  {
    module: 'content/manuscripts/hatim.ts',
    leak: 'L2',
    severity: 'medium',
    why: 'HatimDiagram (client) imports arabicIndicToLatin; the module\'s top-level RAW_HATIMS.map() bundles all 16 Hatim value sets into the reader page chunk.',
  },
  {
    module: 'content/kanzulFigureQuality.ts',
    leak: 'L3',
    severity: 'low',
    why: 'Owner-supplied good/middle/bad grouping, via ReadingTab > MethodVerdictCard and engine/reading.ts. Author to confirm if acceptable.',
  },
  {
    module: 'content/classicalAttributes.ts',
    leak: 'L3',
    severity: 'low',
    why: 'Classical (outside-tradition) fortune/up-down table, via MethodVerdictCard.',
  },
  {
    module: 'lib/raml/engine/reading.ts',
    leak: 'L3',
    severity: 'low',
    why: 'Result-shaping helpers, via components/raml/reading/MethodConsistencyCard.tsx (OUTCOME_ROW_LABEL). No quotes or outcomes.',
  },
  {
    module: 'lib/raml/engine/methodBasisTable.ts',
    leak: 'L3',
    severity: 'low',
    why: 'Which method ids read "star quality" vs other attributes (labels only), via engine/reading.ts.',
  },
  {
    module: 'lib/raml/engine/castingRequirement.ts',
    leak: 'L3',
    severity: 'low',
    why: 'Casting-requirement classification (house numbers/enums), via engine/reading.ts and the question picker.',
  },
];

/** Per public route: protected modules its client bundle reaches today. New
 * public routes (e.g. Stage 1b /learn) are NOT listed, so they must reach none. */
export const KNOWN_PUBLIC_ROUTE_CLIENT_LEAKS: Record<string, string[]> = {
  'app/books/[id]/page.tsx': ['lib/raml/engine/castingRequirement.ts'],
  'app/raml/page.tsx': [
    'content/classicalAttributes.ts',
    'content/kanzulFigureQuality.ts',
    'lib/raml/engine/castingRequirement.ts',
    'lib/raml/engine/methodBasisTable.ts',
    'lib/raml/engine/reading.ts',
  ],
  'app/preview/kanzul-mikban/page.tsx': [
    'content/kanzulFigureQuality.ts',
    'lib/raml/engine/castingRequirement.ts',
    'lib/raml/engine/methodBasisTable.ts',
    'lib/raml/engine/reading.ts',
  ],
};

/**
 * Public routes that import protected text SERVER-SIDE ONLY, by design. The
 * module code never ships to the browser; what the page renders is checked by
 * tests/guards/publicPageRender.test.ts.
 */
export const ACCEPTED_SERVER_SIDE_IMPORTS: Record<string, { modules: string[]; why: string }> = {
  'app/preview/kanzul-mikban/page.tsx': {
    modules: ['content/manuscripts/dreamInterpretations.ts', 'content/manuscripts/giftVisitorFigures.ts'],
    why: 'lib/server/previewService.ts resolves the free sample through the engine question registry (server-only), which imports these manuscripts.',
  },
  'app/preview/master-of-geomancy-vol-1/page.tsx': {
    modules: ['content/manuscripts/dreamInterpretations.ts', 'content/manuscripts/giftVisitorFigures.ts'],
    why: 'Same server-only path: lib/server/previewService.ts > engine question registry.',
  },
};

/**
 * Build-output fingerprints found in public files today (next build of
 * 55fbccf). L3 items carry no fingerprintable prose, so they are tracked by
 * the import-graph ratchet above only.
 */
export const KNOWN_BUILD_LEAK_IDS: Record<string, { leak: LeakId; ids: string[] }> = {
  'hatim-values': {
    leak: 'L2',
    ids: [
      '14d36d85db46c768', '1cad3cb474f1912d', '32fe0f182d96a271', '485b3dd9b5bef4a6', '52416d176e982bc1',
      '6623a390cce56bd3', '85c425fbc07d29a3', '8662bc346f747ac5', 'a65af70edec8abe7', 'a7e284dbd787978b',
      'd60a78a08ac7d636', 'd78d6c1e39f69083', 'da0d0c2bee954276', 'e006fc82c41a17ac', 'f2fe604cdc665d85',
      'fdcb9b4e1d9c4cd7',
    ],
  },
};
