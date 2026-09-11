import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Chart } from '@/lib/raml/casting';
import { extractHouseRefs } from '@/lib/raml/houseRefs';
import { getIntentionById } from '@/content/intentions';
import { KM_CHAPTERS } from '@/content/manuscripts/kanzul-mikban';

export function ReadingTab({ chart, intentionId }: { chart: Chart; intentionId: string }) {
  const intention = getIntentionById(intentionId);
  if (!intention || intention.chapterIds.length === 0) return null;

  const chapters = intention.chapterIds
    .map((id) => KM_CHAPTERS.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c);

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-[11px] uppercase tracking-widest text-sand/40">Your intention</p>
        <p className="mt-1 text-sm font-semibold text-sand-light">{intention.label}</p>
        <p className="mt-1 text-xs text-sand/50">{intention.description}</p>
        <p className="mt-3 text-[11px] leading-relaxed text-sand/40">
          From Kanzul Mikban. Each chip shows the real figure your chart landed on at that
          house — read the method’s own wording below to apply what it means.
        </p>
      </Card>

      {chapters.map((ch) => (
        <Card key={ch.id}>
          <p className="mb-3 text-sm font-semibold text-sand-light">
            {ch.number !== null ? `Chapter ${ch.number} — ` : ''}
            {ch.title}
          </p>
          <div className="space-y-3">
            {ch.paragraphs.map((p, i) => {
              const houses = extractHouseRefs(p);
              return (
                <div key={i}>
                  {houses.length > 0 ? (
                    <div className="mb-1.5 flex flex-wrap gap-1">
                      {houses.map((n) => (
                        <Badge key={n} tone="sand">
                          H{n} {chart.houses[n - 1].star.name}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  <p className="text-sm leading-relaxed text-sand/70">{p}</p>
                </div>
              );
            })}
          </div>
          <Link href={`/books/kanzul-mikban/read/${ch.id}`} className="mt-3 inline-block text-xs text-clay-light">
            Open full chapter in the book →
          </Link>
        </Card>
      ))}
    </div>
  );
}
