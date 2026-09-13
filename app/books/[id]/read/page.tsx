import Link from 'next/link';
import { notFound } from 'next/navigation';
import { X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ContentGuard } from '@/components/books/ContentGuard';
import { Prose } from '@/components/books/Prose';
import { FigureGlyph } from '@/components/raml/FigureGlyph';
import { HatimDiagram } from '@/components/books/HatimDiagram';
import { BOOKS, getBookById } from '@/content/books';
import { CHAPTERS, INTRODUCTION } from '@/content/manuscripts/master-of-geomancy-vol1';
import { KM_CHAPTERS } from '@/content/manuscripts/kanzul-mikban';
import { getStarUseByStarId } from '@/content/manuscripts/starUses';
import { getHatimByStarId } from '@/content/manuscripts/hatim';
import { getAbjadValidationByStarId } from '@/content/manuscripts/abjad';
import { STARS, ELEMENT_LABEL, ELEMENT_OCCUPATIONS, type Element } from '@/content/stars';

const ELEMENTS: Element[] = ['fire', 'air', 'water', 'sand'];

export function generateStaticParams() {
  return BOOKS.map((b) => ({ id: b.id }));
}

// A book is one continuous vertical document, not a page per chapter — every
// chapter is a <section> stacked in reading order in the SAME scrollable
// column, anchored by its own id so links elsewhere (search, "open this
// chapter", the contents list) can jump straight to it with a plain #hash.
// There is no prev/next chapter control: reaching the end of one chapter's
// content simply means the next chapter's heading is the next thing below it.
function ChapterHeading({ eyebrow, title, first }: { eyebrow: string; title: string; first: boolean }) {
  return (
    <div className={first ? '' : 'mt-12 border-t border-sand/10 pt-8'}>
      <p className="type-label uppercase tracking-widest text-sand/65">{eyebrow}</p>
      <h2 className="font-logo text-xl leading-snug text-sand-light">{title}</h2>
    </div>
  );
}

export default function BookReaderPage({ params }: { params: { id: string } }) {
  const book = getBookById(params.id);
  if (!book) notFound();

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-sand/10 px-4 py-3">
        <div className="min-w-0">
          <p className="type-label uppercase tracking-widest text-sand/65">Reading</p>
          <h1 className="truncate font-logo text-lg leading-snug text-sand-light">{book.title}</h1>
        </div>
        <Link
          href={`/books/${book.id}`}
          aria-label="Close"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sand/15 text-sand/65"
        >
          <X size={16} />
        </Link>
      </div>

      <ContentGuard watermarkText={`TRUTH GEOMANCER · ${book.title.toUpperCase()}`}>
        <div className="px-4 py-5">
          {book.id === 'kanzul-mikban'
            ? KM_CHAPTERS.map((chapter, i) => (
                <section key={chapter.id} id={chapter.id} className="scroll-mt-16">
                  <ChapterHeading
                    eyebrow={chapter.number !== null ? `Chapter ${chapter.number}` : 'Continued'}
                    title={chapter.title}
                    first={i === 0}
                  />
                  <div className="mt-4">
                    <Prose paragraphs={chapter.paragraphs} />
                  </div>
                </section>
              ))
            : CHAPTERS.map((chapter, i) => (
                <section key={chapter.id} id={chapter.id} className="scroll-mt-16">
                  <ChapterHeading eyebrow={`Chapter ${chapter.number}`} title={chapter.title} first={i === 0} />
                  <div className="mt-4">
                    {chapter.id === 'drawing-a-chart' ? <Prose paragraphs={INTRODUCTION} /> : null}
                    {chapter.body ? <Prose paragraphs={chapter.body} /> : null}

                    {chapter.id === 'stars-and-symbols' ? (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {STARS.map((star) => (
                          <Card key={star.id} className="flex items-center gap-3">
                            <FigureGlyph pattern={star.pattern} size="sm" />
                            <div>
                              <p className="type-body font-medium text-sand-light">{star.name}</p>
                              <p className="type-label text-sand/65">{ELEMENT_LABEL[star.element]}</p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : null}

                    {chapter.id === 'stars-in-the-chart' ? (
                      <div className="mt-4 space-y-4">
                        <p className="rounded-xl border border-sand/10 bg-ink px-3 py-2.5 type-evidence text-sand/70">
                          The paragraphs below are the manuscript’s own wording for each star, restored
                          from the source pages, followed by its hand-drawn Hatim. Where a Hatim mark
                          could not be read with confidence it says “under review” rather than guessing —
                          see{' '}
                          <a href="#stars-in-the-chart-notes" className="underline underline-offset-2 text-clay-light">
                            the note at the end of this chapter
                          </a>
                          .
                        </p>
                        {STARS.map((star) => {
                          const use = getStarUseByStarId(star.id);
                          const hatim = getHatimByStarId(star.id);
                          const abjad = getAbjadValidationByStarId(star.id);
                          return (
                            <Card key={star.id} id={star.id} className="scroll-mt-16">
                              <div className="flex items-center gap-3">
                                <FigureGlyph pattern={star.pattern} size="sm" />
                                <div>
                                  <h3 className="font-logo type-method text-sand-light">{star.name}</h3>
                                  {use ? (
                                    <p className="type-label text-sand/65">
                                      Entry {use.entryNumber} of 16 · page {use.sourcePage}
                                    </p>
                                  ) : null}
                                </div>
                              </div>

                              {use ? (
                                <div className="mt-3 space-y-3">
                                  <div>
                                    <Badge tone="fire">House 6 · Illness</Badge>
                                    <p className="mt-1.5 type-body leading-relaxed text-sand/70">{use.house6Text}</p>
                                  </div>
                                  <div>
                                    <Badge tone="sand">House 2 · Wealth</Badge>
                                    <p className="mt-1.5 type-body leading-relaxed text-sand/70">{use.house2Text}</p>
                                  </div>
                                  {use.notes.length > 0 ? (
                                    <p className="type-evidence italic text-sand/65">{use.notes.join(' ')}</p>
                                  ) : null}
                                  {use.sourceAmbiguity ? (
                                    <p className="rounded-lg border border-sand/10 bg-ink px-2.5 py-2 type-label text-sand/65">
                                      Source note: {use.sourceAmbiguity}
                                    </p>
                                  ) : null}
                                  {use.invocation ? (
                                    <div className="rounded-lg border border-sand/10 bg-ink px-3 py-2.5">
                                      <p className="type-label uppercase tracking-widest text-sand/65">Divine Name</p>
                                      <p className="type-body text-sand-light" dir="rtl" lang="ar">
                                        {use.invocation.arabic}
                                      </p>
                                      <p className="mt-1 type-label text-sand/65">
                                        Source value: {use.invocation.count} (source-derived — repeated as a recitation, not
                                        computed by this app)
                                        {abjad ? (
                                          <>
                                            {' '}
                                            · Abjad check: {abjad.status === 'match' ? 'match' : 'source/math discrepancy'}
                                          </>
                                        ) : null}
                                      </p>
                                      {abjad?.note ? <p className="mt-1 type-evidence text-sand/65">{abjad.note}</p> : null}
                                    </div>
                                  ) : null}
                                </div>
                              ) : (
                                <div className="mt-3">
                                  <div>
                                    <Badge tone="fire">House 6 · Illness</Badge>
                                    <p className="mt-1.5 type-body leading-relaxed text-sand/70">{star.house6.meaning}</p>
                                  </div>
                                  <div className="mt-2">
                                    <Badge tone="sand">House 2 · Wealth</Badge>
                                    <p className="mt-1.5 type-body leading-relaxed text-sand/70">{star.house2.meaning}</p>
                                  </div>
                                </div>
                              )}

                              {hatim ? (
                                <div className="mt-4 border-t border-sand/10 pt-3">
                                  <p className="mb-2 type-label uppercase tracking-widest text-sand/65">Hatim</p>
                                  <HatimDiagram hatim={hatim} starName={star.name} />
                                </div>
                              ) : null}
                            </Card>
                          );
                        })}
                        <p id="stars-in-the-chart-notes" className="scroll-mt-16 type-evidence text-sand/65">
                          A hand-drawn hooked mark recurs, unchanged, in the bottom-middle cell of every
                          one of the sixteen Hatim diagrams, and inside some stars’ own variable cells too.
                          It resembles either the Arabic-Indic numeral ٦ or the letter ك, but nothing in the
                          source glosses it, so no value is assigned to it here. Cells marked “under review”
                          contain that mark, or another hand-written figure that could not be read with
                          confidence from the source photographs — they are not blank, and no number was
                          guessed to fill them.
                        </p>
                      </div>
                    ) : null}

                    {chapter.id === 'element-arrangement' ? (
                      <div className="mt-4 space-y-5">
                        {ELEMENTS.map((el) => (
                          <div key={el}>
                            <Badge tone={el}>{ELEMENT_LABEL[el]}</Badge>
                            <div className="mt-2 grid grid-cols-4 gap-2">
                              {STARS.filter((s) => s.element === el).map((s) => (
                                <div
                                  key={s.id}
                                  className="flex flex-col items-center gap-1 rounded-xl border border-sand/10 py-3"
                                >
                                  <FigureGlyph pattern={s.pattern} size="sm" />
                                  <span className="type-label text-sand/65">{s.name}</span>
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
                            <p className="mt-2 type-body font-medium text-sand-light">
                              {STARS.filter((s) => s.element === el)
                                .map((s) => s.name)
                                .join(', ')}
                            </p>
                            <p className="mt-2 type-body leading-relaxed text-sand/70">{ELEMENT_OCCUPATIONS[el]}</p>
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
                              <p className="type-body font-medium text-sand-light">{star.name}</p>
                              <p className="type-body text-sand/70">{star.sadaqah.offering}</p>
                              <p className="type-label text-sand/65">{star.sadaqah.day}</p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </section>
              ))}
        </div>
      </ContentGuard>
    </div>
  );
}
