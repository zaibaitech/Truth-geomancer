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
