'use client';

import { Card } from '@/components/ui/Card';
import { HouseSelector } from './HouseSelector';
import type { Chart } from '@/lib/raml/casting';
import type { ReadingMethodRow } from '@/lib/raml/engine/reading';
import { isWholeChartRow, recastChartFor } from '@/lib/raml/methodPractice';

const NONE = new Set<number>();
const noop = () => {};

/**
 * Phase 1 corrective QA (E, H): on every outcome screen, the chart the
 * method was actually applied to — so a result (including "does not trigger")
 * can always be checked against what was cast.
 *
 * - The user's 16-house chart, read-only, with the method's own
 *   `row.housesUsed` outlined (or a whole-chart note when it has none).
 * - For a recast method (Chapter 34), the second chart the engine read,
 *   rebuilt for display by recastChartFor() with the same buildChart(), its
 *   inspected house(s) outlined and no original-chart role titles.
 * - The engine's own calculation lines (sums, counts), verbatim.
 *
 * Display only: nothing here evaluates a rule or changes the chart.
 */
export function PracticeChartPanel({ chart, row }: { chart: Chart; row: ReadingMethodRow }) {
  const wholeChart = isWholeChartRow(row);
  const recast = recastChartFor(chart, row);
  const motherHouses = row.casting.recastMotherHouses ?? [];
  const thenHouses = row.casting.recastThenHouses ?? [];

  return (
    <Card>
      <p className="type-meta uppercase tracking-widest text-sand/65">Your chart</p>
      <p className="mt-1 type-meta text-sand/65">
        {wholeChart
          ? 'This method reads the whole chart.'
          : `Houses used by this method: ${Array.from(new Set(row.housesUsed)).map((h) => `H${h}`).join(' · ')}`}
      </p>
      <div className="mt-2.5">
        <HouseSelector chart={chart} required={wholeChart ? [] : row.housesUsed} selected={NONE} onToggle={noop} readOnly />
      </div>

      {recast ? (
        <div className="mt-4 border-t border-sand/10 pt-3">
          <p className="type-meta uppercase tracking-widest text-sand/65">The second chart</p>
          <p className="mt-1 type-meta text-sand/65">
            Built from {motherHouses.map((h) => `H${h}`).join(', ')} of your chart as new Mothers — not a second casting by
            you.{thenHouses.length > 0 ? ` Read at ${thenHouses.map((h) => `H${h}`).join(', ')} of this second chart.` : ''}
          </p>
          <div className="mt-2.5">
            <HouseSelector chart={recast} required={thenHouses} selected={NONE} onToggle={noop} readOnly hideTitles />
          </div>
        </div>
      ) : null}

      {row.calculationSteps.length > 0 ? (
        <div className="mt-4 border-t border-sand/10 pt-3">
          <p className="type-meta uppercase tracking-widest text-sand/65">How it was worked</p>
          <ol className="mt-1.5 space-y-1">
            {row.calculationSteps.map((step, i) => (
              <li key={i} className="type-evidence text-sand-light break-words">
                {step}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </Card>
  );
}
