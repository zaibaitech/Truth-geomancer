// Tests for the Paystack REST client and webhook signature verification.
// Real crypto, real independently-computed HMACs — never a mock of the
// comparison itself, matching this codebase's own security.test.ts/
// adminAuth.test.ts precedent of testing the actual cryptographic logic
// rather than stubbing around it.
import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { verifyWebhookSignature, newReference, PaystackConfigError } from './paystack';

const ORIGINAL_SECRET = process.env.PAYSTACK_SECRET_KEY;
afterEach(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.PAYSTACK_SECRET_KEY;
  else process.env.PAYSTACK_SECRET_KEY = ORIGINAL_SECRET;
});

describe('webhook signature verification', () => {
  const body = JSON.stringify({ event: 'charge.success', data: { reference: 'tg_abc_123' } });

  function signatureFor(raw: string, key: string): string {
    return createHmac('sha512', key).update(raw, 'utf8').digest('hex');
  }

  it('accepts a correctly signed body', () => {
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_fixture_key';
    expect(verifyWebhookSignature(body, signatureFor(body, 'sk_test_fixture_key'))).toBe(true);
  });

  it('rejects a body altered after signing', () => {
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_fixture_key';
    const signature = signatureFor(body, 'sk_test_fixture_key');
    const tampered = body.replace('tg_abc_123', 'tg_xyz_999');
    expect(verifyWebhookSignature(tampered, signature)).toBe(false);
  });

  it('rejects a signature made with the wrong key', () => {
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_fixture_key';
    expect(verifyWebhookSignature(body, signatureFor(body, 'sk_test_someone_elses_key'))).toBe(false);
  });

  it('rejects a missing, empty, or wrong-length signature without throwing', () => {
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_fixture_key';
    expect(verifyWebhookSignature(body, null)).toBe(false);
    expect(verifyWebhookSignature(body, '')).toBe(false);
    expect(() => verifyWebhookSignature(body, 'deadbeef')).not.toThrow();
    expect(verifyWebhookSignature(body, 'deadbeef')).toBe(false);
  });

  it('fails closed with a clear error when PAYSTACK_SECRET_KEY is unset, never a default secret', () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    expect(() => verifyWebhookSignature(body, signatureFor(body, 'anything'))).toThrow(PaystackConfigError);
  });
});

describe('purchase references', () => {
  it('are unique, prefixed, and free of characters that need escaping', () => {
    const a = newReference('kanzul-mikban');
    const b = newReference('kanzul-mikban');
    expect(a).not.toBe(b);
    expect(a.startsWith('tg_kanzul-mikban_')).toBe(true);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(a.length).toBeGreaterThan(40);
  });

  it('keeps an awkward product id from leaking punctuation into the reference', () => {
    expect(newReference('a product/with..odd chars!')).toMatch(/^tg_[A-Za-z0-9_-]+$/);
  });
});
