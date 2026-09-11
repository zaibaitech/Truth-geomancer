import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FigureGlyph } from './FigureGlyph';
import { ELEMENT_LABEL, type Star } from '@/content/stars';

const elementTone = {
  fire: 'fire',
  air: 'air',
  water: 'water',
  sand: 'sand',
} as const;

export function StarCard({
  star,
  eyebrow,
  children,
}: {
  star: Star;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-start gap-4">
        <FigureGlyph pattern={star.pattern} size="lg" />
        <div className="flex-1">
          {eyebrow ? (
            <p className="mb-1 text-[11px] uppercase tracking-widest text-sand/45">{eyebrow}</p>
          ) : null}
          <h3 className="font-logo text-lg text-sand-light">{star.name}</h3>
          <div className="mt-1.5">
            <Badge tone={elementTone[star.element]}>{ELEMENT_LABEL[star.element]}</Badge>
          </div>
        </div>
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </Card>
  );
}
