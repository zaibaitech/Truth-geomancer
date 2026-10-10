import { Header } from '@/components/layout/Header';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs, H2, LearnCta, MoreLink, P, SeoLink } from '@/components/seo/LearnUi';
import { ILM_AL_RAML_INTRO, LEARN_HUB, LEARN_PUBLISHED } from '@/content/public/learnPages';
import { KANZUL_BOOK_PATH, MASTER_BOOK_PATH } from '@/content/public/seoPages';
import { articleJsonLd, breadcrumbJsonLd, publicPageMetadata } from '@/lib/seo';

export const metadata = publicPageMetadata({
  absoluteTitle: ILM_AL_RAML_INTRO.absoluteTitle,
  description: ILM_AL_RAML_INTRO.description,
  path: ILM_AL_RAML_INTRO.path,
});

const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: LEARN_HUB.crumb, path: LEARN_HUB.path },
  { name: ILM_AL_RAML_INTRO.crumb, path: ILM_AL_RAML_INTRO.path },
];

export default function IlmAlRamlIntroPage() {
  return (
    <div>
      <JsonLd
        data={[
          breadcrumbJsonLd(CRUMBS),
          articleJsonLd({
            headline: ILM_AL_RAML_INTRO.h1,
            description: ILM_AL_RAML_INTRO.description,
            path: ILM_AL_RAML_INTRO.path,
            datePublished: LEARN_PUBLISHED,
          }),
        ]}
      />
      <Header title={ILM_AL_RAML_INTRO.h1} subtitle="The science of the sand" />
      <Breadcrumbs crumbs={CRUMBS} />
      <article className="space-y-4 px-4 py-4">
        <P>
          <strong className="text-sand-light">Ilm al-Raml</strong> means “the science of the sand”. It is the Arabic name
          for the art known in English as <strong className="text-sand-light">geomancy</strong>. A practitioner makes marks
          in the sand (today, on paper or a screen), turns them into simple figures of one or two dots, and arranges those
          figures into a chart that is read for a question.
        </P>

        <H2>Where it comes from</H2>
        <P>
          Historians describe Ilm al-Raml as already well established in North Africa, Egypt and Syria by the twelfth
          century. Where it began is still debated. In twelfth-century Spain, translators rendered its Arabic name into
          Latin as <em>geomantia</em>, which gave us the word “geomancy”. The art is still practised today in many
          regions, from Iran and Yemen to West Africa. A brass geomancy instrument made in Syria in 1241–42 is kept in the
          British Museum. Ilm al-Raml is unrelated to Chinese feng shui, which simply shares the English name.
        </P>
        <p className="type-label leading-[1.6] text-sand/65">
          Sources: E. Savage-Smith, “Geomancy in the Islamic World”, <em>Encyclopaedia of the History of Science,
          Technology, and Medicine in Non-Western Cultures</em>; E. Savage-Smith and M. B. Smith, <em>Islamic Geomancy and
          a Thirteenth-Century Divinatory Device</em> (1980); British Museum, geomantic instrument, museum no. 1888,0526.1.
        </p>

        <H2>The sixteen figures</H2>
        <P>
          Every chart is made from <strong className="text-sand-light">sixteen figures</strong>. Each one is a stack of
          four rows, and every row holds either one dot or two. In <em>The Master of Geomancy</em> each figure has a name, a
          number from 1 (Yussif) to 16 (Musah), and an element: Fire, Air, Water or Sand/Earth.
        </P>
        <MoreLink href="/figures">Meet the 16 figures</MoreLink>

        <H2>How a chart is built</H2>
        <P>At a high level:</P>
        <ol className="list-decimal space-y-1.5 pl-5 type-body leading-[1.7] text-sand/80">
          <li>
            With your question in mind, you make <strong className="text-sand-light">sixteen rows of marks</strong> without
            counting them.
          </li>
          <li>
            Each row becomes <strong className="text-sand-light">one dot (odd) or two dots (even)</strong>, and every four
            rows make one figure.
          </li>
          <li>
            The first four figures, called the <strong className="text-sand-light">Mothers</strong>, give rise to the rest
            of the chart, step by step, until all <strong className="text-sand-light">sixteen houses</strong> are filled.
          </li>
        </ol>
        <P>
          Each house speaks to an area of life, such as self, wealth, home, marriage or career. The last positions bring
          the chart together in <strong className="text-sand-light">the Judge</strong>.
        </P>
        <MoreLink href="/houses">See the 16 houses</MoreLink>

        <H2>Reading a chart</H2>
        <P>
          This is where the real knowledge lies. The same figure can say something quite different depending on the house
          it falls in and the question being asked. Ilm al-Raml is a traditional art and an invitation to reflection, not a
          guarantee of any outcome.
        </P>

        <H2>Discover more</H2>
        <P>
          You can try it now: <SeoLink href="/raml">cast a free chart</SeoLink> and read the free sample question, “Will I
          own a house in my life?” (<em>Kanzul Mikban</em>, Chapter 146).
        </P>
        <P>
          The full meanings and methods are in <SeoLink href={MASTER_BOOK_PATH}>The Master of Geomancy</SeoLink>, the
          foundation text by Sheikh Abdul Basit Bayan, and <SeoLink href={KANZUL_BOOK_PATH}>Kanzul Mikban</SeoLink>, which
          holds over 150 question-specific reading methods.
        </P>
        <LearnCta />
        <MoreLink href={LEARN_HUB.path}>All the free basics</MoreLink>
      </article>
    </div>
  );
}
