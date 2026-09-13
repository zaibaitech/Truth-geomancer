import { Card } from '@/components/ui/Card';
import { FigureGlyph } from './FigureGlyph';
import type { Chart } from '@/lib/raml/casting';
import { houseInfo } from '@/lib/raml/houses';

export function ChartGrid({ chart }: { chart: Chart }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {chart.houses.map((h) => {
        const info = houseInfo(h.n);
        return (
          <Card key={h.n} padding="p-2" className="flex flex-col items-center gap-1.5 text-center">
            <span className="type-label text-sand/65">H{h.n}</span>
            <FigureGlyph pattern={h.pattern} size="sm" />
            <span className="type-label text-sand-light">{h.star.name}</span>
            <span className="type-label text-sand/65">{info.title}</span>
          </Card>
        );
      })}
    </div>
  );
}
