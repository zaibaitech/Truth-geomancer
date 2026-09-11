import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Prose } from '@/components/books/Prose';
import { FigureGlyph } from '@/components/raml/FigureGlyph';
import { getBookById } from '@/content/books';
import { CHAPTERS, INTRODUCTION } from '@/content/manuscripts/master-of-geomancy-vol1';
import { KM_CHAPTERS } from '@/content/manuscripts/kanzul-mikban';
import { STARS, ELEMENT_LABEL, ELEMENT_OCCUPATIONS, type Element } from '@/content/stars';

const ELEMENTS: Element[] = ['fire', 'air', 'water', 'sand'];

export function generateStaticParams() {
  return [
    ...CHAPTERS.map((ch) => ({ id: 'master-of-geomancy-vol-1', chapterId: ch.id })),
    ...KM_CHAPTERS.map((ch) => ({ id: 'kanzul-mikban', chapterId: ch.id })),
  ];
}

function ReaderShell({
  bookId,
  eyebrow,
  title,
  prevHref,
  prevLabel,
  nextHref,
  nextLabel,
  children,
}: {
  bookId: string;
  eyebrow: string;
  title: string;
  prevHref?: string;
  prevLabel?: string;
  nextHref?: string;
  nextLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-sand/10 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-sand/40">{eyebrow}</p>
          <h1 className="font-logo text-lg leading-snug text-sand-light">{title}</h1>
        </div>
        <Link
          href={`/books/${bookId}`}
          aria-label="Close"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sand/15 text-sand/60"
        >
          <X size={16} />
        </Link>
      </div>

      <div className="flex-1 px-4 py-5">{children}</div>

      <div className="sticky bottom-0 flex border-t border-sand/10 bg-ink">
        {prevHref ? (
          <Link href={prevHref} className="flex flex-1 items-center gap-1 px-4 py-3 text-sm text-sand/60">
            <ChevronLeft size={16} className="shrink-0" /> <span className="truncate">{prevLabel}</span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {nextHref ? (
          <Link
            href={nextHref}
            className="flex flex-1 items-center justify-end gap-1 px-4 py-3 text-right text-sm text-sand-light"
          >
            <span className="truncate">{nextLabel}</span> <ChevronRight size={16} className="shrink-0" />
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
}

export default function ChapterPage({ params }: { params: { id: string; chapterId: string } }) {
  const book = getBookById(params.id);
  if (!book) notFound();

  if (book.id === 'kanzul-mikban') {
    const index = KM_CHAPTERS.findIndex((c) => c.id === params.chapterId);
    const chapter = KM_CHAPTERS[index];
    if (!chapter) notFound();
    const prev = KM_CHAPTERS[index - 1];
    const next = KM_CHAPTERS[index + 1];

    return (
      <ReaderShell
        bookId={book.id}
        eyebrow={chapter.number !== null ? `Chapter ${chapter.number}` : 'Continued'}
        title={chapter.title}
        prevHref={prev ? `/books/${book.id}/read/${prev.id}` : undefined}
        prevLabel={prev?.title}
        nextHref={next ? `/books/${book.id}/read/${next.id}` : undefined}
        nextLabel={next?.title}
      >
        <Prose paragraphs={chapter.paragraphs} />
      </ReaderShell>
    );
  }

  const index = CHAPTERS.findIndex((c) => c.id === params.chapterId);
  const chapter = CHAPTERS[index];
  if (!chapter) notFound();

  const prev = CHAPTERS[index - 1];
  const next = CHAPTERS[index + 1];

  return (
    <ReaderShell
      bookId={book.id}
      eyebrow={`Chapter ${chapter.number}`}
      title={chapter.title}
      prevHref={prev ? `/books/${book.id}/read/${prev.id}` : undefined}
      prevLabel={prev?.title}
      nextHref={next ? `/books/${book.id}/read/${next.id}` : undefined}
      nextLabel={next?.title}
    >
      {chapter.id === 'drawing-a-chart' ? <Prose paragraphs={INTRODUCTION} /> : null}
      {chapter.body ? <Prose paragraphs={chapter.body} /> : null}

      {chapter.id === 'stars-and-symbols' ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {STARS.map((star) => (
            <Card key={star.id} id={star.id} className="flex scroll-mt-16 items-center gap-3">
              <FigureGlyph pattern={star.pattern} size="sm" />
              <div>
                <p className="text-sm font-medium text-sand-light">{star.name}</p>
                <p className="text-[11px] text-sand/45">{ELEMENT_LABEL[star.element]}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {chapter.id === 'stars-in-the-chart' ? (
        <div className="mt-4 space-y-4">
          {STARS.map((star) => (
            <Card key={star.id} id={star.id} className="scroll-mt-16">
              <div className="flex items-center gap-3">
                <FigureGlyph pattern={star.pattern} size="sm" />
                <h3 className="font-logo text-base text-sand-light">{star.name}</h3>
              </div>
              <div className="mt-3 space-y-2">
                <div>
                  <Badge tone="fire">House 6 · Illness</Badge>
                  <p className="mt-1.5 text-sm leading-relaxed text-sand/70">{star.house6.meaning}</p>
                </div>
                <div>
                  <Badge tone="sand">House 2 · Wealth</Badge>
                  <p className="mt-1.5 text-sm leading-relaxed text-sand/70">{star.house2.meaning}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {chapter.id === 'element-arrangement' ? (
        <div className="mt-4 space-y-5">
          {ELEMENTS.map((el) => (
            <div key={el}>
              <Badge tone={el}>{ELEMENT_LABEL[el]}</Badge>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {STARS.filter((s) => s.element === el).map((s) => (
                  <div key={s.id} className="flex flex-col items-center gap-1 rounded-xl border border-sand/10 py-3">
                    <FigureGlyph pattern={s.pattern} size="sm" />
                    <span className="text-[11px] text-sand/60">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {chapter.id === 'elements-and-occupations' ? (
        <div className="mt-4 space-y-4">
          {ELEMENTS.map((el) => (
            <Card key={el}>
              <Badge tone={el}>{ELEMENT_LABEL[el]}</Badge>
              <p className="mt-2 text-sm font-medium text-sand-light">
                {STARS.filter((s) => s.element === el)
                  .map((s) => s.name)
                  .join(', ')}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-sand/70">{ELEMENT_OCCUPATIONS[el]}</p>
            </Card>
          ))}
        </div>
      ) : null}

      {chapter.id === 'star-sadaqah' ? (
        <div className="mt-4 space-y-3">
          {STARS.map((star) => (
            <Card key={star.id} className="flex items-center gap-3">
              <FigureGlyph pattern={star.pattern} size="sm" />
              <div>
                <p className="text-sm font-medium text-sand-light">{star.name}</p>
                <p className="text-sm text-sand/70">{star.sadaqah.offering}</p>
                <p className="text-[11px] text-sand/45">{star.sadaqah.day}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </ReaderShell>
  );
}
