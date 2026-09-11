import type { ReactNode } from 'react';
import { ResultTabs } from './ResultTabs';
import { getIntentionById } from '@/content/intentions';
import type { Chart } from '@/lib/raml/casting';

export function CastingResultView({
  chart,
  question,
  intentionId,
  meta,
  footer,
}: {
  chart: Chart;
  question?: string;
  intentionId?: string;
  meta?: ReactNode;
  footer?: ReactNode;
}) {
  const intention = intentionId ? getIntentionById(intentionId) : undefined;
  const fallbackLabel = intention && intention.id !== 'general' ? intention.label : undefined;

  return (
    <div>
      {question || fallbackLabel || meta ? (
        <div className="mx-4 mb-4 rounded-xl border border-sand/10 bg-ink-card px-3 py-2">
          {question ? (
            <>
              <p className="text-[11px] uppercase tracking-widest text-sand/40">Your question</p>
              <p className="text-sm text-sand-light">{question}</p>
            </>
          ) : fallbackLabel ? (
            <>
              <p className="text-[11px] uppercase tracking-widest text-sand/40">Reading for</p>
              <p className="text-sm text-sand-light">{fallbackLabel}</p>
            </>
          ) : null}
          {meta}
        </div>
      ) : null}
      <ResultTabs chart={chart} intentionId={intentionId} />
      {footer}
    </div>
  );
}
