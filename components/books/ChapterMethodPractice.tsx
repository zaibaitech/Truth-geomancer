import Link from 'next/link';
import { Play } from 'lucide-react';
import { StarProseParagraph } from './StarProseParagraph';
import { KANZUL_BODY_PART_TABLE_ENTRY_ID, KANZUL_ENTRIES_CONTINUED_IN_NEXT_ENTRY, KANZUL_PLAIN_STAR_NAMES, parseBodyPartTable } from '@/lib/raml/kanzulStarText';
import { BodyPartTable } from './BodyPartTable';
import { practicableMethodsForChapter } from '@/lib/raml/methodPractice';

/**
 * A Kanzul Mikban chapter's paragraphs, with a "Try this method" CTA placed
 * immediately after any paragraph that is a practicable method's own source
 * text (Prompt 20, sections 1-2). The paragraphs are rendered with the same
 * markup as the plain `Prose` paragraph, and every canonical star name in them
 * is shown with that star's own figure (StarProseParagraph) — nothing about the
 * source text is replaced, rewritten or reordered. A chapter with no
 * practicable methods (nothing verified, or no engine question at all) renders
 * the same paragraphs without the "Try this method" link.
 */
export function ChapterMethodPractice({ chapterId, paragraphs }: { chapterId: string; paragraphs: string[] }) {
  // Chapter 106 is a table, shown as one (see BodyPartTable) rather than as a run of text.
  if (chapterId === KANZUL_BODY_PART_TABLE_ENTRY_ID) {
    const text = paragraphs.join(' ');
    if (parseBodyPartTable(text)) return <BodyPartTable text={text} />;
  }
  const methods = practicableMethodsForChapter(chapterId, paragraphs);
  const byParagraph = new Map(methods.filter((m) => m.paragraphIndex !== null).map((m) => [m.paragraphIndex, m]));

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
    </div>
  );
}
