import type { ReactNode } from 'react';
import { ResultTabs } from './ResultTabs';
import { catalogEntry } from '@/lib/raml/questionCatalog';
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
  // The plain-language question leads here too, the way it does everywhere
  // else since Prompt 15 — the manuscript's own heading is supporting text.
  const entry = intentionId ? catalogEntry(intentionId) : undefined;
  const fallbackLabel = entry?.title;

  return (
    <div>
      {question || fallbackLabel || meta ? (
        <div className="mx-4 mb-4 rounded-xl border border-sand/10 bg-ink-card px-3 py-2">
          {question ? (
            <>
              <p className="type-meta uppercase tracking-widest text-sand/40">Your question</p>
              <p className="type-body text-sand-light">{question}</p>
            </>
          ) : fallbackLabel ? (
            <>
              <p className="type-meta uppercase tracking-widest text-sand/40">Reading for</p>
              <p className="type-body text-sand-light">{fallbackLabel}</p>
            </>
          ) : null}
          {meta}
        </div>
      ) : null}
      <ResultTabs chart={chart} intentionId={intentionId} userQuestion={question} />
      {footer}
    </div>
  );
}
