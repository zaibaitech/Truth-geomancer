// Stage 1a guard: BUILD OUTPUT scan (opt-in inside vitest).
//
// Needs a fresh `next build`, so it is skipped in the normal unit run. CI and
// local use:   npm run build && npm run test:leaks
// or inside vitest:   LEAK_SCAN_NEXT_DIR=.next npx vitest run tests/guards/buildOutputScan.test.ts
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkBuildRatchet, scanBuild, scanStarContent } from './lib/buildScan';
import { KNOWN_BUILD_LEAK_IDS } from '../fixtures/knownLeaks';

const nextDir = process.env.LEAK_SCAN_NEXT_DIR ? resolve(process.env.LEAK_SCAN_NEXT_DIR) : '';

describe.skipIf(!nextDir)('build output leak scan (set LEAK_SCAN_NEXT_DIR to enable)', () => {
  it('a build exists at LEAK_SCAN_NEXT_DIR', () => {
    expect(existsSync(resolve(nextDir, 'static')), `no build at ${nextDir}`).toBe(true);
  });

  it('public chunks / prerendered pages match the known-leak baseline exactly (no new leaks; fixed leaks removed)', () => {
    const result = scanBuild(nextDir);
    expect(result.scannedFiles).toBeGreaterThan(0);
    const report = checkBuildRatchet(result, KNOWN_BUILD_LEAK_IDS);
    expect({ added: report.added, fixed: report.fixed, zeroTolerance: report.zeroToleranceHits.length }).toEqual({
      added: {},
      fixed: {},
      zeroTolerance: 0,
    });
  });

  it('NO paid per-star content (remedies, offerings, house-6 / house-2 text, occupations) in any public file, and no remedy:/offering: field markers', () => {
    const star = scanStarContent(nextDir);
    // every generated client JS file is in scope, not a single known chunk
    expect(star.scope.staticJs).toBeGreaterThan(0);
    expect(star.protectedStrings).toBeGreaterThanOrEqual(50);
    expect(star.hits).toEqual([]);
  });
});
