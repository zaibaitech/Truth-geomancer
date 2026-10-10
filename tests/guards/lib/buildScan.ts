// Scans a Next.js build directory for protected-content fingerprints.
//
// Scanned (everything a visitor can download without an entitlement):
//   .next/static/**/*.js                          client JS chunks (public, CDN-cached)
//   .next/server/app/**/*.html                    prerendered HTML of static routes
//   .next/server/app/**/*.rsc, *.body             prerendered RSC flight payloads
// NOT scanned: .next/server/**/*.js (server bundles legitimately contain the
// protected corpus; they never leave the server).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { buildFingerprints, findHits, normalizeHtml, normalizeText, type Fingerprint, type Hit } from './leakMatcher';
import { protectedStrings } from '../../fixtures/protectedContent';
import { ELEMENT_OCCUPATIONS, STAR_NOTES } from '../../../lib/server/content/starNotes';
import { publicCorpus } from '../../fixtures/publicContentAllowlist';

export interface FileHit extends Hit {
  file: string;
  routes: string[];
}

export interface ScanResult {
  scannedFiles: number;
  fingerprints: number;
  hits: FileHit[];
  /** Distinct protected strings found anywhere, per group. */
  distinctByGroup: Record<string, number>;
  /** Distinct fingerprint ids found (input to the known-leak ratchet). */
  ids: Record<string, string[]>;
}

function walk(dir: string, filter: (f: string) => boolean, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, filter, out);
    else if (filter(full)) out.push(full);
  }
  return out;
}

/** chunk path (relative to .next/) -> app routes that load it. */
function chunkRoutes(nextDir: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const manifestPath = join(nextDir, 'app-build-manifest.json');
  if (!existsSync(manifestPath)) return map;
  const pages = (JSON.parse(readFileSync(manifestPath, 'utf8')).pages ?? {}) as Record<string, string[]>;
  for (const [route, files] of Object.entries(pages)) {
    for (const f of files) {
      const list = map.get(f) ?? [];
      list.push(route.replace(/\/page$/, '') || '/');
      map.set(f, list);
    }
  }
  return map;
}

export function defaultFingerprints(): Fingerprint[] {
  return buildFingerprints(protectedStrings(), publicCorpus());
}

export function scanBuild(nextDir: string, fingerprints: Fingerprint[] = defaultFingerprints()): ScanResult {
  const routesByChunk = chunkRoutes(nextDir);
  const staticJs = walk(join(nextDir, 'static'), (f) => f.endsWith('.js'));
  const prerendered = walk(join(nextDir, 'server', 'app'), (f) => /\.(html|rsc|body)$/.test(f));
  const hits: FileHit[] = [];
  for (const file of [...staticJs, ...prerendered]) {
    const raw = readFileSync(file, 'utf8');
    const hay = file.endsWith('.html') ? normalizeHtml(raw) : normalizeText(raw);
    const relToNext = relative(nextDir, file).split('\\').join('/');
    const routes = routesByChunk.get(relToNext) ?? (relToNext.startsWith('server/app/') ? [`/${relToNext.slice('server/app/'.length).replace(/\.(html|rsc|body)$/, '')}`] : []);
    for (const h of findHits(hay, fingerprints)) hits.push({ ...h, file: relToNext, routes });
  }
  const distinct: Record<string, Set<string>> = {};
  for (const h of hits) (distinct[h.group] ??= new Set()).add(h.id);
  return {
    scannedFiles: staticJs.length + prerendered.length,
    fingerprints: fingerprints.length,
    hits,
    distinctByGroup: Object.fromEntries(Object.entries(distinct).map(([g, s]) => [g, s.size])),
    ids: Object.fromEntries(Object.entries(distinct).map(([g, s]) => [g, Array.from(s).sort()])),
  };
}

/** Public SEO route prefixes reserved for Phase 1: zero tolerance, baseline or not. */
export const ZERO_TOLERANCE_ROUTE_PREFIXES = ['/learn', '/figures', '/houses', '/guides', '/glossary', '/faq'];

export interface BuildRatchetReport {
  ok: boolean;
  /** Fingerprint ids found that are not in the known-leak baseline. */
  added: Record<string, string[]>;
  /** Baseline ids no longer found: remove them from tests/fixtures/knownLeaks.ts. */
  fixed: Record<string, string[]>;
  /** Any hit in a chunk/page belonging to a zero-tolerance route. */
  zeroToleranceHits: FileHit[];
}

export function checkBuildRatchet(result: ScanResult, baseline: Record<string, { ids: string[] }>): BuildRatchetReport {
  const groups = new Set([...Object.keys(result.ids), ...Object.keys(baseline)]);
  const added: Record<string, string[]> = {};
  const fixed: Record<string, string[]> = {};
  for (const g of Array.from(groups)) {
    const cur = new Set(result.ids[g] ?? []);
    const base = new Set(baseline[g]?.ids ?? []);
    const a = Array.from(cur).filter((x) => !base.has(x)).sort();
    const f = Array.from(base).filter((x) => !cur.has(x)).sort();
    if (a.length) added[g] = a;
    if (f.length) fixed[g] = f;
  }
  const zeroToleranceHits = result.hits.filter((h) =>
    h.routes.some((r) => ZERO_TOLERANCE_ROUTE_PREFIXES.some((p) => r === p || r.startsWith(`${p}/`))),
  );
  return {
    ok: Object.keys(added).length === 0 && Object.keys(fixed).length === 0 && zeroToleranceHits.length === 0,
    added,
    fixed,
    zeroToleranceHits,
  };
}

// ---------------------------------------------------------------------------------------------------------
// Paid per-star content: dedicated zero-tolerance scan of EVERYTHING a visitor can download.
//
// The per-star house-6 / house-2 meanings and remedies, sadaqah offerings / days and element occupations must
// appear in NO public file. Beyond the fingerprint ratchet above, this scan checks every public text file for
//   (a) each protected string verbatim, JSON-escaped, HTML-escaped and \uXXXX-escaped (so minification and RSC
//       or JSON serialisation cannot hide it), and
//   (b) the field markers `remedy:` and `offering:` (and the house6 / house2 object keys), as plain, quoted and
//       backslash-escaped keys, which catches the data shape even if the wording changes.
// Scope (reported by the scan): .next/static/** (every file, not only app chunks), .next/server/app prerendered
// html / rsc / body, and the public/ directory (service worker, manifest, static JSON).
// ---------------------------------------------------------------------------------------------------------
export const PROTECTED_FIELD_MARKERS: { name: string; re: RegExp }[] = [
  { name: 'remedy:', re: /\\{0,3}["'`]?\bremedy\\{0,3}["'`]?\s*:/ },
  { name: 'offering:', re: /\\{0,3}["'`]?\boffering\\{0,3}["'`]?\s*:/ },
  { name: 'house6:/house2: {', re: /\\{0,3}["'`]?\bhouse[62]\\{0,3}["'`]?\s*:\s*\{/ },
  { name: '["remedy"] / ["offering"]', re: /\[\s*\\{0,3}["'`](remedy|offering)\\{0,3}["'`]\s*\]/ },
];

export interface StarScanHit {
  file: string;
  kind: 'string' | 'marker';
  detail: string;
}

export interface StarScanResult {
  scope: { staticFiles: number; staticJs: number; prerendered: number; publicFiles: number; total: number };
  protectedStrings: number;
  hits: StarScanHit[];
}

const MIN_STRING_LENGTH = 16;
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
const escapeUnicode = (s: string) => s.replace(/[\u0080-\uffff]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);

function starStrings(): string[] {
  const all = [
    ...Object.values(STAR_NOTES).flatMap((n) => [n.house6.meaning, n.house6.remedy, n.house2.meaning, n.house2.remedy, n.sadaqah.offering, n.sadaqah.day]),
    ...Object.values(ELEMENT_OCCUPATIONS),
  ];
  return Array.from(new Set(all.filter((x) => x.length >= MIN_STRING_LENGTH)));
}

const TEXT_FILE = /\.(js|mjs|cjs|json|map|html|txt|rsc|body|webmanifest|svg|css)$/i;

export function scanStarContent(nextDir: string, publicDir: string = join(nextDir, '..', 'public')): StarScanResult {
  const staticFiles = walk(join(nextDir, 'static'), (f) => TEXT_FILE.test(f));
  const prerendered = walk(join(nextDir, 'server', 'app'), (f) => /\.(html|rsc|body)$/.test(f));
  const publicFiles = walk(publicDir, (f) => TEXT_FILE.test(f));
  const strings = starStrings();
  const jsonEsc = (s: string) => JSON.stringify(s).slice(1, -1);
  // verbatim, JSON-escaped, JSON-escaped twice (a JSON string inside a JSON string, as in RSC flight scripts),
  // HTML-escaped and \uXXXX-escaped
  const variants = strings.flatMap((s) => [s, jsonEsc(s), jsonEsc(jsonEsc(s)), escapeHtml(s), escapeUnicode(s)].map((v) => ({ s, v })));
  const normalisedStrings = strings.map((s) => normalizeText(s));
  const hits: StarScanHit[] = [];
  for (const file of [...staticFiles, ...prerendered, ...publicFiles]) {
    const raw = readFileSync(file, 'utf8');
    const rel = (file.startsWith(nextDir) ? '.next/' + relative(nextDir, file) : 'public/' + relative(publicDir, file)).split('\\').join('/');
    const seen = new Set<string>();
    for (const { s, v } of variants) {
      if (!seen.has(s) && raw.includes(v)) {
        seen.add(s);
        // never print the protected text: report only a hash-free ordinal and its length
        hits.push({ file: rel, kind: 'string', detail: `protected string #${strings.indexOf(s)} (${s.length} chars)` });
      }
    }
    // normalised comparison too (quote style, \n and \u escapes, markdown markers), as the fingerprint scan does
    const hay = normalizeText(raw);
    normalisedStrings.forEach((n, i) => {
      if (!seen.has(strings[i]) && hay.includes(n)) {
        seen.add(strings[i]);
        hits.push({ file: rel, kind: 'string', detail: `protected string #${i} (${strings[i].length} chars)` });
      }
    });
    for (const m of PROTECTED_FIELD_MARKERS) {
      const found = raw.match(new RegExp(m.re.source, 'g'));
      if (found) hits.push({ file: rel, kind: 'marker', detail: `${m.name} x${found.length}` });
    }
  }
  return {
    scope: {
      staticFiles: staticFiles.length,
      staticJs: staticFiles.filter((f) => f.endsWith('.js')).length,
      prerendered: prerendered.length,
      publicFiles: publicFiles.length,
      total: staticFiles.length + prerendered.length + publicFiles.length,
    },
    protectedStrings: strings.length,
    hits,
  };
}
