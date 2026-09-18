import { MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { WhatsAppButton } from '@/components/whatsapp/WhatsAppButton';
import { TALK_TO_AUTHOR_COPY } from '@/lib/dashboard/copy';
import { buildGeneralContactMessage } from '@/lib/whatsapp';

// Prompt 61: one elegant, singular WhatsApp entry point on the dashboard —
// deliberately the only WhatsApp card on this page (ExploreBooks' own
// "Ask the Author" links are per-book, contextual, not a duplicate of this
// general one) so the dashboard doesn't read as an aggressive sales page.
export function TalkToAuthor() {
  return (
    <div className="px-4">
      <Card className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sand/15 bg-ink text-clay-light">
          <MessageCircle size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="type-body font-semibold text-sand-light">{TALK_TO_AUTHOR_COPY.heading}</p>
          <p className="mt-1 type-meta text-sand/65">{TALK_TO_AUTHOR_COPY.body}</p>
          <div className="mt-3">
            <WhatsAppButton message={buildGeneralContactMessage()} label={TALK_TO_AUTHOR_COPY.cta} />
          </div>
        </div>
      </Card>
    </div>
  );
}
