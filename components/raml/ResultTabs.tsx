'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StarCard } from './StarCard';
import { ChartGrid } from './ChartGrid';
import { ReadingTab } from './ReadingTab';
import { EngineReadingView } from './EngineReadingView';
import type { Chart } from '@/lib/raml/casting';
import { houseInfo } from '@/lib/raml/houses';
import { getIntentionById } from '@/content/intentions';
import { getQuestionAvailability, resolveEngineQuestionId } from '@/lib/raml/questionAvailability';
import { runReading } from '@/lib/raml/engine';
import {
  findBuruji,
  spiritualStrength,
  findCauses,
  generalSadaqah,
  elementLabel,
} from '@/lib/raml/interpret';

const BASE_TABS = ['Overview', 'Full Chart', 'My Star', 'Sadaqah'] as const;
type Tab = (typeof BASE_TABS)[number] | 'Your Reading';

export function ResultTabs({ chart, intentionId, userQuestion }: { chart: Chart; intentionId?: string; userQuestion?: string }) {
  const hasReading = !!intentionId && (getIntentionById(intentionId)?.chapterIds.length ?? 0) > 0;
  const tabs: Tab[] = hasReading ? ['Your Reading', ...BASE_TABS] : [...BASE_TABS];
  const [tab, setTab] = useState<Tab>(hasReading ? 'Your Reading' : 'Overview');

  const judge = chart.houses[14];
  const self = chart.houses[0];
  const wealth = chart.houses[1];
  const illness = chart.houses[5];

  const buruji = findBuruji(chart);
  const strength = spiritualStrength(chart);
  const causes = findCauses(chart);
  const sadaqah = generalSadaqah(chart);

  return (
    <div>
      <div className="scrollbar-none flex gap-1.5 overflow-x-auto px-4 pb-3">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={`flex min-h-[40px] shrink-0 items-center rounded-full px-4 py-1.5 type-meta font-medium ${
              tab === t ? 'bg-clay text-ink' : 'border border-sand/15 text-sand/60'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-4 px-4">
        {tab === 'Your Reading' && intentionId ? (
          (() => {
            // A few picker entries are the SAME question the engine already
            // answers under another id (a chapter and a fragment repeating one
            // rule). Run the engine's own question for those rather than
            // dropping to the fallback parser. See lib/raml/questionAvailability.ts.
            const availability = getQuestionAvailability(intentionId);
            const reading = runReading(chart, resolveEngineQuestionId(intentionId));
            return reading ? (
              <>
                {availability.kind === 'consolidated' ? (
                  <p className="rounded-xl border border-sand/10 bg-ink-card px-3 py-2.5 type-evidence text-sand/55">
                    {availability.note}
                  </p>
                ) : null}
                <EngineReadingView result={reading} userQuestion={userQuestion} />
              </>
            ) : (
              <ReadingTab chart={chart} intentionId={intentionId} />
            );
          })()
        ) : null}

        {tab === 'Overview' ? (
          <>
            <StarCard star={judge.star} eyebrow="The Judge — the chart’s verdict">
              <p className="text-sm leading-relaxed text-sand/70">{judge.star.house6.meaning}</p>
            </StarCard>
            <StarCard star={self.star} eyebrow="House 1 — Self / the Querent" />
            <StarCard star={wealth.star} eyebrow="House 2 — Wealth">
              <p className="text-sm leading-relaxed text-sand/70">{wealth.star.house2.meaning}</p>
            </StarCard>
            <StarCard star={illness.star} eyebrow="House 6 — Illness & Enemies">
              <p className="text-sm leading-relaxed text-sand/70">{illness.star.house6.meaning}</p>
            </StarCard>
          </>
        ) : null}

        {tab === 'Full Chart' ? (
          <>
            <p className="text-xs text-sand/50">
              Houses 1-4 are the Mothers, 5-8 the Daughters, 9-12 the Nieces, 13-14 the Witnesses,
              15 the Judge, 16 the Reconciler.
            </p>
            <ChartGrid chart={chart} />
          </>
        ) : null}

        {tab === 'My Star' ? (
          <>
            <Card>
              <p className="mb-3 text-sm font-semibold text-sand-light">Knowing your Buruji (life star)</p>
              <div className="space-y-3">
                {buruji.map((b) => (
                  <div key={b.method} className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-sand-light">{b.star.name}</p>
                      <p className="text-[11px] text-sand/45">{b.method}</p>
                    </div>
                    <Badge tone={b.star.element}>{elementLabel(b.star.element)}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <p className="mb-2 text-sm font-semibold text-sand-light">Spiritual strength</p>
              <p className="text-sm leading-relaxed text-sand/70">{strength.verdict}</p>
              <div className="mt-3 flex gap-2">
                {(Object.keys(strength.tally) as (keyof typeof strength.tally)[]).map((el) => (
                  <Badge key={el} tone={el === strength.dominant ? el : 'neutral'}>
                    {elementLabel(el)} · {strength.tally[el]}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card>
              <p className="mb-2 text-sm font-semibold text-sand-light">Root cause, if something feels stuck</p>
              <p className="text-sm leading-relaxed text-sand/70">{causes.reading}</p>
              <p className="mt-2 text-[11px] text-sand/40">
                From {causes.houses.map((n) => `H${n}`).join(' + ')} → {causes.star.name}
              </p>
            </Card>
          </>
        ) : null}

        {tab === 'Sadaqah' ? (
          <Card>
            <p className="mb-1 text-sm font-semibold text-sand-light">{sadaqah.star.name}</p>
            <p className="mb-3 text-[11px] text-sand/40">
              From {sadaqah.houses.map((n) => `${houseInfo(n).title} (H${n})`).join(' + ')}
            </p>
            <p className="text-sm leading-relaxed text-sand/70">
              <span className="text-sand-light">Offering:</span> {sadaqah.star.sadaqah.offering}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-sand/70">
              <span className="text-sand-light">When:</span> {sadaqah.star.sadaqah.day}
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
