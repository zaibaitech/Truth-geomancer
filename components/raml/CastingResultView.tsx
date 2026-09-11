import type { ReactNode } from 'react';
import { ResultTabs } from './ResultTabs';
import type { Chart } from '@/lib/raml/casting';

export function CastingResultView({
  chart,
  question,
  meta,
  footer,
}: {
  chart: Chart;
  question?: string;
  meta?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div>
      {question || meta ? (
        <div className="mx-4 mb-4 rounded-xl border border-sand/10 bg-ink-card px-3 py-2">
          {question ? (
            <>
              <p className="text-[11px] uppercase tracking-widest text-sand/40">Your question</p>
              <p className="text-sm text-sand-light">{question}</p>
            </>
          ) : null}
          {meta}
        </div>
      ) : null}
      <ResultTabs chart={chart} />
      {footer}
    </div>
  );
}
