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
    module: 'content/stars.ts',
    leak: 'L1',
    severity: 'high',
    why:
      'All 16 stars\' house-6/house-2 meanings, remedies and sadaqah. Imported by client components StarCard, ResultTabs, CastingResultView, ' +
      'app/search/page.tsx, BazdaahoArrangementDiagram, StarProseParagraph, BodyPartTable, KanzulFrontMatter, DreamInterpretationsBody, ' +
      'GiftVisitorFiguresBody, lib/raml/dreamPairingPresentation.ts. Loaded on /raml, /books/[id], /preview/*, /search, /settings and more.',
  },
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
  'app/books/[id]/page.tsx': ['content/stars.ts', 'lib/raml/engine/castingRequirement.ts'],
  'app/raml/page.tsx': [
    'content/classicalAttributes.ts',
    'content/kanzulFigureQuality.ts',
    'content/stars.ts',
    'lib/raml/engine/castingRequirement.ts',
    'lib/raml/engine/methodBasisTable.ts',
    'lib/raml/engine/reading.ts',
  ],
  'app/search/page.tsx': ['content/stars.ts'],
  'app/preview/kanzul-mikban/page.tsx': [
    'content/kanzulFigureQuality.ts',
    'content/stars.ts',
    'lib/raml/engine/castingRequirement.ts',
    'lib/raml/engine/methodBasisTable.ts',
    'lib/raml/engine/reading.ts',
  ],
  'app/preview/master-of-geomancy-vol-1/page.tsx': ['content/stars.ts'],
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
  'stars-restricted': {
    leak: 'L1',
    ids: [
      '043c24450cf64819', '0609d0ac6ca3b3c6', '072071465a094cc3', '098731634250a28c', '17e8554ca5cf04fa',
      '196159da48f7e774', '19b5b5c13e0ca268', '200326be9484085d', '2554e60f2354c853', '28c993112295296d',
      '362b5ded3a894cef', '40400465d1227087', '4d8ee5b6a29c0249', '539ed56f232b4494', '622cf75231113985',
      '651ee1b7279980f3', '655ee42cc00cd20c', '65c668d73e4921f8', '6858512542d82493', '6fb2c856ba490a14',
      '761b2b99af298494', '7ed114344eeac67e', '877a20e808f4912c', '9750c92585df388a', '9a37f803214dba9b',
      'a566045078ccebe5', 'a8a6cdab996faced', 'abfb854e488d55d8', 'ae5fda4d79fe67f3', 'baf9ee505577beb8',
      'bd2d1646764f178b', 'c35e93c9b3f5b96f', 'c8058cc63a92c893', 'ddacda711edbf1f1', 'e0355f8c1a253bbe',
      'e0bba4d0fe07539e', 'eb173868abd78add', 'eebd11edb584448e', 'efaeb1205e8cad4a', 'fec03730a200ac73',
    ],
  },
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
