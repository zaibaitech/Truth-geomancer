import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { JsonLd } from '@/components/seo/JsonLd';
import { BooksLine, Breadcrumbs, IfLive, LearnCta, MoreLink, P, SeoLink } from '@/components/seo/LearnUi';
import { GLOSSARY, GLOSSARY_TERMS, LEARN_HUB } from '@/content/public/learnPages';
import { breadcrumbJsonLd, definedTermSetJsonLd, publicPageMetadata } from '@/lib/seo';

export const metadata = publicPageMetadata({
  title: GLOSSARY.title,
  description: GLOSSARY.description,
  path: GLOSSARY.path,
});

const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: LEARN_HUB.crumb, path: LEARN_HUB.path },
  { name: GLOSSARY.crumb, path: GLOSSARY.path },
];

export default function GlossaryPage() {
  return (
    <div>
      <JsonLd
        data={[
          breadcrumbJsonLd(CRUMBS),
          definedTermSetJsonLd({
            name: GLOSSARY.h1,
            description: GLOSSARY.description,
            path: GLOSSARY.path,
            terms: GLOSSARY_TERMS.map((t) => ({ name: t.term, description: t.definition })),
          }),
        ]}
      />
      <Header title={GLOSSARY.h1} subtitle="Short definitions" />
      <Breadcrumbs crumbs={CRUMBS} />
      <div className="space-y-4 px-4 py-4">
        <Card padding="p-0">
          <dl>
            {GLOSSARY_TERMS.map((t, i) => (
              <div key={t.term} className={`px-4 py-3.5 ${i !== GLOSSARY_TERMS.length - 1 ? 'border-b border-sand/10' : ''}`}>
                <dt className="type-body font-semibold text-sand-light">{t.term}</dt>
                <dd className="mt-0.5 type-meta text-sand/65">
                  {t.definition}
                  {t.see ? (
                    <IfLive href={t.see.href}>
                      {' '}
                      → <SeoLink href={t.see.href}>{t.see.label}</SeoLink>
                    </IfLive>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        <P>
          Ready to see these in action? <SeoLink href="/raml">Cast a free chart</SeoLink>.
        </P>
        <BooksLine />
        <LearnCta />
        <MoreLink href={LEARN_HUB.path}>All the free basics</MoreLink>
      </div>
    </div>
  );
}
