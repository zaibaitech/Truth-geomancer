import { Card } from '@/components/ui/Card';

/** Always visible (section 18 — not gated behind a toggle), positioned right
 * after the primary indicator. The text itself comes straight from
 * EngineResult.interpretation — deterministic, question-specific, already
 * templated per method in lib/raml/engine/interpretation.ts. */
export function InterpretationCard({ text }: { text: string }) {
  return (
    <Card>
      <p className="mb-2 text-[11px] uppercase tracking-widest text-sand/40">Interpretation</p>
      <p className="text-sm leading-relaxed text-sand/80">{text}</p>
    </Card>
  );
}
