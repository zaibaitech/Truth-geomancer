import Link from 'next/link';
import { Play } from 'lucide-react';
import { ProseParagraph } from './Prose';
import { practicableMethodsForChapter } from '@/lib/raml/methodPractice';

/**
 * A Kanzul Mikban chapter's paragraphs, with a "Try this method" CTA placed
 * immediately after any paragraph that is a practicable method's own source
 * text (Prompt 20, sections 1-2). The paragraphs themselves are rendered by
 * the exact same `ProseParagraph` the plain `Prose` component uses — nothing
 * about the source text is replaced, rewritten or reordered. A chapter with
 * no practicable methods (nothing verified, or no engine question at all)
 * renders byte-identically to the old `<Prose paragraphs={...} />` call this
 * replaced, just routed through the same per-paragraph piece.
 */
export function ChapterMethodPractice({ chapterId, paragraphs }: { chapterId: string; paragraphs: string[] }) {
  const methods = practicableMethodsForChapter(chapterId);
  const byParagraph = new Map(methods.filter((m) => m.paragraphIndex !== null).map((m) => [m.paragraphIndex, m]));

  return (
    <div>
      {paragraphs.map((p, i) => {
        const practicable = byParagraph.get(i);
        return (
          <div key={i}>
            <ProseParagraph text={p} />
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
