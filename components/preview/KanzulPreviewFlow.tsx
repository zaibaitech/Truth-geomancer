'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CastingBoard } from '@/components/raml/CastingBoard';
import { FigureGlyph } from '@/components/raml/FigureGlyph';
import { buildChart } from '@/lib/raml/casting';
import { OUTCOME_TONE, type ReadingMethodRow } from '@/lib/raml/engine/reading';
import type { Pattern } from '@/content/stars';

// Prompt 29 — the Kanzul Mikban free preview. Consumption happens in
// exactly ONE POST, made only after the user has already cast a chart and
// explicitly asked to see their result — never on page load, never on an
// intro-only fetch. This is a deliberately separate, small component from
// MethodPracticeFlow.tsx: it reuses the same safe building blocks
// (CastingBoard, FigureGlyph, OUTCOME_TONE) but calls the preview API
// instead of the entitlement-gated practice API, so the paid practice
// flow's own behavior/tests are untouched by this prompt.
interface PreviewApiResult {
  ok: true;
  entitled: false;
  kind: 'method';
  questionId: string;
  label: string;
  sourceQuote: string;
  sourceLabel: string;
  row: ReadingMethodRow | null;
}

type Stage = 'intro' | 'casting' | 'result';

export function KanzulPreviewFlow() {
  const [stage, setStage] = useState<Stage>('intro');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PreviewApiResult | null>(null);

  async function onCastComplete(mothers: [Pattern, Pattern, Pattern, Pattern]) {
    setSubmitting(true);
    setError(null);
    try {
      const chart = buildChart(mothers);
      const res = await fetch('/api/preview/kanzul-mikban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chart }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Something went wrong.' }));
        setError(body.error ?? 'Something went wrong.');
        setSubmitting(false);
        setStage('intro');
        return;
      }
      const data = (await res.json()) as PreviewApiResult;
      setResult(data);
      setStage('result');
    } catch {
      setError('Could not reach the server. Please try again.');
      setStage('intro');
    } finally {
      setSubmitting(false);
    }
  }

  const header = (
    <div className="px-4 pb-4 pt-5">
      <Badge tone="sand">Free Preview</Badge>
      <h1 className="mt-2 type-section font-semibold text-sand-light">Will I own a house in my life?</h1>
      <p className="mt-1 type-body text-sand/70">Kanzul Mikban · Chapter 146</p>
    </div>
  );

  if (stage === 'intro') {
    return (
      <div>
        {header}
        <div className="space-y-4 px-4 pb-6">
          <Card>
            <p className="type-meta uppercase tracking-widest text-sand/65">How this works</p>
            <ol className="mt-2 space-y-1.5 type-body text-sand/80">
              <li>1. Cast a chart</li>
              <li>2. See the traditional method applied to your chart</li>
              <li>3. See your real result — this is your one free preview</li>
            </ol>
          </Card>
          {error ? <p className="type-body text-red-400">{error}</p> : null}
          <p className="type-body text-sand/70">
            This is a real reading using the book’s own verified method — not a demo. You have one free preview
            for Kanzul Mikban.
          </p>
        </div>
        <div className="px-4 pb-6">
          <p className="mb-3 text-center type-label text-clay-light">
            {submitting ? 'Computing your free preview…' : 'Cast your chart'}
          </p>
          <CastingBoard onComplete={onCastComplete} />
        </div>
      </div>
    );
  }

  // stage === 'result'
  if (!result) return null;
  const row = result.row;

  return (
    <div>
      {header}
      <div className="space-y-4 px-4 pb-6">
        {!row || !row.counted || row.resultPattern === null ? (
          <Card>
            <p className="type-body font-semibold text-sand-light">This method couldn’t be computed for this chart.</p>
            <p className="mt-1.5 type-body text-sand/70">Nothing was assumed or filled in — no result is shown.</p>
          </Card>
        ) : (
          <Card>
            <p className="type-meta uppercase tracking-widest text-sand/65">Your result</p>
            <div className="mt-2 flex items-center gap-3">
              <FigureGlyph pattern={row.resultPattern} size="md" />
              <div>
                <p className="type-body font-medium text-sand-light">{row.resultFigureName}</p>
                <p className="type-meta text-sand/65">
                  {[row.resultFortune, row.resultDirection, row.resultElement].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            <div className="mt-4 border-t border-sand/10 pt-3">
              {row.outcomeLabel ? <Badge tone={row.outcome ? OUTCOME_TONE[row.outcome] : 'neutral'}>{row.outcomeLabel}</Badge> : null}
              <p className="mt-1.5 type-verdict text-sand-light">According to the source, this indicates: {row.interpretation}</p>
            </div>
          </Card>
        )}

        <Card>
          <p className="type-meta uppercase tracking-widest text-sand/65">Source</p>
          <p className="mt-1.5 type-quote italic leading-relaxed text-sand/80">“{result.sourceQuote}”</p>
          <p className="mt-1.5 type-meta text-sand/65">{result.sourceLabel} · {result.label}</p>
        </Card>

        <Card className="text-center">
          <p className="type-body font-semibold text-sand-light">Free preview used</p>
          <p className="mt-1.5 type-body text-sand/70">
            Kanzul Mikban has 153 question-specific reading methods. Purchase access to unlock the rest.
          </p>
          <Link
            href="/purchase/kanzul-mikban"
            className="mt-3 inline-block min-h-[44px] rounded-xl bg-clay px-4 py-2.5 type-body font-semibold text-ink"
          >
            Purchase access to continue
          </Link>
        </Card>
      </div>
    </div>
  );
}
