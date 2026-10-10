import { BookOpen, Grid2x2, LayoutGrid, ListTree } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs, H2, LearnCta, LinkList, P, SeoLink } from '@/components/seo/LearnUi';
import { LEARN_HUB } from '@/content/public/learnPages';
import { KANZUL_BOOK_PATH, MASTER_BOOK_PATH } from '@/content/public/seoPages';
import { breadcrumbJsonLd, publicPageMetadata } from '@/lib/seo';

export const metadata = publicPageMetadata({
  title: LEARN_HUB.title,
  description: LEARN_HUB.description,
  path: LEARN_HUB.path,
});

const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: LEARN_HUB.crumb, path: LEARN_HUB.path },
];

// Rows link only to pages that are published (see content/public/seoPages.ts).
const TOPICS = [
  { href: '/learn/ilm-al-raml', icon: BookOpen, title: 'What is Ilm al-Raml?', description: 'The art in a few minutes' },
  { href: '/figures', icon: Grid2x2, title: 'The 16 figures', description: 'Names, numbers, dot patterns and elements' },
  { href: '/houses', icon: LayoutGrid, title: 'The 16 houses', description: 'What each part of a chart is about' },
  { href: '/learn/glossary', icon: ListTree, title: 'Glossary', description: 'The key terms' },
];

export default function LearnHubPage() {
  return (
    <div>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <Header title={LEARN_HUB.h1} subtitle="Free basics" />
      <Breadcrumbs crumbs={CRUMBS} />
      <div className="space-y-4 px-4 py-4">
        <P>
          Ilm al-Raml, “the science of the sand”, is the classical art of geomancy. It builds a chart of sixteen houses
          from sixteen simple dot figures. Start with the basics here.
        </P>
        <LinkList items={TOPICS} />

        <H2>Go further</H2>
        <P>
          These pages show you the shape of a chart. What each figure means, house by house and question by question, is
          taught in <SeoLink href={MASTER_BOOK_PATH}>The Master of Geomancy</SeoLink> and{' '}
          <SeoLink href={KANZUL_BOOK_PATH}>Kanzul Mikban</SeoLink>, which holds over 150 question-specific reading methods.
        </P>
        <LearnCta />
      </div>
    </div>
  );
}
