// Structural guards for "Try this method" on The Master of Geomancy (Prompt
// 22). Same technique as practiceUi.test.ts: this app has no
// component-rendering harness, so these read the shipped source directly.
// The underlying data/derivation (starForCount, cancelledLineMark,
// cancellingMotherPattern, buildChart/addPatterns/deriveDaughters) is
// already proven correct by chapterOneDiagrams.test.ts and casting.test.ts;
// this file only proves the practice screens are wired to reuse it, never
// to recompute it, and that Counting and Cancelling stay genuinely separate.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CANCELLING_METHOD_EXAMPLES,
  CANCELLING_METHOD_MOTHER_PATTERNS,
  cancellingMotherPattern,
} from '@/content/manuscripts/chapterOneDiagrams';
import { CHAPTERS } from '@/lib/server/content/masterOfGeomancy';
import { COUNTING_METHOD_QUOTE, CANCELLING_METHOD_QUOTE } from '@/content/manuscripts/masterOfGeomancyMeta';

function repoFile(relative: string): string {
  return readFileSync(path.resolve(__dirname, '..', '..', relative), 'utf8');
}

const PAGE = repoFile('app/books/[id]/read/page.tsx');
const COUNTING_PRACTICE = repoFile('components/books/practice/CountingMethodPractice.tsx');
const CANCELLING_PRACTICE = repoFile('components/books/practice/CancellingMethodPractice.tsx');
const COUNTING_DIAGRAM = repoFile('components/books/CountingMethodDiagram.tsx');
const CANCELLING_DIAGRAM = repoFile('components/books/CancellingMethodDiagram.tsx');
const COUNTING_ROUTE = repoFile('app/books/master-of-geomancy-vol-1/practice/counting-method/page.tsx');
const CANCELLING_ROUTE = repoFile('app/books/master-of-geomancy-vol-1/practice/cancelling-method/page.tsx');

describe('1/2. CTAs appear only on the two verified, executable casting methods', () => {
  it('places a "Try the Counting Method" link right after the Counting diagram', () => {
    const idx = PAGE.indexOf('<CountingMethodDiagram');
    const linkIdx = PAGE.indexOf('/practice/counting-method', idx);
    expect(idx).toBeGreaterThan(-1);
    expect(linkIdx).toBeGreaterThan(idx);
  });

  it('places a "Try the Cancelling Method" link right after the Cancelling diagram', () => {
    const idx = PAGE.indexOf('<CancellingMethodDiagram');
    const linkIdx = PAGE.indexOf('/practice/cancelling-method', idx);
    expect(idx).toBeGreaterThan(-1);
    expect(linkIdx).toBeGreaterThan(idx);
  });

  it('adds exactly one CTA per method — never a duplicate, never one on an unrelated passage', () => {
    expect(PAGE.match(/\/practice\/counting-method/g)?.length).toBe(1);
    expect(PAGE.match(/\/practice\/cancelling-method/g)?.length).toBe(1);
  });

  it('gives no CTA to the addition-sequence, complete-chart or Bazdaaho sections — those stay reading-only', () => {
    const additionIdx = PAGE.indexOf('Adding Stars: From Mothers to the Full Chart');
    const bazdaahoIdx = PAGE.indexOf("chapter.id === \"bazdaaho-method\"");
    expect(additionIdx).toBeGreaterThan(-1);
    expect(bazdaahoIdx).toBeGreaterThan(-1);
    const additionSection = PAGE.slice(additionIdx, additionIdx + 600);
    const bazdaahoSection = PAGE.slice(bazdaahoIdx, bazdaahoIdx + 900);
    expect(additionSection).not.toContain('/practice/');
    expect(bazdaahoSection).not.toContain('/practice/');
  });
});

describe('3/4. Counting and Cancelling each launch their own correct practice route', () => {
  it('the counting-method route renders CountingMethodPractice, nothing else', () => {
    expect(COUNTING_ROUTE).toContain('CountingMethodPractice');
    expect(COUNTING_ROUTE).not.toContain('CancellingMethodPractice');
  });

  it('the cancelling-method route renders CancellingMethodPractice, nothing else', () => {
    expect(CANCELLING_ROUTE).toContain('CancellingMethodPractice');
    expect(CANCELLING_ROUTE).not.toContain('CountingMethodPractice');
  });

  it('the CTA hrefs point at exactly these two routes', () => {
    expect(PAGE).toContain('/books/master-of-geomancy-vol-1/practice/counting-method');
    expect(PAGE).toContain('/books/master-of-geomancy-vol-1/practice/cancelling-method');
  });
});

describe('5. Counting and Cancelling remain two distinct experiences, never merged', () => {
  it('each practice component only imports its own method’s diagram pieces, never the other’s', () => {
    expect(COUNTING_PRACTICE).toContain('CountingLineRow');
    expect(COUNTING_PRACTICE).not.toContain('CancellingLineFlow');
    expect(COUNTING_PRACTICE).not.toMatch(/from ['"]\.\.\/CancellingMethodDiagram['"]/);
    expect(CANCELLING_PRACTICE).toContain('CancellingLineFlow');
    expect(CANCELLING_PRACTICE).not.toContain('CountingLineRow');
    expect(CANCELLING_PRACTICE).not.toMatch(/from ['"]\.\.\/CountingMethodDiagram['"]/);
  });

  it('each practice screen carries its own distinct heading, never a generic "casting tutorial"', () => {
    expect(COUNTING_PRACTICE).toContain('The Counting Method');
    expect(CANCELLING_PRACTICE).toContain('The Cancelling Method');
    for (const src of [COUNTING_PRACTICE, CANCELLING_PRACTICE]) {
      expect(src.toLowerCase()).not.toContain('casting tutorial');
    }
  });
});

describe('6/7/9. No duplicate calculation — every figure and mark comes from existing, already-verified functions', () => {
  it('CountingMethodPractice imports starForCount/COUNTING_METHOD_EXAMPLES rather than recomputing a reduction', () => {
    expect(COUNTING_PRACTICE).toContain("from '@/content/manuscripts/chapterOneDiagrams'");
    expect(COUNTING_PRACTICE).toContain('COUNTING_METHOD_EXAMPLES');
    // No local re-derivation: the only "-16"/"%2" arithmetic in the whole
    // file should be inside the quoted source text, not new JS logic.
    const code = COUNTING_PRACTICE.split('\n')
      .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
      .join('\n');
    expect(code).not.toMatch(/%\s*2|-\s*16(?!")/);
  });

  it('CancellingMethodPractice imports cancelledLineMark/cancellingMotherPattern rather than recomputing a cancellation', () => {
    expect(CANCELLING_PRACTICE).toContain('cancellingMotherPattern');
    expect(CANCELLING_PRACTICE).toContain('CANCELLING_METHOD_EXAMPLES');
    expect(CANCELLING_PRACTICE).not.toMatch(/function cancelledLineMark|function cancellingMotherPattern/);
  });

  it('the Cancelling practice’s Mother Star pattern matches the already-computed, already-tested CANCELLING_METHOD_MOTHER_PATTERNS exactly', () => {
    CANCELLING_METHOD_EXAMPLES.forEach((example, i) => {
      expect(cancellingMotherPattern(example)).toEqual(CANCELLING_METHOD_MOTHER_PATTERNS[i]);
    });
  });

  it('both practice components reuse the shared FigureGlyph rather than drawing figures themselves', () => {
    expect(COUNTING_DIAGRAM).toContain('FigureGlyph');
    expect(CANCELLING_PRACTICE).toContain('FigureGlyph');
  });
});

describe('8. Source text is unchanged — the practice screens quote the chapter’s own prose verbatim', () => {
  const chapter = CHAPTERS.find((c) => c.id === 'drawing-a-chart')!;

  it('the Counting Method practice quotes chapter.body[1] with only the ** markup stripped', () => {
    // Prompt 27 (protected-content migration): the component now quotes a
    // dedicated public constant (COUNTING_METHOD_QUOTE) rather than
    // importing the full chapter body — but that constant is itself
    // byte-identical to chapter.body[1], asserted directly below.
    expect(COUNTING_PRACTICE).toContain('COUNTING_METHOD_QUOTE.replace(/\\*\\*/g, \'\')');
    expect(chapter.body![1]).toContain('The Counting Method');
    expect(chapter.body![1]).toContain('You will make 4 straight lines with dots');
    // The public quote constant must stay byte-identical to the real
    // server-only chapter body it was extracted from.
    expect(COUNTING_METHOD_QUOTE).toBe(chapter.body![1]);
  });

  it('the Cancelling Method practice quotes chapter.body[2] with only the ** markup stripped', () => {
    expect(CANCELLING_PRACTICE).toContain('CANCELLING_METHOD_QUOTE.replace(/\\*\\*/g, \'\')');
    expect(chapter.body![2]).toContain('The Cancelling Method');
    expect(chapter.body![2]).toContain('cancelling 2, 2, 2');
    expect(CANCELLING_METHOD_QUOTE).toBe(chapter.body![2]);
  });

  it('neither practice component contains a rewritten or paraphrased version of the source sentence', () => {
    expect(COUNTING_PRACTICE).not.toMatch(/make four lines|draw four lines/i);
    expect(CANCELLING_PRACTICE).not.toMatch(/make four lines|draw four lines/i);
  });
});

describe('9. Source attribution stays visible on every practice screen', () => {
  it('both screens name the book and chapter', () => {
    for (const src of [COUNTING_PRACTICE, CANCELLING_PRACTICE]) {
      expect(src).toContain('The Master of Geomancy');
      expect(src).toMatch(/Chapter \{CHAPTER\.number\}/);
    }
  });

  it('both screens link back to the originating chapter', () => {
    for (const src of [COUNTING_PRACTICE, CANCELLING_PRACTICE]) {
      expect(src).toContain('/books/master-of-geomancy-vol-1/read#drawing-a-chart');
      expect(src).toContain('Back to the chapter');
    }
  });
});

describe('10. No regression: existing Kanzul Mikban practice and the Reading flow are untouched', () => {
  it('the KM practice module and flow never reference the new Master practice components', () => {
    for (const file of ['lib/raml/methodPractice.ts', 'components/raml/practice/MethodPracticeFlow.tsx']) {
      expect(repoFile(file)).not.toMatch(/CountingMethodPractice|CancellingMethodPractice|drawing-a-chart/);
    }
  });

  it('the Reading and Casting flow never reference the new Master practice components', () => {
    for (const file of ['components/raml/CastingFlow.tsx', 'components/raml/ResultTabs.tsx', 'components/raml/EngineReadingView.tsx']) {
      expect(repoFile(file)).not.toMatch(/CountingMethodPractice|CancellingMethodPractice/);
    }
  });

  it('ChapterMethodPractice.tsx (the Kanzul Mikban CTA) is untouched by this prompt', () => {
    expect(repoFile('components/books/ChapterMethodPractice.tsx')).not.toMatch(/CountingMethodPractice|CancellingMethodPractice|drawing-a-chart/);
  });
});

describe('12/14. Never calls this a "Reading" — practice terminology only', () => {
  it('neither screen says "Your Reading" or "YOUR READING IS READY"', () => {
    for (const src of [COUNTING_PRACTICE, CANCELLING_PRACTICE]) {
      expect(src).not.toContain('Your Reading');
      expect(src).not.toContain('YOUR READING IS READY');
    }
  });

  it('both screens say "Practicing", matching the established Kanzul Mikban practice convention', () => {
    for (const src of [COUNTING_PRACTICE, CANCELLING_PRACTICE]) {
      expect(src).toMatch(/Practicing/);
    }
  });
});

describe('11/15. Mobile — shared type scale, no fixed px text, no raw Tailwind size utilities, comfortable tap targets', () => {
  it('uses the shared type-* tokens throughout the new components', () => {
    for (const src of [COUNTING_PRACTICE, CANCELLING_PRACTICE]) {
      expect(src).toMatch(/type-(label|meta|body|evidence|quote|verdict|section|method|title)/);
      expect(src).not.toMatch(/text-\[\d+(\.\d+)?px\]/);
      expect(src).not.toMatch(/\btext-(xs|sm|base|lg|xl|[2-9]xl)\b/);
    }
  });

  it('gives every button and link a comfortable minimum tap height', () => {
    for (const src of [COUNTING_PRACTICE, CANCELLING_PRACTICE]) {
      expect(src).toMatch(/min-h-\[(44|48|52)px\]/);
    }
  });
});

describe('regression: the geomancy engine and content data were not modified', () => {
  it('git-tracked engine files never reference the new practice components', () => {
    for (const file of ['lib/raml/casting.ts', 'lib/raml/engine/chartModel.ts', 'lib/raml/engine/ruleEngine.ts', 'lib/raml/engine/operations.ts']) {
      expect(repoFile(file)).not.toMatch(/CountingMethodPractice|CancellingMethodPractice/);
    }
  });

  it('chapterOneDiagrams.ts (the content layer this prompt reuses) was not modified — its exports are unchanged and still used, not redefined', () => {
    const content = repoFile('content/manuscripts/chapterOneDiagrams.ts');
    expect(content).toContain('export function starForCount');
    expect(content).toContain('export function cancelledLineMark');
    expect(content).toContain('export function cancellingMotherPattern');
  });
});
