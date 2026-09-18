import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';

// Prompt 65 (Phase 14): a calm, explicitly non-error empty state — every
// caller passes copy that reads as reassurance ("You're all caught up"),
// never as a blank/broken screen.
export function EmptyState({ icon: Icon, heading, body }: { icon: LucideIcon; heading: string; body: string }) {
  return (
    <Card className="flex flex-col items-center py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-sand/15 bg-ink text-clay-light">
        <Icon size={17} />
      </div>
      <p className="mt-3 type-body font-semibold text-sand-light">{heading}</p>
      <p className="mt-1 type-body text-sand/65">{body}</p>
    </Card>
  );
}
