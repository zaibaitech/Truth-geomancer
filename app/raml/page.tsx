import { Header } from '@/components/layout/Header';
import { CastingFlow } from '@/components/raml/CastingFlow';

export default function RamlPage() {
  return (
    <div>
      <Header title="Cast a Chart" subtitle="Ilm al-Raml" />
      <div className="py-4">
        <CastingFlow />
      </div>
    </div>
  );
}
