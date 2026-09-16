// Prompt 27B, Phase 8 — security tests for the reading-verdicts server
// path that closes the residual Kanzul Mikban corpus leak Prompt 27 left
// documented and open (ReadingTab → methodVerdicts → methodParser → full
// KM_CHAPTERS, reachable from the client bundle). Numbered per the
// prompt's own Phase 8 list where a test maps 1:1 to one of its items.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fixtureChart } from '@/lib/raml/engine/__tests__/fixtures';
import { INTENTIONS } from '@/content/intentions';
import { KM_CHAPTER_META } from '@/content/manuscripts/kanzulMikbanMeta';
import { getReadingVerdictsForIntention } from './readingVerdictService';
import { getMethodVerdicts } from './raml/methodVerdicts';

const chart = fixtureChart();

function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git', '.data'].includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(full));
    else if (entry.name.endsWith('.tsx')) out.push(full);
  }
  return out;
}

// ---------------------------------------------------------------------------
// 1. ReadingTab has no import path to the Kanzul corpus.
// 2. methodParser is not imported by a client component.
// ---------------------------------------------------------------------------
describe('1-2: no client-reachable import path to the Kanzul corpus or its parser', () => {
  it('ReadingTab.tsx no longer imports methodVerdicts/methodParser directly', () => {
    const source = readFileSync('components/raml/ReadingTab.tsx', 'utf-8');
    expect(source).not.toMatch(/from ['"]@\/lib\/raml\/methodVerdicts['"]/);
    expect(source).not.toMatch(/from ['"]@\/lib\/server\/raml\/methodVerdicts['"]/);
    expect(source).not.toMatch(/methodParser/);
  });

  it('MethodVerdictCard.tsx imports its verdict type from the client-safe types file, not from lib/server', () => {
    const source = readFileSync('components/raml/MethodVerdictCard.tsx', 'utf-8');
    expect(source).toMatch(/from ['"]@\/lib\/raml\/readingVerdictTypes['"]/);
    expect(source).not.toMatch(/lib\/server/);
  });

  it('methodParser.ts and methodVerdicts.ts live under lib/server/ (not lib/raml/) and are absent from lib/raml/', () => {
    expect(() => readFileSync('lib/server/raml/methodParser.ts', 'utf-8')).not.toThrow();
    expect(() => readFileSync('lib/server/raml/methodVerdicts.ts', 'utf-8')).not.toThrow();
    expect(() => readFileSync('lib/raml/methodParser.ts', 'utf-8')).toThrow();
    expect(() => readFileSync('lib/raml/methodVerdicts.ts', 'utf-8')).toThrow();
  });

  it("no 'use client' component (app/ or components/) imports lib/server/raml/ at all", () => {
    const offenders: string[] = [];
    for (const file of [...listFilesRecursive('app'), ...listFilesRecursive('components')]) {
      const source = readFileSync(file, 'utf-8');
      if (source.trimStart().startsWith("'use client'") && /lib\/server\/raml/.test(source)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 3. unauthorized "Your Reading" request does not receive protected Kanzul
//    text beyond the same short, already-accepted interpretation sentence
//    the free product has always shown — see readingVerdictService.ts's
//    header for the confirmed access decision.
// ---------------------------------------------------------------------------
describe('3: the reading-verdicts response never carries the full protected paragraph or corpus', () => {
  it('every verdict object returned has exactly the public field set, never methodText/sourceText', () => {
    const withChapters = INTENTIONS.find((i) => i.chapterIds.length > 0)!;
    const result = getReadingVerdictsForIntention(withChapters.id, chart);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const allVerdicts = Object.values(result.verdicts)
      .flat()
      .filter((v): v is NonNullable<typeof v> => v !== null && v !== undefined);
    expect(allVerdicts.length).toBeGreaterThan(0);
    for (const v of allVerdicts) {
      expect(v).not.toHaveProperty('methodText');
      expect(Object.keys(v).sort()).toEqual(
        ['ambiguous', 'calculationSteps', 'housesUsed', 'interpretation', 'label', 'result'].sort(),
      );
    }
  });

  it('an unknown intentionId gets a safe not-found result, never a fallback dump of any chapter', () => {
    const result = getReadingVerdictsForIntention('not-a-real-intention-id', chart);
    expect(result).toEqual({ ok: false, reason: 'unknown-intention' });
  });
});

// ---------------------------------------------------------------------------
// 4. authorized request receives the same semantic result as before.
// 10. representative method results remain behaviorally identical.
// (byte-for-byte proof lives in readingVerdictsEquivalence.test.ts; this
// confirms the SERVICE's trimmed output matches the full computation minus
// exactly the one dropped field)
// ---------------------------------------------------------------------------
describe("4/10: the service returns the exact same computation, minus only the dropped field", () => {
  it('getReadingVerdictsForIntention output equals getMethodVerdicts output with methodText stripped, chapter by chapter', () => {
    const intention = INTENTIONS.find((i) => i.chapterIds.length > 0)!;
    const result = getReadingVerdictsForIntention(intention.id, chart);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const chapterId of intention.chapterIds) {
      const direct = getMethodVerdicts(chapterId, chart);
      const viaService = result.verdicts[chapterId];
      if (direct === null) {
        expect(viaService).toBeNull();
        continue;
      }
      expect(viaService).toHaveLength(direct.length);
      direct.forEach((v, i) => {
        if (v === null) {
          expect(viaService![i]).toBeNull();
        } else {
          const { methodText: _drop, ...expected } = v;
          expect(viaService![i]).toEqual(expected);
        }
      });
    }
  });
});

// ---------------------------------------------------------------------------
// 5. cross-book entitlement remains isolated. (N/A in the sense that this
//    free feature checks no entitlement at all — confirmed structurally:
//    no canAccessForUser call exists anywhere in this path, so there is no
//    entitlement state that could leak across books/users in the first
//    place — the isolation is total, not partial.)
// ---------------------------------------------------------------------------
describe('5: no entitlement state is consulted by this path at all, so none can leak across books or users', () => {
  it('readingVerdictService.ts never imports canAccessForUser/accessService', () => {
    const source = readFileSync('lib/server/readingVerdictService.ts', 'utf-8');
    expect(source).not.toMatch(/from ['"]\.\/accessService['"]/);
    expect(source).not.toMatch(/^import.*canAccessForUser/m);
  });

  it('the reading-verdicts route never imports session/identity — it cannot resolve or depend on a user', () => {
    const source = readFileSync('app/api/raml/reading-verdicts/route.ts', 'utf-8');
    expect(source).not.toMatch(/getCurrentUser|lib\/server\/session|lib\/server\/identity/);
  });
});

// ---------------------------------------------------------------------------
// 6. a forged userId cannot retrieve Kanzul results.
// 7. a revoked Kanzul entitlement cannot retrieve results.
// (Both items describe an identity/entitlement bypass attempt against a
// gated path. This path is deliberately ungated by design — see #5 — so
// there is no userId/entitlement input for a forgery or a revocation to
// act on in the first place; the request body accepts only intentionId
// and the caller's own chart, confirmed structurally below.)
// ---------------------------------------------------------------------------
describe('6-7: the request body has no userId/entitlement-shaped field for a forgery or stale grant to exploit', () => {
  it('the route only reads intentionId and chart from the request body', () => {
    const source = readFileSync('app/api/raml/reading-verdicts/route.ts', 'utf-8');
    expect(source).toMatch(/const \{ intentionId, chart \} = body/);
    expect(source).not.toMatch(/body\.userId|body\[.userId.\]|userId:\s*string/);
    expect(source).not.toMatch(/canAccessForUser|getCurrentUser/);
  });

  it('getReadingVerdictsForIntention takes no userId parameter — its signature is (intentionId, chart) only', () => {
    const source = readFileSync('lib/server/readingVerdictService.ts', 'utf-8');
    expect(source).toMatch(/export function getReadingVerdictsForIntention\(intentionId: string, chart: Chart\)/);
  });
});

// ---------------------------------------------------------------------------
// 8. the response does not contain the complete Kanzul corpus.
// 9. the response does not serialize all MethodDefinitions.
// ---------------------------------------------------------------------------
describe("8-9: the response is bounded to one intention's chapters, never the whole corpus or method set", () => {
  it('chapterIds are never accepted from the caller — only derived server-side from a real intentionId', () => {
    const source = readFileSync('lib/server/readingVerdictService.ts', 'utf-8');
    expect(source).toMatch(/intention\.chapterIds/);
    expect(source).not.toMatch(/body\.chapterIds|chapterIds:\s*string\[\]/);
  });

  it('a single intention only ever touches a small, bounded number of chapters — never all 153', () => {
    for (const intention of INTENTIONS) {
      expect(intention.chapterIds.length).toBeLessThan(KM_CHAPTER_META.length);
    }
  });

  it('the route module never imports KM_CHAPTERS/the full corpus directly, only the service', () => {
    const source = readFileSync('app/api/raml/reading-verdicts/route.ts', 'utf-8');
    expect(source).not.toMatch(/KM_CHAPTERS|kanzulMikban/);
  });
});
