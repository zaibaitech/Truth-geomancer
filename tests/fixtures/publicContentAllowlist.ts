// INTENTIONALLY FREE / PUBLIC MATERIAL: the explicit allowlist (Stage 1a).
//
// Purpose:
//   1. The leak guards (tests/guards/*, scripts/scan-build-leaks.ts) subtract
//      everything listed here from the protected fingerprints, so free
//      content is never reported as a leak.
//   2. Future public SEO pages (Stage 1b+) may link to / reuse ONLY what is
//      listed here (plus content that goes through the reviewed-content
//      workflow). Anything not listed is treated as paid until the author
//      says otherwise.
//
// Every entry cites the repo file(s) and export(s) that make it free, so a
// reviewer can verify the claim. Entries whose free status is inferred
// rather than explicitly decided in code carry `needsAuthorConfirmation`.
//
// This file is test-only. It changes no runtime behaviour.
import { BOOKS } from '@/content/books';
import { CATEGORIES, INTENTIONS } from '@/content/intentions';
import { ELEMENT_LABEL, STARS } from '@/content/stars';
import { KM_CHAPTER_META } from '@/content/manuscripts/kanzulMikbanMeta';
import * as MasterMeta from '@/content/manuscripts/masterOfGeomancyMeta';
import * as ChapterOneDiagrams from '@/content/manuscripts/chapterOneDiagrams';
import { HOUSES } from '@/lib/raml/houses';
import { QUESTION_REGISTRY_META } from '@/lib/raml/questionRegistryMeta';
import { PREVIEW_POLICIES } from '@/lib/access/previewPolicy';
import { GENERAL_READING_BOOK_ID, GENERAL_READING_INTENTION_ID } from '@/lib/access/methodOwnership';
import { ownHouseInLifeQuestion } from '@/lib/raml/engine/questions/ownHouseInLife';
import { HOME_DESCRIPTION, HOME_TITLE, SITE_NAME } from '@/lib/seo';
import { collectStrings, stringLiteralsInSource } from '../guards/lib/leakMatcher';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from '../guards/lib/importGraph';

export type FreeAccess =
  /** Anyone, signed in or not; already rendered in public HTML or shipped in public JS by design. */
  | 'public'
  /** One free use per identity (anonymous session or signed-in account), enforced server-side by consumePreviewUse. */
  | 'free-preview-one-use'
  /** Castable without purchase on /raml (accessState 'free-sample'), enforced server-side by authorizeCastingIntention. */
  | 'free-sample-cast';

export interface SourceRef {
  file: string;
  exports: string[];
}

export interface FreeMaterial {
  id: string;
  title: string;
  access: FreeAccess;
  /** Public routes where a visitor meets this material. */
  routes: string[];
  sources: SourceRef[];
  notes: string;
  /** Set when free status is inferred (not an explicit product decision in code). */
  needsAuthorConfirmation?: string;
  /** The free strings themselves (subtracted from protected fingerprints). */
  strings: () => string[];
}

const sourceLiterals = (file: string) => stringLiteralsInSource(readFileSync(join(REPO_ROOT, file), 'utf8'), 1);

const FREE_SAMPLE_METHOD_FILE = 'lib/raml/engine/questions/ownHouseInLife.ts';

export const FREE_MATERIALS: FreeMaterial[] = [
  {
    id: 'book-catalogue',
    title: 'Book catalogue: titles, subtitles, author, descriptions, covers',
    access: 'public',
    routes: ['/', '/books', '/books/master-of-geomancy-vol-1', '/books/kanzul-mikban'],
    sources: [{ file: 'content/books.ts', exports: ['BOOKS'] }],
    notes: 'Storefront copy, rendered on the home page, library and book landing pages, and used in Book JSON-LD.',
    strings: () => collectStrings(BOOKS),
  },
  {
    id: 'chapter-titles',
    title: 'Chapter titles of both books (no chapter text)',
    access: 'public',
    routes: ['/books/master-of-geomancy-vol-1', '/books/kanzul-mikban', '/search'],
    sources: [
      { file: 'content/manuscripts/kanzulMikbanMeta.ts', exports: ['KM_CHAPTER_META'] },
      {
        file: 'content/manuscripts/masterOfGeomancyMeta.ts',
        exports: ['MASTER_CHAPTER_META', 'BOOK_TITLE', 'BOOK_SUBTITLE', 'DEDICATION_TITLE', 'INTRODUCTION_TITLE'],
      },
    ],
    notes:
      'Both *Meta.ts files say in their headers that they are public labels "safe for any client-reachable code". ' +
      'Rendered in the chapter lists on the book pages and in /search.',
    strings: () => [
      ...KM_CHAPTER_META.map((c) => c.title),
      ...MasterMeta.MASTER_CHAPTER_META.map((c) => c.title),
      MasterMeta.BOOK_TITLE,
      MasterMeta.BOOK_SUBTITLE,
      MasterMeta.DEDICATION_TITLE,
      MasterMeta.INTRODUCTION_TITLE,
    ],
  },
  {
    id: 'master-free-preview-counting-method',
    title: 'The Master of Geomancy free preview: the Counting Method walkthrough (Chapter 1)',
    access: 'free-preview-one-use',
    routes: ['/preview/master-of-geomancy-vol-1'],
    sources: [
      { file: 'lib/access/previewPolicy.ts', exports: ['PREVIEW_POLICIES["master-of-geomancy-vol-1"]', 'MASTER_PREVIEW'] },
      { file: 'content/manuscripts/masterOfGeomancyMeta.ts', exports: ['COUNTING_METHOD_QUOTE'] },
      {
        file: 'content/manuscripts/chapterOneDiagrams.ts',
        exports: ['COUNTING_METHOD_EXAMPLES', 'COUNTING_DIRECTION_NOTE', 'COUNTING_METHOD_CLOSING', 'PARITY_ADDITION_EXAMPLES', 'ADDITION_SEQUENCE'],
      },
    ],
    notes:
      'previewPolicy.ts: the Master preview is the Counting Method feature, "an already-existing, always-public walkthrough". ' +
      'masterOfGeomancyMeta.ts marks COUNTING_METHOD_QUOTE as one of the only two Master sentences exposed to the client.',
    strings: () => [MasterMeta.COUNTING_METHOD_QUOTE],
  },
  {
    id: 'master-chapter-one-diagrams',
    title: 'Chapter 1 casting diagrams (Cancelling Method, complete-chart example) shipped to the client',
    access: 'public',
    routes: ['/preview/master-of-geomancy-vol-1', '/books/master-of-geomancy-vol-1/practice/*'],
    sources: [
      { file: 'content/manuscripts/chapterOneDiagrams.ts', exports: ['* (whole module)'] },
      { file: 'content/manuscripts/masterOfGeomancyMeta.ts', exports: ['CANCELLING_METHOD_QUOTE'] },
    ],
    notes:
      'The whole module is client-reachable today (practice + preview pages). It holds worked casting examples (how to draw a chart), ' +
      'which are classical method rather than interpretation. CANCELLING_METHOD_QUOTE is documented as client-exposed in masterOfGeomancyMeta.ts.',
    needsAuthorConfirmation:
      'Only the Counting Method is the configured free preview. The Cancelling Method practice route is entitlement-gated, ' +
      'but its diagrams and quote ship in public JS. Confirm the author is happy for these how-to-cast diagrams to be public.',
    strings: () => [MasterMeta.CANCELLING_METHOD_QUOTE, ...collectStrings(ChapterOneDiagrams)],
  },
  {
    id: 'kanzul-free-sample-method',
    title: 'Kanzul Mikban free sample: Chapter 146 "Will I own a house in my life?" (own-house-in-life-method-1)',
    access: 'free-sample-cast',
    routes: ['/raml', '/preview/kanzul-mikban'],
    sources: [
      { file: 'lib/access/previewPolicy.ts', exports: ['KANZUL_PREVIEW (target method own-house-in-life-method-1)', 'PREVIEW_POLICIES'] },
      { file: 'lib/access/castingAuthorization.ts', exports: ['getFreeCastingSample', 'isFreeCastingIntention'] },
      { file: FREE_SAMPLE_METHOD_FILE, exports: ['ownHouseInLifeQuestion'] },
    ],
    notes:
      'The one unpaid Cast question (accessState "free-sample") and the one-use Kanzul preview. Its method quote and the three ' +
      'verdict lines are shown to free users. The engine still runs server-side, so the quote is not in the public JS.',
    strings: () => [...collectStrings(ownHouseInLifeQuestion), ...sourceLiterals(FREE_SAMPLE_METHOD_FILE), ...collectStrings(PREVIEW_POLICIES)],
  },
  {
    id: 'question-catalogue',
    title: 'Question catalogue: 10 categories, question titles, method labels and status (no quotes, no logic)',
    access: 'public',
    routes: ['/raml'],
    sources: [
      { file: 'content/intentions.ts', exports: ['CATEGORIES', 'INTENTIONS'] },
      { file: 'lib/raml/questionRegistryMeta.ts', exports: ['QUESTION_REGISTRY_META'] },
    ],
    notes:
      'questionRegistryMeta.ts says it is "safe for any client-reachable code" (id/title/category/status/casting enums only, never source.quote). ' +
      'This is the question picker shown before purchase.',
    strings: () => [...collectStrings(CATEGORIES), ...INTENTIONS.map((i) => i.label), ...collectStrings(QUESTION_REGISTRY_META)],
  },
  {
    id: 'figure-basics',
    title: 'The 16 stars: name, number (Bazdaaho order), dot pattern, element',
    access: 'public',
    routes: ['/search', '/raml'],
    sources: [{ file: 'content/stars.ts', exports: ['STARS[].id', 'STARS[].name', 'STARS[].number', 'STARS[].pattern', 'STARS[].element', 'ELEMENT_LABEL'] }],
    notes:
      'Rendered publicly in /search (star name + element + glyph) and on every cast chart. ONLY these fields are free. ' +
      'house6 / house2 / remedy / sadaqah in the same module are protected (see knownLeaks L1).',
    needsAuthorConfirmation:
      'Publishing name/pattern/element on indexable SEO pages (Stage 1c) needs the author to confirm. These are already public in-app.',
    strings: () => [...STARS.map((s) => s.name), ...Object.values(ELEMENT_LABEL)],
  },
  {
    id: 'houses-framework',
    title: 'The 16 chart positions: role, title, one-line meaning',
    access: 'public',
    routes: ['/raml'],
    sources: [{ file: 'lib/raml/houses.ts', exports: ['HOUSES'] }],
    notes: 'Generic classical house framework, client-reachable and shown in the cast result chart.',
    needsAuthorConfirmation: 'Confirm the wording may be reused on public /houses pages (Phase 2).',
    strings: () => collectStrings(HOUSES),
  },
  {
    id: 'site-metadata',
    title: 'Site name, home title/description and other SEO metadata',
    access: 'public',
    routes: ['/'],
    sources: [{ file: 'lib/seo.ts', exports: ['SITE_NAME', 'HOME_TITLE', 'HOME_DESCRIPTION'] }],
    notes: 'Search-snippet copy from PR #1.',
    strings: () => [SITE_NAME, HOME_TITLE, HOME_DESCRIPTION],
  },
];

/**
 * Free ROUTES (no purchase needed to open them). Paid content is reached
 * only after server-side entitlement checks. Recorded so new public pages
 * can link to these safely.
 */
export const FREE_ROUTES: { path: string; what: string; source: string }[] = [
  { path: '/', what: 'Home / storefront', source: 'app/page.tsx' },
  { path: '/books', what: 'Library list', source: 'app/books/page.tsx' },
  { path: '/books/[id]', what: 'Book landing pages (description, chapter titles, purchase + WhatsApp)', source: 'app/books/[id]/page.tsx' },
  { path: '/raml', what: 'Cast tool: free sample question (Ch. 146). Other questions locked', source: 'app/raml/page.tsx' },
  { path: '/star', what: 'My Star explainer (CTA to cast)', source: 'app/star/page.tsx' },
  { path: '/search', what: 'Search over book titles, chapter titles, star names (robots-disallowed)', source: 'app/search/page.tsx' },
  { path: '/more', what: 'Menu', source: 'app/more/page.tsx' },
  { path: '/preview/kanzul-mikban', what: 'One free Kanzul preview (Ch. 146), one use per identity (robots-disallowed)', source: 'app/preview/kanzul-mikban/page.tsx' },
  { path: '/preview/master-of-geomancy-vol-1', what: 'One free Master preview (Counting Method), one use per identity (robots-disallowed)', source: 'app/preview/master-of-geomancy-vol-1/page.tsx' },
];

/**
 * NOT free, recorded here because it is easy to assume otherwise.
 * The General Reading (intention "general") is owned by The Master of
 * Geomancy and requires that entitlement (lib/access/methodOwnership.ts:
 * GENERAL_READING_BOOK_ID; castingAuthorization.test.ts "Kanzul entitlement
 * does not unlock the Master general reading").
 */
export const NOT_FREE_NOTES = [
  {
    id: 'general-reading',
    what: `General Reading (intention "${GENERAL_READING_INTENTION_ID}") is paid: owned by ${GENERAL_READING_BOOK_ID}`,
    source: 'lib/access/methodOwnership.ts, lib/access/castingAuthorization.ts',
  },
  {
    id: 'result-tabs-on-free-sample',
    what:
      'UNCERTAIN: after a FREE sample cast, ResultTabs still shows the Overview / My Star / Sadaqah tabs. These are computed client-side ' +
      'from content/stars.ts (the judge and illness figures\' house-6 meaning, Buruji, and a sadaqah). That makes some house-6 and sadaqah text ' +
      'visible to non-buyers. Needs author/product confirmation whether that is intended. Until confirmed it stays PROTECTED here.',
    source: 'components/raml/ResultTabs.tsx (BASE_TABS, generalSadaqah, judge.star.house6), lib/raml/interpret.ts',
  },
];

/** Every free string, used to subtract free content from protected fingerprints. */
export function publicCorpus(): string[] {
  return FREE_MATERIALS.flatMap((m) => m.strings()).filter((s) => typeof s === 'string' && s.length > 0);
}
