// Tests for the WhatsApp click-to-chat helper (Prompt 59). NEVER makes a
// real network call and never sends a real WhatsApp message — this module
// only builds URLs/strings; nothing here has side effects.
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildAccessHelpMessage,
  buildBookContactMessage,
  buildGeneralContactMessage,
  buildPaymentHelpMessage,
  buildProductContactMessage,
  buildWhatsAppUrl,
  getWhatsAppNumber,
} from './whatsapp';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getWhatsAppNumber', () => {
  it('A: returns null when NEXT_PUBLIC_WHATSAPP_NUMBER is unset', () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '');
    expect(getWhatsAppNumber()).toBeNull();
  });

  it('B: returns null when the env var is only whitespace/punctuation (no digits)', () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '+() -');
    expect(getWhatsAppNumber()).toBeNull();
  });

  it('C: returns the raw digits for a plain numeric value', () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '233248513634');
    expect(getWhatsAppNumber()).toBe('233248513634');
  });

  it('D: strips a leading "+", spaces, and dashes from the configured value', () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '+233 248-513-634');
    expect(getWhatsAppNumber()).toBe('233248513634');
  });
});

describe('buildWhatsAppUrl', () => {
  it('E: returns null when no number is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '');
    expect(buildWhatsAppUrl('Hello')).toBeNull();
  });

  it('F: builds a wa.me URL with the digits-only number and the encoded message', () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '233248513634');
    const url = buildWhatsAppUrl('Hello there');
    expect(url).toBe('https://wa.me/233248513634?text=Hello%20there');
  });

  it('G: URL-encodes special characters (quotes, &, #, newline) so the URL stays well-formed', () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '233248513634');
    const message = 'Hi, I\'d like to ask about "Book & Co" #1\nSecond line';
    const url = buildWhatsAppUrl(message)!;
    expect(url.startsWith('https://wa.me/233248513634?text=')).toBe(true);
    expect(url).not.toMatch(/[\s"&#\n]/); // no raw unsafe characters leak into the URL itself
  });

  it('H: the encoded message round-trips back to the exact original text', () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '233248513634');
    const message = 'Testing "quotes", &ampersands, #hashes, and emoji 🙏';
    const url = buildWhatsAppUrl(message)!;
    const encoded = url.split('?text=')[1];
    expect(decodeURIComponent(encoded)).toBe(message);
  });

  it('I: never produces a URL with an empty number segment', () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', 'not-a-number');
    expect(buildWhatsAppUrl('Hello')).toBeNull();
  });
});

describe('message builders — product/book specific, never hardcoded', () => {
  it('J: buildProductContactMessage embeds the given product name, not a hardcoded title', () => {
    expect(buildProductContactMessage({ name: 'Example Product' })).toContain('Example Product');
    expect(buildProductContactMessage({ name: 'A Different Product' })).toContain('A Different Product');
  });

  it('K: buildBookContactMessage embeds the given book title, not a hardcoded title', () => {
    expect(buildBookContactMessage({ title: 'Example Book' })).toContain('Example Book');
    expect(buildBookContactMessage({ title: 'A Different Book' })).toContain('A Different Book');
  });

  it('L: buildPaymentHelpMessage embeds the given product name', () => {
    expect(buildPaymentHelpMessage({ name: 'Example Product' })).toContain('Example Product');
  });
});

describe('message builders — privacy: no private/internal data', () => {
  const PRIVATE_DATA_PATTERNS = [
    /@/, // an email address
    /user[_-]?id/i,
    /session/i,
    /token/i,
    /payment[_-]?reference/i,
    /entitlement/i,
    /\bref[:=]/i,
  ];

  it('M: none of the generic message builders contain anything resembling private/internal data', () => {
    const messages = [buildAccessHelpMessage(), buildGeneralContactMessage()];
    for (const message of messages) {
      for (const pattern of PRIVATE_DATA_PATTERNS) {
        expect(message).not.toMatch(pattern);
      }
    }
  });

  it('N: product/book-specific messages only ever surface the name/title passed in, no other field', () => {
    const message = buildProductContactMessage({ name: 'Example Product' });
    for (const pattern of PRIVATE_DATA_PATTERNS) {
      expect(message).not.toMatch(pattern);
    }
  });
});
