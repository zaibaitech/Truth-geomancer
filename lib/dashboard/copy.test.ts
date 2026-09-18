// Prompt 61: enforces the "no prices yet" business decision at the data
// level — every static dashboard copy string is checked for anything that
// looks like a price (currency symbols, "$0"/"free"/"coming soon price"
// style placeholders), so a future edit that slips a price in gets caught
// here rather than only by review.
import { describe, expect, it } from 'vitest';
import { CONTACT_FOR_PRICE_COPY, EXPLORE_APP_COPY, EXPLORE_BOOKS_COPY, HERO_VALUE_PROP, TALK_TO_AUTHOR_COPY } from './copy';

const PRICE_LIKE_PATTERNS = [/[$£€₦₵]/, /\b\d+(\.\d+)?\s?(usd|ghs|gbp|eur)\b/i, /\bfree\b/i, /\bcoming soon\b/i];

function allStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(allStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(allStrings);
  return [];
}

describe('dashboard copy — no pricing anywhere (Prompt 61/63 business decision)', () => {
  const copyModules = { HERO_VALUE_PROP, EXPLORE_BOOKS_COPY, TALK_TO_AUTHOR_COPY, EXPLORE_APP_COPY, CONTACT_FOR_PRICE_COPY };

  it('A: no exported dashboard copy string contains a price, currency symbol, or invented price placeholder', () => {
    for (const [name, value] of Object.entries(copyModules)) {
      for (const str of allStrings(value)) {
        for (const pattern of PRICE_LIKE_PATTERNS) {
          expect(str, `${name} matched ${pattern}: "${str}"`).not.toMatch(pattern);
        }
      }
    }
  });

  it('B: CONTACT_FOR_PRICE_COPY directs the visitor to the author, not to a price', () => {
    expect(CONTACT_FOR_PRICE_COPY).toMatch(/author/i);
    expect(CONTACT_FOR_PRICE_COPY).toMatch(/price|payment/i);
  });

  it('C: hero copy avoids unverifiable superlative marketing claims', () => {
    const heroText = allStrings(HERO_VALUE_PROP).join(' ');
    for (const claim of [/world.?s first/i, /the only app/i, /no other app/i]) {
      expect(heroText).not.toMatch(claim);
    }
  });

  it('D: hero tags communicate classical knowledge + practical tools (Prompt 63 approved concept)', () => {
    expect(HERO_VALUE_PROP.tags.length).toBeGreaterThanOrEqual(2);
    const tagsText = HERO_VALUE_PROP.tags.join(' ').toLowerCase();
    expect(tagsText).toMatch(/classical|knowledge/);
    expect(tagsText).toMatch(/practical|tools|interactive/);
  });

  it('E: "The Books" heading is exactly what Prompt 63 specifies', () => {
    expect(EXPLORE_BOOKS_COPY.heading).toBe('The Books');
  });
});
