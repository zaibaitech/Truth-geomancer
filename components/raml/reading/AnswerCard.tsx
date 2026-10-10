import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { OUTCOME_TONE } from '@/lib/raml/engine/reading';
import { attributionLine, type AnswerView } from '@/lib/raml/readingExplanation';

/** The direct answer (free-cast Phase A): each counted method's own
 * conclusion, verbatim and attributed to its book, chapter and method, above
 * an accurate count/agreement line. When methods differ every method's
 * sentence is shown and none is preferred. Visible without expanding
 * anything. Replaces OutcomeCard only for outcome-style readings with counted
 * methods; every other reading keeps OutcomeCard. */
export function AnswerCard({ view }: { view: Exclude<AnswerView, { kind: 'legacy' }> }) {
  return (
    <Card>
      <p className="type-meta uppercase tracking-widest text-sand/65">The answer</p>
      <div className="mt-2 space-y-4">
        {view.groups.map((g) => (
          <div key={`${g.outcome}:${g.sentence}`}>
            <p className="type-meta text-sand/70">{attributionLine(g.methods)}</p>
            <p className="mt-1 type-method font-semibold text-sand-light break-words">{g.sentence}</p>
            <div className="mt-1.5">
              <Badge tone={OUTCOME_TONE[g.outcome]}>{g.outcomeLabel}</Badge>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 border-t border-sand/10 pt-3 type-body font-medium text-sand-light">{view.statusLine}</p>
      {view.detailLines.map((line) => (
        <p key={line} className="mt-1.5 type-body text-sand/75 break-words">
          {line}
        </p>
      ))}
      <p className="mt-2 type-evidence text-sand/65">{view.note}</p>
    </Card>
  );
}
