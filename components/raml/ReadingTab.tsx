import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { MethodVerdictCard } from './MethodVerdictCard';
import type { Chart } from '@/lib/raml/casting';
import { getIntentionById, getCategoryById } from '@/content/intentions';
// PROMPT 27 (protected-content migration): this component used to render
// every paragraph of the matched chapter(s) verbatim as a fallback when no
// verdict was computed — a full, uncontrolled chapter-text dump reachable
// from any free cast. That fallback is removed below (see the render
// logic): only a COMPUTED verdict (from getMethodVerdicts, itself already
// an accepted smaller exposure — see lib/access/README.md) is ever shown
// here now, never the chapter's raw prose. The import below still needs
// `.number`/`.title`, which the public metadata export carries.
import { KM_CHAPTER_META as KM_CHAPTERS } from '@/content/manuscripts/kanzulMikbanMeta';
import { getMethodVerdicts } from '@/lib/raml/methodVerdicts';
import { getQuestionAvailability } from '@/lib/raml/questionAvailability';
import { NO_AUTOMATIC_READING_EXPLANATION, NO_AUTOMATIC_READING_HEADING } from '@/lib/raml/statusLanguage';

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
        <p className="type-label uppercase tracking-widest text-sand/65">
          {category ? category.label : 'Your question'}
        </p>
        <p className="mt-1 type-body font-semibold text-sand-light">{intention.label}</p>
        {unreadable ? (
          <>
            <p className="mt-3 type-body font-semibold text-clay-light">{NO_AUTOMATIC_READING_HEADING}</p>
            <p className="mt-1 type-meta text-sand/70">{unreadable.note}</p>
            <p className="mt-2 type-label text-sand/65">
              {NO_AUTOMATIC_READING_EXPLANATION} This is a limit of the surviving manuscript, not an
              error — your chart itself is complete and can be read against any other question.
            </p>
          </>
        ) : (
          <p className="mt-3 type-label text-sand/65">
            From Kanzul Mikban. The houses each method calls for have already been read off your
            own chart below — open the full chapter if you want to check the method’s own wording.
          </p>
        )}
      </Card>

      {chapters.map((ch) => {
        const verdicts = getMethodVerdicts(ch.id, chart);
        const computed = (verdicts ?? []).filter((v): v is NonNullable<typeof v> => v !== null);
        const hasAnyVerdict = computed.length > 0;

        return (
          <Card key={ch.id}>
            <p className="mb-1 type-body font-semibold text-sand-light">
              {ch.number !== null ? `Chapter ${ch.number} — ` : ''}
              {ch.title}
            </p>

            {hasAnyVerdict ? (
              <>
                <p className="mb-3 type-meta font-medium uppercase tracking-widest text-sand/65">
                  Your reading result
                </p>
                <div className="space-y-3">
                  {computed.map((verdict, i) => (
                    <MethodVerdictCard key={i} verdict={verdict} />
                  ))}
                </div>
              </>
            ) : (
              // PROMPT 27: this chapter's own raw paragraph text is
              // deliberately never shown here — only a COMPUTED result is.
              // No result was computable for this cast, so nothing from
              // the chapter's protected text is rendered at all; the link
              // below is the only way to read the method's own wording.
              <p className="type-body text-sand/65">
                This chapter’s method couldn’t be automatically computed for this chart — open the
                full chapter to read its wording and apply it yourself.
              </p>
            )}

            {hasAnyVerdict ? (
              <p className="mt-3 type-label text-sand/65">
                Good/bad and upward/downward here are read from classical geomancy attributions
                for each figure — not from this manuscript, which doesn’t tabulate them itself.
                Where a figure or check doesn’t land cleanly, or the book’s own wording doesn’t
                cover this exact result, that’s said plainly rather than forced to a guess.
              </p>
            ) : null}

            <Link href={`/books/kanzul-mikban/read#${ch.id}`} className="mt-3 inline-block type-meta text-clay-light">
              Open full chapter in the book →
            </Link>
          </Card>
        );
      })}
    </div>
  );
}
