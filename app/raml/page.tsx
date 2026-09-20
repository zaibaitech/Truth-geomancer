import { Header } from '@/components/layout/Header';
import { CastingFlow } from '@/components/raml/CastingFlow';
import { getCurrentUserIfPresent } from '@/lib/server/session';
import { getDb } from '@/lib/server/db';
import { getCastingAccessSnapshot } from '@/lib/server/raml/castingAccess';

export const dynamic = 'force-dynamic';

export default async function RamlPage() {
  const user = await getCurrentUserIfPresent();
  const access = await getCastingAccessSnapshot(getDb(), user?.id ?? null);

  return (
    <div>
      <Header title="Cast a Chart" subtitle="Ilm al-Raml" />
      <div className="py-4">
        <CastingFlow access={access} />
      </div>
    </div>
  );
}
