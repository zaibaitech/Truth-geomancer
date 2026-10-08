import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Sparkles, History } from 'lucide-react';
import Link from 'next/link';
import { publicPageMetadata } from '@/lib/seo';

export const metadata = publicPageMetadata({
  title: 'My Star (Buruji) in Geomancy',
  description:
    'Find your Buruji, your star in Ilm al-Raml geomancy: cast a chart about your general life to see your star, ' +
    'your spiritual strength, and the root of anything that feels stuck.',
  path: '/star',
});

export default function StarPage() {
  return (
    <div>
      <Header title="My Star" subtitle="Your Buruji, once you cast" />
      <div className="space-y-3 px-4">
        <Card className="flex flex-col items-center gap-3 py-8 text-center">
          <Sparkles size={22} className="text-clay-light" />
          <p className="text-sm text-sand/65">
            Cast a chart about your general life, then open the “My Star” tab in the results to
            find your Buruji, your spiritual strength, and the root of anything that feels stuck.
          </p>
          <Link href="/raml" className="mt-1 rounded-xl bg-clay px-4 py-2.5 text-sm font-semibold text-ink">
            Cast a chart
          </Link>
        </Card>
        <Link
          href="/raml/history"
          className="flex items-center justify-center gap-2 rounded-2xl border border-sand/10 bg-ink-card py-3 text-sm text-sand/65"
        >
          <History size={15} /> View past castings
        </Link>
      </div>
    </div>
  );
}
