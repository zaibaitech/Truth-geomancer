/** Extracts every house reference ("h1".."h16") mentioned in a piece of
 * method text, in reading order, deduplicated. Used so a Kanzul Mikban
 * method's exact house list can be looked up against a real cast chart,
 * without this app claiming to resolve the method's own good/bad verdict. */
export function extractHouseRefs(text: string): number[] {
  const found: number[] = [];
  const seen = new Set<number>();
  const re = /\bh(1[0-6]|[1-9])\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= 16 && !seen.has(n)) {
      seen.add(n);
      found.push(n);
    }
  }
  return found;
}
