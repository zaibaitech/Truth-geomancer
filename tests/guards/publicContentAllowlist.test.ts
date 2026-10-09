// Stage 1a guard: the FREE-materials allowlist stays truthful.
// Every free claim must point at real code, and the free sample / preview
// entries must agree with the runtime access policy.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from './lib/importGraph';
import { FREE_MATERIALS, FREE_ROUTES, NOT_FREE_NOTES } from '../fixtures/publicContentAllowlist';
import { ROUTE_CLASSIFICATION } from '../fixtures/routeClassification';
import { FREE_SAMPLE_QUESTION_FILE } from '../fixtures/protectedContent';
import { getFreeCastingSample, isFreeCastingIntention, GENERAL_READING_INTENTION_ID } from '@/lib/access/castingAuthorization';
import { PREVIEW_POLICIES } from '@/lib/access/previewPolicy';
import { ownHouseInLifeQuestion } from '@/lib/raml/engine/questions/ownHouseInLife';

describe('free-materials allowlist', () => {
  it('ids are unique and every entry has sources, routes, notes and free strings', () => {
    expect(new Set(FREE_MATERIALS.map((m) => m.id)).size).toBe(FREE_MATERIALS.length);
    for (const m of FREE_MATERIALS) {
      expect(m.sources.length, m.id).toBeGreaterThan(0);
      expect(m.routes.length, m.id).toBeGreaterThan(0);
      expect(m.notes.length, m.id).toBeGreaterThan(0);
      expect(m.strings().length, m.id).toBeGreaterThan(0);
    }
  });

  it('every cited source file exists and contains the cited export names', () => {
    for (const m of FREE_MATERIALS) {
      for (const s of m.sources) {
        const path = join(REPO_ROOT, s.file);
        expect(existsSync(path), `${m.id}: ${s.file}`).toBe(true);
        const src = readFileSync(path, 'utf8');
        for (const e of s.exports) {
          const name = e.match(/^[A-Za-z_][A-Za-z0-9_]*/)?.[0];
          if (name) expect(src, `${m.id}: ${s.file} should define ${name}`).toContain(name);
        }
      }
    }
  });

  it('every free route maps to an existing route file classified as public', () => {
    for (const r of FREE_ROUTES) {
      expect(existsSync(join(REPO_ROOT, r.source)), r.source).toBe(true);
      expect(ROUTE_CLASSIFICATION[r.source], r.source).toBe('public');
    }
  });

  it('the Kanzul free sample is exactly the preview policy target (Ch. 146, own-house-in-life-method-1)', () => {
    const sample = getFreeCastingSample();
    const target = PREVIEW_POLICIES['kanzul-mikban'].preview.target;
    expect(target.kind).toBe('method');
    expect(sample?.methodId).toBe(target.kind === 'method' ? target.methodId : null);
    expect(sample?.methodId).toBe('own-house-in-life-method-1');
    expect(sample?.questionId).toBe(ownHouseInLifeQuestion.id);
    expect(FREE_SAMPLE_QUESTION_FILE).toBe('lib/raml/engine/questions/ownHouseInLife.ts');
  });

  it('the Master free preview is the Counting Method feature, one use', () => {
    const p = PREVIEW_POLICIES['master-of-geomancy-vol-1'].preview;
    expect(p.target.kind).toBe('feature');
    expect(p.maxUses).toBe(1);
    expect(PREVIEW_POLICIES['kanzul-mikban'].preview.maxUses).toBe(1);
  });

  it('the General Reading is NOT free (recorded in NOT_FREE_NOTES)', () => {
    expect(isFreeCastingIntention(GENERAL_READING_INTENTION_ID)).toBe(false);
    expect(NOT_FREE_NOTES.map((n) => n.id)).toContain('general-reading');
    expect(FREE_MATERIALS.some((m) => /general.?reading/i.test(m.id))).toBe(false);
  });

  it('only the one free sample question is castable for free', () => {
    const free = ['if-you-want-to-know-if-you-will', 'business-profit-and-loss', GENERAL_READING_INTENTION_ID].filter(isFreeCastingIntention);
    expect(free).toEqual([]);
  });
});
