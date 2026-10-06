// Kanzul contextual figure quality: a separate, provenance-labelled layer. It
// must never replace the global classical table, never guess for unresolved
// figures, and never touch named-star / element / source-specific methods.
import { describe, expect, it } from 'vitest';
import { buildChart, type Chart } from './casting';
import { fixtureChart } from './engine/__tests__/fixtures';
import { runReading } from './engine';
import { interpretationBasisForMethod } from './engine/methodBasisTable';
import {
  contextualOnlyQuality,
  figureQualityContext,
  figureQualityNotes,
  figureQualityText,
  isKanzulQualityUnresolved,
  KANZUL_FIGURE_QUALITY,
  KANZUL_QUALITY_PROVENANCE_NOTE,
  KANZUL_QUALITY_UNRESOLVED_NOTE,
  kanzulQualityOf,
} from '@/content/kanzulFigureQuality';
import { CLASSICAL_ATTRIBUTES } from '@/content/classicalAttributes';
import { getMethodVerdicts, basisForAxis } from '@/lib/server/raml/methodVerdicts';
import { getParsedMethods } from '@/lib/server/raml/methodParser';
import { KM_CHAPTERS } from '@/lib/server/content/kanzulMikban';
import type { Pattern } from '@/content/stars';

const GOOD = ['nuhu', 'iddris', 'mahadi', 'usman', 'kalla-allahu', 'adam'];
const MIDDLE = ['ibrahim', 'ali', 'musah', 'yussif', 'yunus'];
const BAD = ['hassan-hussein', 'umar', 'ayuba', 'issah', 'sulemana'];
// A figure id with no entry has no quality: methods then stay uncertain rather than guess.
const UNKNOWN_FIGURE = 'not-a-figure';

describe('kanzulFigureQuality — the contextual classification', () => {
  it.each(GOOD)('%s is good', (id) => expect(kanzulQualityOf(id)).toBe('good'));
  it.each(MIDDLE)('%s is middle-good', (id) => expect(kanzulQualityOf(id)).toBe('middle-good'));
  it.each(BAD)('%s is bad', (id) => expect(kanzulQualityOf(id)).toBe('bad'));

  it('Yunus: Kanzul middle-good, classical neutral (middle-good) — source-confirmed', () => {
    expect(kanzulQualityOf('yunus')).toBe('middle-good');
    expect(CLASSICAL_ATTRIBUTES.yunus.fortune).toBe('neutral');
    expect(KANZUL_FIGURE_QUALITY.yunus).toMatchObject({ quality: 'middle-good', status: 'contextual', confidence: 'high' });
  });

  it('Sulemana: Kanzul bad, classical bad — source-confirmed', () => {
    expect(kanzulQualityOf('sulemana')).toBe('bad');
    expect(CLASSICAL_ATTRIBUTES.sulemana.fortune).toBe('bad');
    expect(KANZUL_FIGURE_QUALITY.sulemana).toMatchObject({ quality: 'bad', status: 'contextual', confidence: 'high' });
  });

  it('a figure with no entry has no quality and is never guessed', () => {
    expect(kanzulQualityOf(UNKNOWN_FIGURE)).toBeNull();
    expect(isKanzulQualityUnresolved(UNKNOWN_FIGURE)).toBe(false);
    expect(figureQualityContext(UNKNOWN_FIGURE).quality).toBe('unresolved');
  });

  it('covers exactly the sixteen figures, 6 good / 5 middle / 5 bad / 0 unresolved', () => {
    expect(Object.keys(KANZUL_FIGURE_QUALITY).sort()).toEqual(Object.keys(CLASSICAL_ATTRIBUTES).sort());
    const count = (q: string | null) => Object.values(KANZUL_FIGURE_QUALITY).filter((e) => e.quality === q).length;
    expect([count('good'), count('middle-good'), count('bad'), count(null)]).toEqual([6, 5, 5, 0]);
  });

  it('every entry names its provenance, and none claims Kanzul Mikban as the source', () => {
    for (const entry of Object.values(KANZUL_FIGURE_QUALITY)) {
      expect(entry.provenance.length).toBeGreaterThan(0);
      const ownerConfirmed = entry.figure === 'yunus' || entry.figure === 'sulemana';
      if (ownerConfirmed) expect(entry.provenance[0]).toMatch(/project owner/);
      else if (entry.status === 'contextual') expect(entry.provenance[0]).toMatch(/Kitāb maʿrifat ʿalāmat al-insān/);
      expect(entry.provenance.join(' ')).not.toMatch(/^Kanzul Mikban$/);
    }
    expect(KANZUL_FIGURE_QUALITY.yussif.provenance.join(' ')).toMatch(/recorded explanation/);
    expect(KANZUL_QUALITY_PROVENANCE_NOTE).toMatch(/Kanzul Mikban does not explicitly define/);
  });

  it('does not touch the global classical table', () => {
    expect(CLASSICAL_ATTRIBUTES.yussif.fortune).toBe('bad');
    expect(CLASSICAL_ATTRIBUTES.yunus.fortune).toBe('neutral'); // source-confirmed middle-good
    expect(CLASSICAL_ATTRIBUTES.sulemana.fortune).toBe('bad');
    expect(CLASSICAL_ATTRIBUTES.adam.fortune).toBe('good');
    expect(CLASSICAL_ATTRIBUTES.iddris.fortune).toBe('good');
    expect(CLASSICAL_ATTRIBUTES['kalla-allahu'].fortune).toBe('good');
  });

  it('UI text states each quality, and never invents one for an unknown figure', () => {
    expect(figureQualityText(figureQualityContext('adam'))).toBe('Figure quality: Good');
    expect(figureQualityText(figureQualityContext('yussif'))).toBe('Figure quality: Middle-good');
    expect(figureQualityText(figureQualityContext('umar'))).toBe('Figure quality: Bad');
    expect(figureQualityText(figureQualityContext('yunus'))).toBe('Figure quality: Middle-good');
    expect(figureQualityText(figureQualityContext('sulemana'))).toBe('Figure quality: Bad');
    expect(figureQualityText(figureQualityContext(UNKNOWN_FIGURE))).toBe('Figure quality: Not classified');
  });

  it('records the quality the engine actually used, separately from the contextual one', () => {
    expect(figureQualityContext('adam', 'good')).toEqual({ quality: 'good', engineQuality: 'good', engineAgrees: true });
    expect(figureQualityContext('ibrahim', 'middleGood')).toMatchObject({ quality: 'middle-good', engineQuality: 'middle-good', engineAgrees: true });
    expect(figureQualityContext('yussif', 'bad')).toEqual({ quality: 'middle-good', engineQuality: 'bad', engineAgrees: false });
    // Yunus and Sulemana now agree with the engine's own table.
    expect(figureQualityContext('yunus', 'middleGood')).toEqual({ quality: 'middle-good', engineQuality: 'middle-good', engineAgrees: true });
    expect(figureQualityContext('sulemana', 'bad')).toEqual({ quality: 'bad', engineQuality: 'bad', engineAgrees: true });
    expect(figureQualityContext(UNKNOWN_FIGURE, 'good')).toEqual({ quality: 'unresolved', engineQuality: 'good', engineAgrees: false });
  });
});

describe('figureQualityNotes — what the UI says under "Figure quality"', () => {
  const USED = "This result was calculated with the app's existing figure table, which classifies this figure as";

  it('Yussif: contextual Middle-good, engine Bad — says the engine used Bad', () => {
    const ctx = figureQualityContext('yussif', 'bad');
    expect(figureQualityText(ctx)).toBe('Figure quality: Middle-good');
    expect(figureQualityNotes(ctx)).toEqual([`${USED} Bad.`]);
  });

  it('Yunus: Kanzul middle-good and engine middle-good — a plain match, no extra note', () => {
    const ctx = figureQualityContext('yunus', 'middleGood');
    expect(figureQualityText(ctx)).toBe('Figure quality: Middle-good');
    expect(figureQualityNotes(ctx)).toEqual([]);
  });

  it('Sulemana: Kanzul bad and engine bad — a plain match, no extra note', () => {
    const ctx = figureQualityContext('sulemana', 'bad');
    expect(figureQualityText(ctx)).toBe('Figure quality: Bad');
    expect(figureQualityNotes(ctx)).toEqual([]);
  });

  it('an unknown figure the engine still classified: says the engine used Good, unconfirmed, never "uncertain"', () => {
    const ctx = figureQualityContext(UNKNOWN_FIGURE, 'good');
    expect(figureQualityText(ctx)).toBe('Figure quality: Not classified');
    const notes = figureQualityNotes(ctx).join(' ');
    expect(notes).toContain(`${USED} Good.`);
    expect(notes).toContain('not confirmed by the available sources');
    expect(notes).not.toMatch(/stays uncertain|rather than guessing/);
  });

  it('Adam: contextual Good and engine Good — a plain confirmed match, no extra note', () => {
    const ctx = figureQualityContext('adam', 'good');
    expect(figureQualityText(ctx)).toBe('Figure quality: Good');
    expect(figureQualityNotes(ctx)).toEqual([]);
  });

  it('text-parsed unresolved: the contextual layer decided, so the method really is uncertain', () => {
    const notes = figureQualityNotes(contextualOnlyQuality('unresolved'));
    expect(notes).toEqual([KANZUL_QUALITY_UNRESOLVED_NOTE]);
    expect(notes.join(' ')).not.toContain('existing figure table');
    expect(figureQualityNotes(contextualOnlyQuality('middle-good'))).toEqual([]);
  });
});

// --- text-parsed pipeline ---------------------------------------------------
const P: Pattern[] = [];
for (let n = 0; n < 16; n++) P.push([n & 8 ? 2 : 1, n & 4 ? 2 : 1, n & 2 ? 2 : 1, n & 1 ? 2 : 1] as Pattern);

/** First chart whose method result (read via `pick`) is each wanted figure. */
function chartsByResult(pick: (chart: Chart) => string | null, wanted: string[]): Record<string, Chart> {
  const found: Record<string, Chart> = {};
  for (const a of P) for (const b of P) for (const c of P) for (const d of P) {
    const chart = buildChart([a, b, c, d]);
    const id = pick(chart);
    if (id && wanted.includes(id) && !found[id]) found[id] = chart;
    if (Object.keys(found).length === wanted.length) return found;
  }
  return found;
}

describe('Kanzul text-parsed methods use the contextual layer', () => {
  const BUSINESS = 'business-profit-and-loss'; // Method 1: good → profit, bad → no profit (no middle branch)
  const resultOf = (chart: Chart) => getMethodVerdicts(BUSINESS, chart)![0]!.result.starId;
  const charts = chartsByResult(resultOf, ['adam', 'umar', 'yussif', 'ibrahim', 'yunus', 'sulemana']);

  it('found a chart for every figure under test', () => expect(Object.keys(charts).sort()).toEqual(['adam', 'ibrahim', 'sulemana', 'umar', 'yunus', 'yussif']));

  it('good → the method’s good outcome; bad → its bad outcome', () => {
    const good = getMethodVerdicts(BUSINESS, charts.adam)![0]!;
    expect(good).toMatchObject({ ambiguous: false, figureQuality: 'good', interpretationBasis: 'star_quality' });
    expect(good.interpretation).toMatch(/lot of profit/);
    const bad = getMethodVerdicts(BUSINESS, charts.umar)![0]!;
    expect(bad).toMatchObject({ ambiguous: false, figureQuality: 'bad' });
    expect(bad.interpretation).toMatch(/won't get any profit/);
  });

  it('middle-good (incl. Yussif) is not silently treated as good or bad', () => {
    for (const id of ['yussif', 'ibrahim']) {
      const v = getMethodVerdicts(BUSINESS, charts[id])![0]!;
      expect(v.figureQuality, id).toBe('middle-good');
      expect(v.ambiguous, id).toBe(true);
      expect(v.interpretation).not.toMatch(/lot of profit|won't get any profit/);
    }
  });

  it('Yunus is middle-good (no good/bad outcome); Sulemana is bad (the bad outcome)', () => {
    const yunus = getMethodVerdicts(BUSINESS, charts.yunus)![0]!;
    expect(yunus).toMatchObject({ figureQuality: 'middle-good', ambiguous: true });
    expect(yunus.interpretation).not.toMatch(/lot of profit|won't get any profit/);
    const sulemana = getMethodVerdicts(BUSINESS, charts.sulemana)![0]!;
    expect(sulemana).toMatchObject({ figureQuality: 'bad', ambiguous: false });
    expect(sulemana.interpretation).toMatch(/won't get any profit/);
  });

  it('fortuneFoundInChart keeps its source_specific basis but carries the figure quality', () => {
    // business Method 2: "good star and found in the chart → more profit; good but not found → no profit; bad → don't travel".
    const m2 = (chart: Chart) => getMethodVerdicts(BUSINESS, chart)![1]!;
    const found = chartsByResult((c) => m2(c).result.starId, ['yunus', 'sulemana', 'yussif', 'adam', 'umar']);
    expect(Object.keys(found).sort()).toEqual(['adam', 'sulemana', 'umar', 'yunus', 'yussif']);
    expect(m2(found.yunus)).toMatchObject({ interpretationBasis: 'source_specific', figureQuality: 'middle-good', ambiguous: true });
    expect(m2(found.sulemana)).toMatchObject({ interpretationBasis: 'source_specific', figureQuality: 'bad', ambiguous: true });
    expect(m2(found.yussif)).toMatchObject({ interpretationBasis: 'source_specific', figureQuality: 'middle-good', ambiguous: true });
    expect(m2(found.adam)).toMatchObject({ interpretationBasis: 'source_specific', figureQuality: 'good' });
    // The parsed rule only defines the two good branches; a bad figure stays ambiguous exactly as before.
    expect(m2(found.umar)).toMatchObject({ interpretationBasis: 'source_specific', figureQuality: 'bad', ambiguous: true });
  });

  it('the fallback wording keeps "classically <name>"', () => {
    const v = getMethodVerdicts(BUSINESS, charts.yussif)![0]!;
    expect(v.interpretation).toContain('Yussif (classically Puer)');
  });

  it('the hand-authored stay chapter Method 2 follows the same rules', () => {
    const stay2 = (chart: Chart) => getMethodVerdicts('if-she-s-going-to-stay-in-the', chart)![1]!;
    const found = chartsByResult((c) => stay2(c).result.starId, ['yunus', 'sulemana', 'yussif', 'adam']);
    if (found.yunus) expect(stay2(found.yunus)).toMatchObject({ ambiguous: true, figureQuality: 'middle-good' });
    if (found.sulemana) expect(stay2(found.sulemana)).toMatchObject({ figureQuality: 'bad' });
    if (found.yussif) expect(stay2(found.yussif)).toMatchObject({ ambiguous: true, figureQuality: 'middle-good' });
    expect(Object.keys(found).length).toBeGreaterThan(0);
  });

  it('only star-quality methods carry a figure quality; named-star, element and source-specific methods do not', () => {
    const chart = fixtureChart();
    const seen = { star_quality: 0, element: 0, source_specific: 0 };
    for (const { id } of KM_CHAPTERS) {
      const parsed = getParsedMethods(id);
      getMethodVerdicts(id, chart)?.forEach((v, i) => {
        if (!v) return;
        const pm = parsed[i];
        if (pm) expect(v.interpretationBasis).toBe(basisForAxis(pm.axis));
        const readsQuality = v.interpretationBasis === 'star_quality' || pm?.axis.kind === 'fortuneFoundInChart';
        if (readsQuality) expect(v.figureQuality).not.toBeNull();
        else expect(v.figureQuality, `${id} ${v.label}`).toBeNull();
        seen[v.interpretationBasis]++;
      });
    }
    expect(seen.star_quality).toBeGreaterThan(0);
    expect(seen.element).toBeGreaterThan(0);
    expect(seen.source_specific).toBeGreaterThan(0);
  });

  it('named-star methods still resolve purely by their named star, whatever its quality', () => {
    // fight chapter: a bad figure (Ayuba) listed as winning at h6 still means "you will win".
    const named = KM_CHAPTERS.flatMap(({ id }) => getParsedMethods(id).filter((pm) => pm?.axis.kind === 'namedStar'));
    expect(named.length).toBeGreaterThan(0);
    for (const pm of named) expect(pm!.outcomes.every((o) => o.match.length > 0)).toBe(true);
    for (const { id } of KM_CHAPTERS) {
      getMethodVerdicts(id, fixtureChart())?.forEach((v, i) => {
        const pm = getParsedMethods(id)[i];
        if (v && pm?.axis.kind === 'namedStar') expect(v).toMatchObject({ interpretationBasis: 'source_specific', figureQuality: null });
      });
    }
  });
});

// --- engine pipeline: outcomes untouched, context only ------------------------
describe('engine rows: contextual quality is explanatory only', () => {
  it('only star-quality rows get a context; every other basis gets none', () => {
    const reading = runReading(fixtureChart(), 'business-profit-and-loss')!;
    for (const row of reading.methodResults) {
      if (interpretationBasisForMethod(row.id) === 'star_quality') expect(row.figureQuality, row.id).not.toBeNull();
      else expect(row.figureQuality, row.id).toBeNull();
    }
  });

  it('element and source-specific rows never carry a quality', () => {
    for (const q of ['if-you-want-to-know-if-you-will-2', 'travel-change']) {
      const reading = runReading(fixtureChart(), q);
      reading?.methodResults.forEach((row) => {
        if (interpretationBasisForMethod(row.id) !== 'star_quality') expect(row.figureQuality).toBeNull();
      });
    }
  });
});
