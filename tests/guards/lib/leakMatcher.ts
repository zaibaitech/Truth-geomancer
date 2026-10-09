// Fingerprint matcher shared by the build-output scan (scripts/scan-build-
// leaks.ts) and the rendered-page / API-response guards.
//
// Text is normalised so the same sentence matches whether it appears in a
// minified JS chunk (`\"` escapes, either quote style), an RSC/JSON payload,
// or server-rendered HTML (entities, inline tags around **bold** markdown).
// No protected text is stored in the repo by these tests: fingerprints are
// computed at run time from the protected modules themselves.

import { createHash } from 'node:crypto';

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#x27;': "'",
  '&#39;': "'",
  '&#x2F;': '/',
  '&nbsp;': ' ',
};

/** Normalises JS / JSON / plain text. */
export function normalizeText(input: string): string {
  return input
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\n/g, ' ')
    .replace(/\\(["'`\\])/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/["'`]/g, '"')
    .replace(/\s+/g, ' ');
}

/** Normalises server-rendered HTML: drops tags, decodes common entities. */
export function normalizeHtml(html: string): string {
  const noTags = html.replace(/<script[^>]*>/g, ' ').replace(/<\/script>/g, ' ').replace(/<[^>]+>/g, '');
  const decoded = noTags.replace(/&(amp|lt|gt|quot|nbsp|#x27|#39|#x2F);/g, (e) => ENTITIES[e] ?? e);
  return normalizeText(decoded);
}

export const MIN_FINGERPRINT_LENGTH = 24;
const WINDOW = 64;

export interface ProtectedString {
  group: string;
  /** Repo file the string came from (for reports). */
  source: string;
  text: string;
  /** Pre-normalised exact token (used for structured data such as the Hatim
   * triplets, which never appear as prose). */
  exact?: boolean;
}

export interface Fingerprint {
  /** Stable, non-reversible id: sha256(group | normalised protected string), 16 hex chars.
   * Used by the known-leak ratchet so no protected text is stored in the repo. */
  id: string;
  group: string;
  source: string;
  /** Short, non-sensitive label for reports: first 6 words, then an ellipsis. */
  label: string;
  windows: string[];
}

function windowsFor(norm: string): string[] {
  if (norm.length <= WINDOW) return [norm];
  const mid = Math.floor((norm.length - WINDOW) / 2);
  return Array.from(new Set([norm.slice(0, WINDOW), norm.slice(mid, mid + WINDOW), norm.slice(norm.length - WINDOW)]));
}

export function labelFor(text: string): string {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  return words.length > 6 ? `${words.slice(0, 6).join(' ')} …` : words.join(' ');
}

/**
 * Builds fingerprints from protected strings, dropping any window that also
 * occurs in the public (intentionally free) corpus, so free content is never
 * flagged. A protected string whose every window is public is skipped.
 */
export function buildFingerprints(protectedStrings: ProtectedString[], publicCorpus: string[]): Fingerprint[] {
  const corpus = publicCorpus.map(normalizeText).join('\u0000');
  const seen = new Set<string>();
  const out: Fingerprint[] = [];
  for (const p of protectedStrings) {
    const norm = p.exact ? p.text : normalizeText(p.text).trim();
    if (norm.length < MIN_FINGERPRINT_LENGTH) continue;
    // Identifiers (chapter/method ids, slugs) are public routing keys, not prose.
    if (!p.exact && !/\s/.test(norm)) continue;
    if (seen.has(`${p.group}\u0000${norm}`)) continue;
    seen.add(`${p.group}\u0000${norm}`);
    const windows = windowsFor(norm).filter((w) => !corpus.includes(w));
    if (windows.length === 0) continue;
    const id = createHash('sha256').update(`${p.group}|${norm}`).digest('hex').slice(0, 16);
    out.push({ id, group: p.group, source: p.source, label: labelFor(p.text), windows });
  }
  return out;
}

export interface Hit {
  id: string;
  group: string;
  source: string;
  label: string;
}

/** Returns every fingerprint found in an already-normalised haystack. */
export function findHits(normalizedHaystack: string, fingerprints: Fingerprint[]): Hit[] {
  const hits: Hit[] = [];
  for (const fp of fingerprints) {
    if (fp.windows.some((w) => normalizedHaystack.includes(w))) hits.push({ id: fp.id, group: fp.group, source: fp.source, label: fp.label });
  }
  return hits;
}

/** Recursively collects string values from module exports / data (functions skipped). */
export function collectStrings(value: unknown, out: string[] = [], depth = 0): string[] {
  if (depth > 12 || value == null) return out;
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const v of value) collectStrings(v, out, depth + 1);
  else if (typeof value === 'object') for (const v of Object.values(value as Record<string, unknown>)) collectStrings(v, out, depth + 1);
  return out;
}

/** String literals in a TS source file (comments removed). Used where the
 * protected text lives inside functions (engine `evaluate` interpretations)
 * and so cannot be reached through exports. */
export function stringLiteralsInSource(source: string, minLength = MIN_FINGERPRINT_LENGTH): string[] {
  const noComments = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/[^\n]*/g, '$1');
  const out: string[] = [];
  const re = /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(noComments))) {
    const raw = m[1] ?? m[2] ?? m[3] ?? '';
    if (raw.includes('${')) continue;
    if (raw.length >= minLength) out.push(raw);
  }
  return out;
}
