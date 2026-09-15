// Tests for offline content resolution (Prompt 23, section 19 item 1):
// which URLs "download for offline" fetches for a given book, and that the
// list can never drift from the chapter's own "Try this method" CTA
// eligibility.
import { describe, expect, it } from 'vitest';
import { offlineUrlsForBook } from './bookOfflineUrls';
import { KM_CHAPTERS } from '@/content/manuscripts/kanzul-mikban';
import { practicableMethodsForChapter } from '@/lib/raml/methodPractice';

describe('offlineUrlsForBook — Kanzul Mikban', () => {
  const urls = offlineUrlsForBook('kanzul-mikban');

  it('includes the book detail page and the chapter reader', () => {
    expect(urls).toContain('/books/kanzul-mikban');
    expect(urls).toContain('/books/kanzul-mikban/read');
  });

  it('includes exactly one practice URL per practicable method, matching the chapter CTA eligibility function', () => {
    const expected = KM_CHAPTERS.flatMap((chapter) =>
      practicableMethodsForChapter(chapter.id).map((m) => `/raml/practice/${chapter.id}/${m.method.id}`),
    );
    const practiceUrls = urls.filter((u) => u.startsWith('/raml/practice/'));
    expect(practiceUrls.sort()).toEqual(expected.sort());
    expect(new Set(practiceUrls).size).toBe(practiceUrls.length); // no duplicates
  });

  it('never includes a practice URL for a non-verified method', () => {
    for (const chapter of KM_CHAPTERS) {
      const eligibleIds = new Set(practicableMethodsForChapter(chapter.id).map((m) => m.method.id));
      const chapterUrls = urls.filter((u) => u.startsWith(`/raml/practice/${chapter.id}/`));
      for (const u of chapterUrls) {
        const methodId = u.split('/').pop()!;
        expect(eligibleIds.has(methodId)).toBe(true);
      }
    }
  });
});

describe('offlineUrlsForBook — Master of Geomancy', () => {
  const urls = offlineUrlsForBook('master-of-geomancy-vol-1');

  it('includes the book detail page, the chapter reader, and both foundational practice routes', () => {
    expect(urls).toEqual([
      '/books/master-of-geomancy-vol-1',
      '/books/master-of-geomancy-vol-1/read',
      '/books/master-of-geomancy-vol-1/practice/counting-method',
      '/books/master-of-geomancy-vol-1/practice/cancelling-method',
    ]);
  });

  it('never claims a Kanzul Mikban-style per-method practice URL — Master has its own two fixed routes only', () => {
    for (const u of urls) {
      expect(u).not.toMatch(/^\/raml\/practice\//);
    }
  });
});

describe('offlineUrlsForBook — missing/unknown offline content (section 19 item 12)', () => {
  it('falls back to just the book detail page for an id with no known offline strategy, never inventing content', () => {
    expect(offlineUrlsForBook('some-future-book')).toEqual(['/books/some-future-book']);
  });
});

describe('offlineUrlsForBook — cached chapter navigation (section 19 item 3)', () => {
  it('the Kanzul Mikban list covers every chapter that has at least one practicable method', () => {
    const urls = offlineUrlsForBook('kanzul-mikban');
    const chaptersWithPractice = KM_CHAPTERS.filter((c) => practicableMethodsForChapter(c.id).length > 0);
    for (const chapter of chaptersWithPractice) {
      expect(urls.some((u) => u.startsWith(`/raml/practice/${chapter.id}/`))).toBe(true);
    }
  });
});
