import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function StarPage() {
  return (
    <div>
      <Header title="My Star" subtitle="Your Buruji, once you cast" />
      <div className="px-4">
        <Card className="flex flex-col items-center gap-3 py-8 text-center">
          <Sparkles size={22} className="text-clay-light" />
          <p className="text-sm text-sand/60">
            Cast a chart about your general life, then open the “My Star” tab in the results to
            find your Buruji, your spiritual strength, and the root of anything that feels stuck.
          </p>
          <Link href="/raml" className="mt-1 rounded-xl bg-clay px-4 py-2.5 text-sm font-semibold text-ink">
            Cast a chart
          </Link>
        </Card>
      </div>
    </div>
  );
}
