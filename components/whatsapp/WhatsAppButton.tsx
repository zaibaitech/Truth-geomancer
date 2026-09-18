'use client';

import { MessageCircle } from 'lucide-react';
import { buildWhatsAppAndroidIntentUrl, buildWhatsAppUrl } from '@/lib/whatsapp';

// Prompt 59/61: the href is always the plain wa.me URL — a fully working
// link with no JS, on every platform, and what a long-press/right-click
// "copy link" or a screen reader always sees. On Android only, a click is
// additionally given the chance to hand off to the WhatsApp app directly
// via its documented `intent://` scheme (see lib/whatsapp.ts) before the
// browser would otherwise route through an intermediate web page; if that
// fails for any reason the scheme's own S.browser_fallback_url still lands
// on the exact same wa.me URL. iOS/desktop are left to their normal,
// already-correct Universal Link / new-tab behavior — target="_blank" is
// kept so desktop never navigates the app itself away to WhatsApp Web.
// Renders nothing at all when no number is configured, rather than a dead
// link with an empty destination.
export function WhatsAppButton({
  message,
  label = 'Contact on WhatsApp',
  variant = 'outline',
  className = '',
}: {
  message: string;
  label?: string;
  // Prompt 63: 'whatsapp' is a WhatsApp-green accent used only on the
  // dashboard's "Talk to the Author" card, per that prompt's own allowance
  // ("If appropriate, use a WhatsApp-style visual accent") — every other
  // existing caller (purchase page, settings, book cards) keeps using
  // 'outline'/'subtle' unchanged, so this is purely additive.
  variant?: 'outline' | 'subtle' | 'whatsapp';
  className?: string;
}) {
  const url = buildWhatsAppUrl(message);
  if (!url) return null;

  const variantClass =
    variant === 'outline'
      ? 'border border-sand/15 text-sand-light'
      : variant === 'whatsapp'
        ? 'bg-[#25D366] text-ink'
        : 'text-clay-light';
  const iconClass = variant === 'whatsapp' ? 'text-ink' : 'text-clay-light';

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (typeof navigator === 'undefined' || !/Android/i.test(navigator.userAgent)) return;
    const intentUrl = buildWhatsAppAndroidIntentUrl(message);
    if (!intentUrl) return;
    event.preventDefault();
    window.location.href = intentUrl;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      aria-label={`${label} (opens WhatsApp in a new tab)`}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 type-body font-medium ${variantClass} ${className}`}
    >
      <MessageCircle size={15} className={`shrink-0 ${iconClass}`} aria-hidden />
      {label}
    </a>
  );
}
