// Shared ratchet comparison: current findings must be a subset of the
// baseline (no new leaks), and the baseline must not list anything that is
// no longer found (so fixed leaks are removed and cannot silently return).
export interface RatchetResult {
  added: string[];
  fixed: string[];
}

export function compareSets(current: Iterable<string>, baseline: Iterable<string>): RatchetResult {
  const cur = new Set(current);
  const base = new Set(baseline);
  return {
    added: Array.from(cur).filter((x) => !base.has(x)).sort(),
    fixed: Array.from(base).filter((x) => !cur.has(x)).sort(),
  };
}

export function formatRatchet(scope: string, r: RatchetResult): string {
  const lines: string[] = [];
  if (r.added.length) lines.push(`${scope}: NEW leak(s), not in the baseline: ${r.added.join(', ')}`);
  if (r.fixed.length)
    lines.push(`${scope}: fixed (good!). Remove these from tests/fixtures/knownLeaks.ts so the baseline shrinks: ${r.fixed.join(', ')}`);
  return lines.join('\n');
}
