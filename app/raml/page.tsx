import { Header } from '@/components/layout/Header';
import { CastingFlow } from '@/components/raml/CastingFlow';
import { getCurrentUserIfPresent } from '@/lib/server/session';
import { getDb } from '@/lib/server/db';
import { getCastingAccessSnapshot } from '@/lib/server/raml/castingAccess';
import { JsonLd } from '@/components/seo/JsonLd';
import { castingToolJsonLd, publicPageMetadata } from '@/lib/seo';

const RAML_DESCRIPTION =
  'Cast an Ilm al-Raml geomancy chart online: tap the sixteen lines to get the full 16-house shield chart, ' +
  'then read it for one of 153 questions from Kanzul Mikban.';

export const metadata = publicPageMetadata({
  title: 'Cast a Geomancy Chart Online',
  description: RAML_DESCRIPTION,
  path: '/raml',
});

export const dynamic = 'force-dynamic';

export default async function RamlPage() {
  const user = await getCurrentUserIfPresent();
  const access = await getCastingAccessSnapshot(getDb(), user?.id ?? null);

  return (
    <div>
      <JsonLd data={castingToolJsonLd(RAML_DESCRIPTION)} />
      <Header title="Cast a Chart" subtitle="Ilm al-Raml" />
      <div className="py-4">
        <CastingFlow access={access} />
      </div>
    </div>
  );
}
