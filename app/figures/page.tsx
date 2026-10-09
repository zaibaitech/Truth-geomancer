import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { FigureGlyph } from '@/components/raml/FigureGlyph';
import { JsonLd } from '@/components/seo/JsonLd';
import { BooksLine, Breadcrumbs, H2, LearnCta, MoreLink, P } from '@/components/seo/LearnUi';
import { FIGURES_HUB, LEARN_HUB } from '@/content/public/learnPages';
import { FIGURE_ELEMENT_LABEL, PUBLIC_FIGURES, figurePath, type PublicFigure } from '@/content/public/figures';
import { isLivePath } from '@/content/public/seoPages';
import { breadcrumbJsonLd, definedTermSetJsonLd, publicPageMetadata } from '@/lib/seo';

export const metadata = publicPageMetadata({
  title: FIGURES_HUB.title,
  description: FIGURES_HUB.description,
  path: FIGURES_HUB.path,
});

const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: LEARN_HUB.crumb, path: LEARN_HUB.path },
  { name: FIGURES_HUB.crumb, path: FIGURES_HUB.path },
];

/** One figure: glyph, number, name and the book's element. Links to its page once that page is published. */
function FigureTile({ figure }: { figure: PublicFigure }) {
  const href = figurePath(figure.id);
  const live = isLivePath(href);
  const body = (
    <>
      <FigureGlyph pattern={figure.pattern} size="md" />
      <p className="mt-1 type-label text-sand/65">No. {figure.number}</p>
      <p className="type-body font-semibold leading-tight text-sand-light">{figure.name}</p>
      <Badge tone={figure.element}>{FIGURE_ELEMENT_LABEL[figure.element]}</Badge>
    </>
  );
  const cls = 'flex h-full flex-col items-center gap-1.5 rounded-2xl border border-sand/12 bg-ink-card px-2 py-4 text-center';
  return live ? (
    <Link href={href} className={`${cls} transition-colors hover:border-sand/25 active:scale-[0.98]`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default function FiguresHubPage() {
  return (
    <div>
      <JsonLd
        data={[
          breadcrumbJsonLd(CRUMBS),
          definedTermSetJsonLd({
            name: FIGURES_HUB.h1,
            description: FIGURES_HUB.description,
            path: FIGURES_HUB.path,
            terms: PUBLIC_FIGURES.map((f) => ({
              name: f.name,
              description: `Figure ${f.number} of the 16 in Ilm al-Raml. Element: ${FIGURE_ELEMENT_LABEL[f.element]}.`,
              termCode: String(f.number),
              ...(isLivePath(figurePath(f.id)) ? { path: figurePath(f.id) } : {}),
            })),
          }),
        ]}
      />
      <Header title={FIGURES_HUB.h1} subtitle="Names, numbers, dot patterns and elements" />
      <Breadcrumbs crumbs={CRUMBS} />
      <div className="space-y-4 px-4 py-4">
        <P>
          Every geomancy chart is made from sixteen figures. Each is a stack of four rows, and each row has one dot or two.
          Here they are in the order taught in <em>The Master of Geomancy</em>. Rows read from top to bottom.
        </P>
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {PUBLIC_FIGURES.map((f) => (
            <li key={f.id}>
              <FigureTile figure={f} />
            </li>
          ))}
        </ol>

        <H2>What do they mean?</H2>
        <P>
          Every figure has its own character, and its message changes with the house it lands in and the question you ask.
          Those meanings are what <em>The Master of Geomancy</em> teaches.
        </P>
        <P>Cast a free chart to see which figures appear in yours.</P>
        <BooksLine />
        <LearnCta />
        <MoreLink href="/houses">See the 16 houses</MoreLink>
        <MoreLink href={LEARN_HUB.path}>All the free basics</MoreLink>
      </div>
    </div>
  );
}
