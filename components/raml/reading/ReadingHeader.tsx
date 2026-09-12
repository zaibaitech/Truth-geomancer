import { Card } from '@/components/ui/Card';

/** Always the first thing on a results screen (section 12, priority 1):
 * names the question and, when known, its category — nothing about houses
 * or methods yet. Reused by every question, current and future. */
export function ReadingHeader({ question, questionCategory }: { question: string; questionCategory: string | null }) {
  return (
    <Card>
      <p className="text-[11px] uppercase tracking-widest text-sand/40">Your reading is ready</p>
      {questionCategory ? <p className="mt-1 text-[11px] text-sand/40">{questionCategory}</p> : null}
      <p className="mt-1 text-base font-semibold text-sand-light">{question}</p>
    </Card>
  );
}
