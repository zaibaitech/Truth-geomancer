import { MessageCircle } from 'lucide-react';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

// Prompt 59: a plain outbound link, not a client component — it needs no
// state or event handler, just an <a href> the browser hands to WhatsApp
// (or wa.me's own web fallback) itself. Renders nothing at all when no
// number is configured, rather than a dead link with an empty destination.
export function WhatsAppButton({
  message,
  label = 'Contact on WhatsApp',
  variant = 'outline',
  className = '',
}: {
  message: string;
  label?: string;
  variant?: 'outline' | 'subtle';
  className?: string;
}) {
  const url = buildWhatsAppUrl(message);
  if (!url) return null;

  const variantClass =
    variant === 'outline'
      ? 'border border-sand/15 text-sand-light'
      : 'text-clay-light';

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} (opens WhatsApp in a new tab)`}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 type-body font-medium ${variantClass} ${className}`}
    >
      <MessageCircle size={15} className="shrink-0 text-clay-light" aria-hidden />
      {label}
    </a>
  );
}
