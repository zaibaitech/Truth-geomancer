import { Card } from '@/components/ui/Card';
import {
  computePrimaryStatus,
  primaryAnswerText,
  primaryDisplayedInterpretation,
  shouldShowShortSummary,
} from '@/lib/raml/resultPresentation';
import type { ReadingResult } from '@/lib/raml/engine/reading';

/** The primary reading card (section 12, priority 1-3 — what was asked,
 * what the reading says, whether verified methods agree). This is the ONE
 * place a reader sees the answer: no house combinations, figure names, or
 * per-method jargon here — those live behind "How this was determined"
 * (EngineReadingView). The headline and status line are both built from
 * data reading.ts already computed (see resultPresentation.ts); this
 * component only lays that out. For a descriptive reading the engine
 * already stored the source interpretation on the counted method row —
 * that existing text is shown here too, so the reader is not left with
 * only the figure identifier. The insufficient-data state has its own
 * dedicated copy in InsufficientNotice instead of reaching this card. */
export function OutcomeCard({ result }: { result: ReadingResult }) {
  const status = computePrimaryStatus(result);
  const answer = primaryAnswerText(result, status);
  const interpretation = primaryDisplayedInterpretation(result, status);
  const showSummary = shouldShowShortSummary(result, interpretation, status);
  const counted = result.methodResults.filter((m) => m.counted);

  return (
    <Card>
      <p className="type-meta uppercase tracking-widest text-sand/65">Reading</p>
      <p className="mt-1.5 type-method font-semibold text-sand-light break-words">{answer}</p>
      <p className="mt-2 type-body font-medium text-sand-light">{status.statusText}</p>
      {interpretation ? <p className="mt-1.5 type-body text-sand/75 break-words">{interpretation}</p> : null}
      {showSummary ? <p className="mt-1.5 type-body text-sand/75 break-words">{result.shortSummary}</p> : null}

      {/* Never a winner picked between methods — every counted method's own
          answer, named plainly, whenever there isn't one answer they all
          share. The full evidence for each stays in "How this was
          determined"; this is only the compact map from method to answer. */}
      {status.showBreakdown ? (
        <div className="mt-3 space-y-1 border-t border-sand/10 pt-3">
          {counted.map((m) => (
            <p key={m.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 type-body">
              <span className="text-sand-light">{m.label}</span>
              <span className="text-sand/65">→</span>
              <span className="text-sand-light">{m.outcomeLabel}</span>
            </p>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
