import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { JsonLd } from '@/components/seo/JsonLd';
import { BooksLine, Breadcrumbs, H2, LearnCta, MoreLink, P } from '@/components/seo/LearnUi';
import { HOUSES_HUB, LEARN_HUB } from '@/content/public/learnPages';
import { HOUSE_GROUPS, PUBLIC_HOUSES } from '@/content/public/houses';
import { breadcrumbJsonLd, definedTermSetJsonLd, publicPageMetadata } from '@/lib/seo';

export const metadata = publicPageMetadata({
  title: HOUSES_HUB.title,
  description: HOUSES_HUB.description,
  path: HOUSES_HUB.path,
});

const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: LEARN_HUB.crumb, path: LEARN_HUB.path },
  { name: HOUSES_HUB.crumb, path: HOUSES_HUB.path },
];

export default function HousesHubPage() {
  return (
    <div>
      <JsonLd
        data={[
          breadcrumbJsonLd(CRUMBS),
          definedTermSetJsonLd({
            name: HOUSES_HUB.h1,
            description: HOUSES_HUB.description,
            path: HOUSES_HUB.path,
            terms: PUBLIC_HOUSES.map((h) => ({ name: h.name, description: h.about, termCode: String(h.number) })),
          }),
        ]}
      />
      <Header title={HOUSES_HUB.h1} subtitle="What each part of a chart is about" />
      <Breadcrumbs crumbs={CRUMBS} />
      <div className="space-y-4 px-4 py-4">
        <P>
          A cast chart places one figure in each of sixteen houses. The first twelve each cover an area of life, and the last
          four bring the chart together.
        </P>
        <Card padding="p-0">
          <ol>
            {PUBLIC_HOUSES.map((h, i) => (
              <li
                key={h.number}
                className={`flex items-center gap-3 px-4 py-3 ${i !== PUBLIC_HOUSES.length - 1 ? 'border-b border-sand/10' : ''}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sand/15 type-label font-semibold text-clay-light">
                  {h.number}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="type-body text-sand-light">{h.name}</p>
                  <p className="type-label text-sand/65">{h.about}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <H2>How the sixteen houses are grouped</H2>
        <P>The traditional grouping of the houses gives each part of the chart a name:</P>
        <ul className="space-y-2">
          {HOUSE_GROUPS.map((g) => (
            <li key={g.name} className="type-body leading-[1.7] text-sand/80">
              <strong className="text-sand-light">
                {g.range}: {g.name}.
              </strong>{' '}
              {g.note}
            </li>
          ))}
        </ul>

        <H2>What does a figure say in each house?</H2>
        <P>
          That’s where reading begins. How each figure speaks in each house, and how to answer a specific question, is taught
          in the books.
        </P>
        <P>Cast a free chart to see your own sixteen houses.</P>
        <BooksLine />
        <LearnCta />
        <MoreLink href="/figures">Meet the 16 figures</MoreLink>
        <MoreLink href={LEARN_HUB.path}>All the free basics</MoreLink>
      </div>
    </div>
  );
}
