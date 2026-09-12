import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MethodVerdictCard } from './MethodVerdictCard';
import type { Chart } from '@/lib/raml/casting';
import { extractHouseRefs } from '@/lib/raml/houseRefs';
import { getIntentionById, getCategoryById } from '@/content/intentions';
import { KM_CHAPTERS } from '@/content/manuscripts/kanzul-mikban';
import { getMethodVerdicts } from '@/lib/raml/methodVerdicts';
import { getQuestionAvailability } from '@/lib/raml/questionAvailability';

export function ReadingTab({ chart, intentionId }: { chart: Chart; intentionId: string }) {
  const intention = getIntentionById(intentionId);
  if (!intention || intention.chapterIds.length === 0) return null;

  const category = intention.categoryId ? getCategoryById(intention.categoryId) : undefined;

  const chapters = intention.chapterIds
    .map((id) => KM_CHAPTERS.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c);

  // Some entries are real source material but not questions a chart can
  // answer (a reference table, a ritual, an open-ended technique, or a passage
  // whose identifying figures the transcription lost). Saying so plainly beats
  // implying a reading was attempted. See lib/raml/questionAvailability.ts.
  const availability = getQuestionAvailability(intentionId);
  const unreadable = availability.kind === 'no-automatic-reading' ? availability : null;

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-[11px] uppercase tracking-widest text-sand/40">
          {category ? category.label : 'Your question'}
        </p>
        <p className="mt-1 text-sm font-semibold text-sand-light">{intention.label}</p>
        {unreadable ? (
          <>
            <p className="mt-3 text-sm font-semibold text-clay-light">No automatic reading for this one</p>
            <p className="mt-1 text-[12px] leading-relaxed text-sand/55">{unreadable.note}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-sand/35">
              This is a limit of the surviving manuscript, not an error — your chart itself is
              complete and can be read against any other question.
            </p>
          </>
        ) : (
          <p className="mt-3 text-[11px] leading-relaxed text-sand/40">
            From Kanzul Mikban. The houses each method calls for have already been read off your
            own chart below — open the full chapter if you want to check the method’s own wording.
          </p>
        )}
      </Card>

      {chapters.map((ch) => {
        const verdicts = getMethodVerdicts(ch.id, chart);
        const hasAnyVerdict = !!verdicts && verdicts.some((v) => v !== null);

        return (
          <Card key={ch.id}>
            <p className="mb-1 text-sm font-semibold text-sand-light">
              {ch.number !== null ? `Chapter ${ch.number} — ` : ''}
              {ch.title}
            </p>

            {hasAnyVerdict ? (
              <p className="mb-3 text-xs font-medium uppercase tracking-widest text-sand/40">
                Your reading result
              </p>
            ) : null}

            <div className="space-y-3">
              {ch.paragraphs.map((p, i) => {
                const verdict = verdicts?.[i];
                if (verdict) {
                  return <MethodVerdictCard key={i} verdict={verdict} />;
                }
                const houses = extractHouseRefs(p);
                return (
                  <div key={i}>
                    {houses.length > 0 ? (
                      <div className="mb-1.5 flex flex-wrap gap-1">
                        {houses.map((n) => (
                          <Badge key={n} tone="sand">
                            H{n} {chart.houses[n - 1].star.name}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    <p className="text-sm leading-relaxed text-sand/70">{p}</p>
                  </div>
                );
              })}
            </div>

            {hasAnyVerdict ? (
              <p className="mt-3 text-[11px] leading-relaxed text-sand/35">
                Good/bad and upward/downward here are read from classical geomancy attributions
                for each figure — not from this manuscript, which doesn’t tabulate them itself.
                Where a figure or check doesn’t land cleanly, or the book’s own wording doesn’t
                cover this exact result, that’s said plainly rather than forced to a guess.
              </p>
            ) : null}

            <Link href={`/books/kanzul-mikban/read#${ch.id}`} className="mt-3 inline-block text-xs text-clay-light">
              Open full chapter in the book →
            </Link>
          </Card>
        );
      })}
    </div>
  );
}
