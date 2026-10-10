/**
 * SEO Stage 1a: build-output leak scan.
 *
 * Scans a finished `next build` (public client chunks plus prerendered
 * HTML/RSC) for fingerprints of protected (paid/restricted) content and
 * compares them to the known-leak ratchet in tests/fixtures/knownLeaks.ts.
 *
 *   npm run build && npm run test:leaks           # scan ./.next
 *   npm run test:leaks -- --next-dir /path/.next  # scan another build
 *   npm run test:leaks -- --verbose               # also print short labels and files
 *
 * Exit codes: 0 = matches the baseline; 1 = new leak, a fixed leak still in
 * the baseline, or a hit on a zero-tolerance SEO route; 2 = no build found.
 * Free materials (tests/fixtures/publicContentAllowlist.ts) are never flagged.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkBuildRatchet, scanBuild, scanStarContent } from '../tests/guards/lib/buildScan';
import { KNOWN_BUILD_LEAK_IDS } from '../tests/fixtures/knownLeaks';

const args = process.argv.slice(2);
const dirFlag = args.indexOf('--next-dir');
const nextDir = resolve(dirFlag >= 0 ? args[dirFlag + 1] : '.next');
const verbose = args.includes('--verbose');

if (!existsSync(resolve(nextDir, 'static'))) {
  console.error(`No Next.js build found at ${nextDir}. Run \`npm run build\` first (or pass --next-dir).`);
  process.exit(2);
}

const result = scanBuild(nextDir);
const report = checkBuildRatchet(result, KNOWN_BUILD_LEAK_IDS);

console.log(`Leak scan: ${nextDir}`);
console.log(`  files scanned: ${result.scannedFiles}   fingerprints: ${result.fingerprints}`);
const groups = Object.keys({ ...result.ids, ...KNOWN_BUILD_LEAK_IDS }).sort();
for (const g of groups) {
  const found = result.ids[g]?.length ?? 0;
  const base = KNOWN_BUILD_LEAK_IDS[g];
  const routes = Array.from(new Set(result.hits.filter((h) => h.group === g).flatMap((h) => h.routes))).sort();
  console.log(`  ${g}: ${found} found${base ? ` (known baseline ${base.leak}: ${base.ids.length})` : ''}${routes.length ? `  routes: ${routes.join(', ')}` : ''}`);
}
if (verbose) {
  const seen = new Set<string>();
  for (const h of result.hits) {
    const key = `${h.id}|${h.file}`;
    if (seen.has(key)) continue;
    seen.add(key);
    console.log(`    [${h.group}] ${h.id} "${h.label}" (${h.source}) in ${h.file}`);
  }
}

for (const [g, ids] of Object.entries(report.added)) console.error(`NEW LEAK in ${g}: ${ids.join(', ')}  (re-run with --verbose to see where)`);
for (const [g, ids] of Object.entries(report.fixed))
  console.error(`FIXED in ${g}, so remove from tests/fixtures/knownLeaks.ts KNOWN_BUILD_LEAK_IDS: ${ids.join(', ')}`);
for (const h of report.zeroToleranceHits) console.error(`ZERO-TOLERANCE route hit: ${h.routes.join(', ')} [${h.group}] ${h.id} in ${h.file}`);

// Paid per-star content (remedies, offerings, house-6 / house-2 text): zero tolerance in every public file.
const star = scanStarContent(nextDir);
console.log(
  `  paid star content scan: ${star.scope.total} public files (${star.scope.staticJs} client JS, ${star.scope.staticFiles - star.scope.staticJs} other static, ` +
    `${star.scope.prerendered} prerendered, ${star.scope.publicFiles} public/), ${star.protectedStrings} protected strings + field markers: ${star.hits.length} hits`,
);
for (const h of star.hits) console.error(`PAID STAR CONTENT in public file: ${h.file} [${h.kind}] ${h.detail}`);

if (!report.ok || star.hits.length > 0) process.exit(1);
console.log('OK: build output matches the known-leak baseline (which may only shrink).');
