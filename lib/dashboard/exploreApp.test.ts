// Prompt 63: tests for the dashboard's "Explore the App" strip data — pure
// data only, no DOM/JSX involved.
import { describe, expect, it } from 'vitest';
import { EXPLORE_APP_ITEMS } from './exploreApp';

describe('EXPLORE_APP_ITEMS', () => {
  it('A: has exactly the four items Prompt 63 specifies, in order', () => {
    expect(EXPLORE_APP_ITEMS.map((i) => i.title)).toEqual(['Cast', 'The 16 Stars', 'Sadaqah Guide', 'Your Buruj']);
  });

  it('B: "Cast" routes to the existing casting route, not a new/fake flow', () => {
    expect(EXPLORE_APP_ITEMS.find((i) => i.title === 'Cast')?.href).toBe('/raml');
  });

  it('C: every other item routes into the existing Master of Geomancy reader (no invented route)', () => {
    for (const item of EXPLORE_APP_ITEMS.filter((i) => i.title !== 'Cast')) {
      expect(item.href.startsWith('/books/master-of-geomancy-vol-1/read#')).toBe(true);
    }
  });

  it('D: every item has a non-empty title and description', () => {
    for (const item of EXPLORE_APP_ITEMS) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.description.length).toBeGreaterThan(0);
    }
  });

  it('E: hrefs are unique — no two items point at the same destination', () => {
    const hrefs = EXPLORE_APP_ITEMS.map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
