import { Card } from '@/components/ui/Card';

/** Always the first thing on a results screen (section 12, priority 1):
 * names the question and, when known, its category — nothing about houses
 * or methods yet. Reused by every question, current and future. */
export function ReadingHeader({ question, questionCategory }: { question: string; questionCategory: string | null }) {
  return (
    <Card>
      {/* role="status" so a screen reader announces that the reading finished
          — the result replaces the casting board without a page navigation,
          which is otherwise silent. The question itself is an h2: it is the
          heading the whole result screen sits under. */}
      <p role="status" className="type-meta uppercase tracking-widest text-sand/65">
        Your reading is ready
      </p>
      {questionCategory ? <p className="mt-1 type-meta text-sand/65">{questionCategory}</p> : null}
      <h2 className="mt-1 type-method font-semibold text-sand-light">{question}</h2>
    </Card>
  );
}
