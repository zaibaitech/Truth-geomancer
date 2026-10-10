import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { FigureGlyph } from '@/components/raml/FigureGlyph';
import { JsonLd } from '@/components/seo/JsonLd';
import { BooksLine, Breadcrumbs, H2, LearnCta, MoreLink, P, SeoLink } from '@/components/seo/LearnUi';
import { FIGURES_HUB, LEARN_HUB } from '@/content/public/learnPages';
import { figurePath, getPublicFigure } from '@/content/public/figures';
import {
  FIGURE_PAGE_SLUGS,
  elementLabel,
  figurePageDescription,
  figurePageTitle,
  figurePatternWords,
  figurePlacement,
  figuresSharingElement,
  getFigurePage,
} from '@/content/public/figurePages';
import { absoluteUrl, breadcrumbJsonLd, publicPageMetadata } from '@/lib/seo';

type Props = { params: { slug: string } };

// Only the published figure pages are generated; any other slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return FIGURE_PAGE_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const figure = getFigurePage(params.slug);
  if (!figure) return {};
  // noindex until approved per-figure copy exists (see content/public/seoPages.ts).
  return {
    ...publicPageMetadata({
      title: figurePageTitle(figure),
      description: figurePageDescription(figure),
      path: figurePath(figure.id),
    }),
    robots: { index: false, follow: true },
  };
}

/** "A, B, and C" with links to any of them that have a published page. */
function NameList({ ids }: { ids: string[] }) {
  return (
    <>
      {ids.map((id, i) => {
        const f = getPublicFigure(id)!;
        const sep = i === 0 ? '' : i === ids.length - 1 ? (ids.length > 2 ? ', and ' : ' and ') : ', ';
        return (
          <span key={id}>
            {sep}
            <SeoLink href={figurePath(id)}>{f.name}</SeoLink>
          </span>
        );
      })}
    </>
  );
}

export default function FigurePage({ params }: Props) {
  const figure = getFigurePage(params.slug);
  if (!figure) notFound();

  const path = figurePath(figure.id);
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: LEARN_HUB.crumb, path: LEARN_HUB.path },
    { name: FIGURES_HUB.crumb, path: FIGURES_HUB.path },
    { name: figure.name, path },
  ];
  const others = FIGURE_PAGE_SLUGS.filter((s) => s !== figure.id).map((s) => getPublicFigure(s)!);

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          {
            '@context': 'https://schema.org',
            '@type': 'DefinedTerm',
            name: figure.name,
            description: figurePageDescription(figure),
            termCode: String(figure.number),
            url: absoluteUrl(path),
            inDefinedTermSet: `${absoluteUrl(FIGURES_HUB.path)}#terms`,
          },
        ]}
      />
      <Header title={figure.name} subtitle={`Figure ${figure.number} of 16 · ${elementLabel(figure)}`} />
      <Breadcrumbs crumbs={crumbs} />
      <article className="space-y-4 px-4 py-4">
        <Card className="flex flex-col items-center gap-3 py-6 text-center">
          <FigureGlyph pattern={figure.pattern} size="lg" />
          <Badge tone={figure.element}>{elementLabel(figure)}</Badge>
        </Card>

        <P>
          <strong className="text-sand-light">{figure.name}</strong> is figure{' '}
          <strong className="text-sand-light">{figure.number}</strong> of the sixteen figures of Ilm al-Raml, in the order
          taught in <em>The Master of Geomancy</em>. {figurePlacement(figure)} Like every figure, it can appear in any of the
          sixteen houses of a chart, and each time it lands somewhere new, it has something different to say.
        </P>
        <P>
          <strong className="text-sand-light">Pattern</strong> (top to bottom): {figurePatternWords(figure)}.
        </P>
        <P>
          <strong className="text-sand-light">Element:</strong> {elementLabel(figure)}. It shares this element with{' '}
          <NameList ids={figuresSharingElement(figure).map((f) => f.id)} />.
        </P>

        <H2>What does {figure.name} mean?</H2>
        <P>
          That depends on where it falls in your chart and what you’re asking. The same figure can carry a very different
          message in the house of wealth than in the house of marriage. Learning to read those shifts is the heart of Ilm
          al-Raml.
        </P>
        <P>
          <SeoLink href="/raml">Cast a free chart</SeoLink> and see whether {figure.name} appears in yours.
        </P>
        <BooksLine />
        <LearnCta />

        <H2>More figures</H2>
        <ul className="grid grid-cols-3 gap-2">
          {others.map((f) => (
            <li key={f.id}>
              <Link
                href={figurePath(f.id)}
                className="flex h-full flex-col items-center gap-1.5 rounded-2xl border border-sand/12 bg-ink-card px-2 py-3 text-center transition-colors hover:border-sand/25 active:scale-[0.98]"
              >
                <FigureGlyph pattern={f.pattern} size="sm" />
                <p className="type-label font-medium leading-tight text-sand-light">{f.name}</p>
                <p className="text-xs leading-tight text-sand/65">No. {f.number}</p>
              </Link>
            </li>
          ))}
        </ul>
        <MoreLink href={FIGURES_HUB.path}>All 16 figures</MoreLink>
      </article>
    </div>
  );
}
