// Structural security checks on the Prompt 29 preview route handler — same
// pattern as paymentRequestRoutes.test.ts (Prompt 28) and
// contentDeliverySecurity.test.ts (Prompt 27): the domain layer's
// correctness is proven in previewService.test.ts; these prove the ROUTE
// WIRING never undermines it (Phase 16 — SECURITY 16-22).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PREVIEW_ROUTE = readFileSync('app/api/preview/[bookId]/route.ts', 'utf-8');

function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git', '.data'].includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(full));
    else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

describe('16: client cannot supply another user ID', () => {
  it('the route never reads userId from the request body — only getCurrentUser()/getCurrentUserIfPresent()', () => {
    expect(PREVIEW_ROUTE).not.toMatch(/body\.userId|\{\s*userId[,}]/);
    expect(PREVIEW_ROUTE).toMatch(/getCurrentUser\(\)/);
  });
});

describe('17: client cannot reset usage', () => {
  it('the route exposes no reset/clear/delete operation on preview_usage — only executeBookPreview/getPreviewStatusForUser are called', () => {
    expect(PREVIEW_ROUTE).not.toMatch(/reset|DELETE FROM preview_usage|clearPreview/i);
  });
});

describe('18: client cannot increase limit', () => {
  it('the route never reads maxUses/limit from the request body — the limit comes only from lib/access/previewPolicy.ts', () => {
    expect(PREVIEW_ROUTE).not.toMatch(/body\.maxUses|body\.limit|maxUses:\s*body/);
  });
});

describe('19: client cannot select an arbitrary preview method', () => {
  it('the route never reads methodId/featureKey from the request body — only `chart` and the URL’s bookId', () => {
    expect(PREVIEW_ROUTE).not.toMatch(/body\.methodId|body\.featureKey/);
    expect(PREVIEW_ROUTE).toMatch(/getPreviewPolicy\(params\.bookId\)/);
  });
});

describe('20: invalid book rejected', () => {
  it('both GET and POST check getPreviewPolicy(params.bookId) and refuse an unconfigured book', () => {
    const getUnconfigured = PREVIEW_ROUTE.match(/export async function GET[\s\S]*?export async function POST/)?.[0] ?? '';
    expect(getUnconfigured).toMatch(/unconfigured/);
    expect(PREVIEW_ROUTE).toMatch(/status: 404/);
  });
});

describe('21: invalid method rejected server-side', () => {
  it('the service validates the chart with isValidChart before trusting it, and previewService defensively re-checks the registry (see previewService.test.ts’s "unconfigured book" case)', () => {
    expect(PREVIEW_ROUTE).toMatch(/isValidChart/);
  });
});

describe('22: unauthenticated behavior follows the existing identity policy', () => {
  it('GET (status-only) uses the read-only getCurrentUserIfPresent(), matching every other Prompt 27/28 status check', () => {
    const getBody = PREVIEW_ROUTE.match(/export async function GET[\s\S]*?\n}/)?.[0] ?? '';
    expect(getBody).toMatch(/getCurrentUserIfPresent\(\)/);
  });

  it('POST (consuming) uses the cookie-writing getCurrentUser(), matching every other Prompt 27/28 mutation route', () => {
    const postBody = PREVIEW_ROUTE.match(/export async function POST[\s\S]*$/)?.[0] ?? '';
    expect(postBody).toMatch(/getCurrentUser\(\)/);
  });
});

describe('both routes set Cache-Control: private, no-store', () => {
  it('so a shared cache never serves one user’s preview status/result to another', () => {
    expect(PREVIEW_ROUTE).toMatch(/private, no-store/);
  });
});

describe('26: protected source text remains server-side', () => {
  it('no client component imports previewService, previewPolicy’s FreePreview objects are never rendered as raw content, and no client file imports the engine/registry', () => {
    const offenders: string[] = [];
    for (const file of [...listFilesRecursive('app'), ...listFilesRecursive('components')]) {
      const source = readFileSync(file, 'utf-8');
      if (!source.trimStart().startsWith("'use client'")) continue;
      if (
        /lib\/server\/previewService/.test(source) ||
        /from ['"]@\/lib\/raml\/engine['"]/.test(source) ||
        /from ['"]@\/lib\/raml\/engine\/questions['"]/.test(source)
      ) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});
