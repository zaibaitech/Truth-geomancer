'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { ReadingResult } from '@/lib/raml/engine/reading';
import { readingToText, summariseReading } from '@/lib/raml/readingSummary';

/** The take-away card (Prompt 15, sections 11-12): the four things worth
 * keeping — question, state, the engine's own one-line answer, and the
 * chapter it came from — small enough to screenshot on a phone, and
 * copyable as plain text. It restates the reading; it never re-judges it. */
export function ResultSummaryCard({ result, userQuestion }: { result: ReadingResult; userQuestion?: string }) {
  const summary = summariseReading(result);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(readingToText(result, userQuestion));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused (permissions, insecure context).
      // Saying nothing false is better than claiming a copy that didn't
      // happen, so the button simply stays in its normal state.
      setCopied(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] uppercase tracking-widest text-sand/40">Summary</p>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy this reading as text"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-sand/15 px-2.5 py-1 text-[11px] text-sand/65"
        >
          {copied ? <Check size={12} className="text-clay-light" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy reading'}
        </button>
      </div>

      <p className="mt-2 text-[13px] font-medium leading-snug text-sand-light">{summary.question}</p>
      <p className={`mt-1.5 text-sm font-semibold ${summary.conflict ? 'text-clay-light' : 'text-sand-light'}`}>
        {summary.status}
      </p>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-sand/65">{summary.interpretation}</p>
      {summary.source ? <p className="mt-2 text-[10.5px] uppercase tracking-widest text-sand/35">{summary.source}</p> : null}
      <p aria-live="polite" className="sr-only">
        {copied ? 'Reading copied to the clipboard' : ''}
      </p>
    </Card>
  );
}
