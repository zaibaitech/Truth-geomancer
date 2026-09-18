import { MessageCircle } from 'lucide-react';
import { WhatsAppButton } from '@/components/whatsapp/WhatsAppButton';
import { TALK_TO_AUTHOR_COPY } from '@/lib/dashboard/copy';
import { buildGeneralContactMessage } from '@/lib/whatsapp';

// Prompt 61/63: one elegant, singular WhatsApp entry point on the
// dashboard — deliberately the only WhatsApp card on this page
// (ExploreBooks' own "Ask the Author" links are per-book, contextual, not
// a duplicate of this general one). Prompt 63's approved visual concept
// gives this one card a WhatsApp-green accent (its own explicit allowance:
// "use a WhatsApp-style visual accent") — every other card on the
// dashboard/app keeps the standard bronze/gold palette; this is a
// deliberate, scoped exception, not a new visual identity.
export function TalkToAuthor() {
  return (
    <div className="px-4">
      <div className="flex items-start gap-3 rounded-2xl border border-[#25D366]/25 bg-[#25D366]/[0.07] p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-ink">
          <MessageCircle size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="type-body font-semibold text-sand-light">{TALK_TO_AUTHOR_COPY.heading}</p>
          <p className="mt-1 type-meta text-sand/65">{TALK_TO_AUTHOR_COPY.body}</p>
          <div className="mt-3">
            <WhatsAppButton message={buildGeneralContactMessage()} label={TALK_TO_AUTHOR_COPY.cta} variant="whatsapp" />
          </div>
        </div>
      </div>
    </div>
  );
}
