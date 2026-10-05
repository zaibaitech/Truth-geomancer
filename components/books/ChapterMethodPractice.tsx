import Link from 'next/link';
import { Play } from 'lucide-react';
import { StarProseParagraph } from './StarProseParagraph';
import { KANZUL_BODY_PART_TABLE_ENTRY_ID, KANZUL_ENTRIES_CONTINUED_IN_NEXT_ENTRY, KANZUL_PLAIN_STAR_NAMES, parseBodyPartTable } from '@/lib/raml/kanzulStarText';
import { BodyPartTable } from './BodyPartTable';
import { practiceEntryPointsForChapter, practiceHref, type PracticableMethod } from '@/lib/raml/methodPractice';

/**
 * A Kanzul Mikban chapter's paragraphs, with a "Try this method" CTA placed
 * immediately after any paragraph that is a practicable method's own source
 * text (Prompt 20, sections 1-2). The paragraphs are rendered with the same
 * markup as the plain `Prose` paragraph, and every canonical star name in them
 * is shown with that star's own figure (StarProseParagraph) — nothing about the
 * source text is replaced, rewritten or reordered. A chapter with no
 * practicable methods (nothing verified, or no engine question at all) renders
 * the same paragraphs without the "Try this method" link.
 *
 * Phase 1: every practicable method that does NOT get an inline button (its
 * label isn't printed as a literal paragraph prefix in the source) is listed
 * after the chapter text by ChapterPracticeLinks, so no verified method is
 * reachable only by URL. Both lists come from practiceEntryPointsForChapter;
 * a method is never in both.
 */
export function ChapterMethodPractice({ chapterId, paragraphs }: { chapterId: string; paragraphs: string[] }) {
  // Chapter 106 is a table, shown as one (see BodyPartTable) rather than as a run of text.
  if (chapterId === KANZUL_BODY_PART_TABLE_ENTRY_ID) {
    const text = paragraphs.join(' ');
    if (parseBodyPartTable(text)) {
      return (
        <>
          <BodyPartTable text={text} />
          <ChapterPracticeLinks chapterId={chapterId} />
        </>
      );
    }
  }
  const { inline: byParagraph, fallback } = practiceEntryPointsForChapter(chapterId, paragraphs);

  return (
    <div>
      {paragraphs.map((p, i) => {
        const practicable = byParagraph.get(i);
        return (
          <div key={i}>
            <StarProseParagraph
              text={p}
              plainNames={KANZUL_PLAIN_STAR_NAMES[chapterId]}
              noticeWhenIncomplete={!KANZUL_ENTRIES_CONTINUED_IN_NEXT_ENTRY.has(chapterId)}
            />
            {practicable ? (
              <Link
                href={`/raml/practice/${chapterId}/${practicable.method.id}`}
                className="mb-5 -mt-2 flex min-h-[44px] w-fit items-center gap-1.5 rounded-full border border-clay/30 px-3.5 py-1.5 type-evidence font-medium text-clay-light"
              >
                <Play size={13} aria-hidden /> Try this method
              </Link>
            ) : null}
          </div>
        );
      })}
      <PracticeLinkList methods={fallback} />
    </div>
  );
}

/**
 * Phase 1 fallback entry points for a chapter whose body is NOT rendered by
 * ChapterMethodPractice (the figure-specific bodies: Chapter 151's dream
 * interpretations, the gift/visitor figures) — no paragraphs are passed, so
 * every practicable method of that chapter is listed here. Renders nothing
 * for a chapter without practicable methods.
 */
export function ChapterPracticeLinks({ chapterId }: { chapterId: string }) {
  return <PracticeLinkList methods={practiceEntryPointsForChapter(chapterId).fallback} />;
}

function PracticeLinkList({ methods }: { methods: PracticableMethod[] }) {
  if (methods.length === 0) return null;
  return (
    <div className="mb-5 rounded-xl border border-sand/10 px-3 py-3">
      <p className="type-label uppercase tracking-widest text-sand/65">
        {methods.length === 1 ? 'Practise with your chart' : 'Practise these methods with your chart'}
      </p>
      <ul className="mt-2 space-y-2">
        {methods.map((m) => (
          <li key={m.method.id}>
            <Link
              href={practiceHref(m)}
              className="flex min-h-[44px] w-full items-center gap-2 rounded-full border border-clay/30 px-3.5 py-1.5 type-evidence font-medium text-clay-light"
            >
              <Play size={13} aria-hidden className="shrink-0" />
              <span className="min-w-0 break-words">
                Practise this method
                {methods.length > 1 ? <span className="text-sand/70"> · {m.method.label}</span> : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
