import { describe, expect, it, vi } from 'vitest';

// Prompt 59 test 12: a recognised Cast target whose owning book cannot be
// resolved must fail closed — even if the caller already holds entitlements.
// Isolated from the main authorization suite so the mock cannot leak.
vi.mock('./methodOwnership', async (importOriginal) => {
  const orig = await importOriginal<typeof import('./methodOwnership')>();
  return {
    ...orig,
    owningBookIdForIntention: (id: string) => {
      if (id === 'if-you-want-to-know-if-you-will') return null;
      return orig.owningBookIdForIntention(id);
    },
  };
});

import { authorizeCastingIntention } from './castingAuthorization';

describe('12. method with missing book relationship fails safely', () => {
  it('a known paid question with no owning book is denied even when entitled', () => {
    const authz = authorizeCastingIntention('if-you-want-to-know-if-you-will', {
      entitledBookIds: new Set(['kanzul-mikban', 'master-of-geomancy-vol-1']),
      pendingBookIds: new Set(),
    });
    expect(authz.allowed).toBe(false);
    expect(authz.reason).toBe('missing-book');
    expect(authz.accessState).toBe('locked');
    expect(authz.bookId).toBeNull();
    expect(JSON.stringify(authz)).not.toMatch(/sourceQuote|After drawing the chart/);
  });
});
