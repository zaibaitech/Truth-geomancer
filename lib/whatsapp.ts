// WhatsApp click-to-chat contact layer (Prompt 59). This is deliberately
// the `wa.me` link pattern only — no WhatsApp Business API, no automated
// sending, no webhook, no AI. A tap opens the visitor's own WhatsApp app
// with a prefilled message they can still edit before sending; nothing
// here ever sends a message on its own.
//
// The number comes from NEXT_PUBLIC_WHATSAPP_NUMBER (public config, not a
// secret — see the env var's own name). When it is absent, every function
// below degrades to "no WhatsApp contact available" (null) rather than
// producing a broken wa.me link with no number — callers (WhatsAppButton)
// render nothing in that case instead of a dead link.
//
// Privacy: every message builder here takes only public, non-identifying
// data (a product/book's name or title) — never a userId, session token,
// email, payment reference, or entitlement id. Nothing in this module
// reads cookies, a session, or the database.

/** Returns the configured WhatsApp number as digits only (wa.me requires
 * the number with no `+`, spaces, or punctuation), or null if unset/blank. */
export function getWhatsAppNumber(): string | null {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!raw) return null;
  const digits = raw.replace(/[^0-9]/g, '');
  return digits.length > 0 ? digits : null;
}

/** Builds a `https://wa.me/<number>?text=<encoded message>` URL, or null
 * when no number is configured — never a URL with an empty/missing number
 * segment. */
export function buildWhatsAppUrl(message: string): string | null {
  const number = getWhatsAppNumber();
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

// ---------------------------------------------------------------------------
// Prefilled messages — always built from data already passed in by the
// caller (a real Product/Book from the existing catalogues), never a
// hardcoded book/product title.
// ---------------------------------------------------------------------------

export function buildProductContactMessage(product: { name: string }): string {
  return `Hi, I'd like to ask about "${product.name}" on Truth Geomancer.`;
}

export function buildBookContactMessage(book: { title: string }): string {
  return `Hi, I have a question about "${book.title}" on Truth Geomancer.`;
}

export function buildPaymentHelpMessage(product: { name: string }): string {
  return `Hi, I need help with a payment for "${product.name}" on Truth Geomancer.`;
}

export function buildAccessHelpMessage(): string {
  return "Hi, I'm having trouble accessing something I've purchased on Truth Geomancer.";
}

export function buildGeneralContactMessage(): string {
  return 'Hi, I have a question about Truth Geomancer.';
}

/** Prompt 61: the app never shows a price (none is set yet — the author
 * decides pricing separately), so the purchase path routes straight to a
 * message asking for it, rather than displaying an invented or "coming
 * soon" price anywhere in the UI. */
export function buildPurchaseInquiryMessage(product: { name: string }): string {
  return `Hi, I'm interested in purchasing "${product.name}". Could you tell me the current price and payment information?`;
}

// ---------------------------------------------------------------------------
// Prompt 61: Android native-app handoff. `https://wa.me/...` alone still
// works everywhere (it's what every href below defaults to), but on Android
// some browsers route it through an intermediate api.whatsapp.com page
// before offering to open the app. Android's `intent://` URL scheme is the
// standards-documented way (part of Chrome's own Intents-in-Android
// support, honored by most Chromium-based Android browsers) to ask for the
// WhatsApp app directly by package, while still declaring its own web
// fallback via `S.browser_fallback_url` — so a device without WhatsApp
// installed, or a browser that doesn't support the scheme, degrades to
// exactly the same wa.me URL this module already builds. This never
// guarantees the native app opens — only that browsers implementing the
// documented mechanism get the opportunity to.
// ---------------------------------------------------------------------------

/** Builds an Android `intent://` URL that asks to open WhatsApp directly,
 * carrying the same message and falling back to the plain wa.me URL — or
 * null when no number is configured (mirrors buildWhatsAppUrl). */
export function buildWhatsAppAndroidIntentUrl(message: string): string | null {
  const number = getWhatsAppNumber();
  const fallbackUrl = buildWhatsAppUrl(message);
  if (!number || !fallbackUrl) return null;
  return `intent://send?phone=${number}&text=${encodeURIComponent(message)}#Intent;scheme=whatsapp;package=com.whatsapp;S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end`;
}
