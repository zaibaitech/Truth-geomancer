import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Prompt 18, section 12 — contrast.
 *
 * The palette's text colour is sand (#d9b878) on ink (#161009) or on a card
 * (#1f1610), and the app dims it with a Tailwind alpha suffix. Those suffixes
 * were chosen by eye, and by eye they looked fine: text-sand/35 reads as
 * "quiet metadata" while actually measuring 2.2:1, well below the 4.5:1 WCAG
 * AA asks for body text. This test computes the real ratio for every alpha the
 * codebase uses rather than trusting the eye, so a future `text-sand/40` fails
 * here instead of shipping.
 *
 * The floor applies to text only. Borders, backgrounds and figure glyphs are
 * not covered — a chart's geometry is not something anyone reads. */

const SAND: RGB = [0xd9, 0xb8, 0x78];
const INK: RGB = [0x16, 0x10, 0x09];
const CARD: RGB = [0x1f, 0x16, 0x10];

/** WCAG 2.1 AA for text below 24px (which is every reading size we ship). */
const AA_NORMAL_TEXT = 4.5;

type RGB = [number, number, number];

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]: RGB): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Tailwind's `/NN` suffix composites the colour onto whatever is behind it. */
function composite(fg: RGB, bg: RGB, alpha: number): RGB {
  return [0, 1, 2].map((i) => fg[i] * alpha + bg[i] * (1 - alpha)) as RGB;
}

function contrast(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) sourceFiles(path, found);
    else if (path.endsWith('.tsx')) found.push(path);
  }
  return found;
}

const ROOT = join(__dirname, '..', '..');
const FILES = [...sourceFiles(join(ROOT, 'app')), ...sourceFiles(join(ROOT, 'components'))];

function textAlphas(): { file: string; alpha: number }[] {
  const found: { file: string; alpha: number }[] = [];
  for (const file of FILES) {
    const source = readFileSync(file, 'utf8');
    for (const match of Array.from(source.matchAll(/(?:placeholder:)?text-sand\/(\d+)/g))) {
      found.push({ file: file.slice(ROOT.length + 1), alpha: Number(match[1]) / 100 });
    }
  }
  return found;
}

describe('text contrast', () => {
  it('measures the palette rather than trusting it', () => {
    // The two ends of the range, as a check on the maths itself.
    expect(contrast(SAND, INK)).toBeGreaterThan(9);
    expect(contrast(composite(SAND, INK, 0.35), INK)).toBeLessThan(3);
  });

  it('uses dimmed sand somewhere, or this test proves nothing', () => {
    expect(textAlphas().length).toBeGreaterThan(20);
  });

  it('keeps every dimmed text colour at AA on both the page and a card', () => {
    const failures = textAlphas()
      .filter(({ alpha }) => {
        const onInk = contrast(composite(SAND, INK, alpha), INK);
        const onCard = contrast(composite(SAND, CARD, alpha), CARD);
        return Math.min(onInk, onCard) < AA_NORMAL_TEXT;
      })
      .map(({ file, alpha }) => `${file}: text-sand/${Math.round(alpha * 100)}`);

    expect(Array.from(new Set(failures))).toEqual([]);
  });

  it('names the lowest alpha that still passes, so the floor is deliberate', () => {
    const passing = [];
    for (let alpha = 0.05; alpha <= 1; alpha += 0.05) {
      const onCard = contrast(composite(SAND, CARD, alpha), CARD);
      if (onCard >= AA_NORMAL_TEXT) passing.push(Math.round(alpha * 100));
    }
    // 65% is the floor the codebase was moved to; 60% measures 4.17:1 and fails.
    expect(passing[0]).toBe(65);
  });
});
