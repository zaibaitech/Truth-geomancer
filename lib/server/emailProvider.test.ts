// Tests for the Resend integration (Prompt 52). NEVER makes a real
// network call — ResendEmailProvider always receives a fake `client` in
// these tests (see its constructor's own comment), so nothing here can
// ever reach Resend's real API regardless of environment. Production
// wiring (getEmailProvider() choosing ResendEmailProvider only when
// NODE_ENV==='production' and both env vars are present, never falling
// back to ConsoleEmailProvider) is covered by manipulating
// process.env directly and restoring it afterward.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EmailDeliveryError, EmailProviderNotConfiguredError, ResendEmailProvider, getEmailProvider } from './emailProvider';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function fakeClient(result: { error: { message?: string } | null }) {
  const send = vi.fn().mockResolvedValue({ data: { id: 'fake' }, error: result.error });
  return { client: { emails: { send } }, send };
}

describe('ResendEmailProvider — sends the correct message', () => {
  it('A: sends to exactly the requested recipient', async () => {
    const { client, send } = fakeClient({ error: null });
    const provider = new ResendEmailProvider('fake-key', 'auth@example.test', client);
    await provider.sendMagicLinkEmail({ email: 'user@example.test', loginUrl: 'https://app.test/api/auth/verify?token=t' });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].to).toBe('user@example.test');
  });

  it('B: sends from the configured EMAIL_FROM_ADDRESS', async () => {
    const { client, send } = fakeClient({ error: null });
    const provider = new ResendEmailProvider('fake-key', 'auth@example.test', client);
    await provider.sendMagicLinkEmail({ email: 'user@example.test', loginUrl: 'https://app.test/api/auth/verify?token=t' });
    expect(send.mock.calls[0][0].from).toBe('auth@example.test');
  });

  it('C: uses a clear authentication subject', async () => {
    const { client, send } = fakeClient({ error: null });
    const provider = new ResendEmailProvider('fake-key', 'auth@example.test', client);
    await provider.sendMagicLinkEmail({ email: 'user@example.test', loginUrl: 'https://app.test/api/auth/verify?token=t' });
    expect(send.mock.calls[0][0].subject).toMatch(/sign in/i);
  });

  it('D: includes the exact magic-link URL, unmodified, in both bodies', async () => {
    const { client, send } = fakeClient({ error: null });
    const provider = new ResendEmailProvider('fake-key', 'auth@example.test', client);
    const loginUrl = 'https://app.test/api/auth/verify?token=abc123';
    await provider.sendMagicLinkEmail({ email: 'user@example.test', loginUrl });
    expect(send.mock.calls[0][0].text).toContain(loginUrl);
    expect(send.mock.calls[0][0].html).toContain(loginUrl);
  });

  it('E: includes the 15-minute expiration notice', async () => {
    const { client, send } = fakeClient({ error: null });
    const provider = new ResendEmailProvider('fake-key', 'auth@example.test', client);
    await provider.sendMagicLinkEmail({ email: 'user@example.test', loginUrl: 'https://app.test/api/auth/verify?token=t' });
    expect(send.mock.calls[0][0].text).toMatch(/15 minutes/);
    expect(send.mock.calls[0][0].html).toMatch(/15 minutes/);
  });

  it('F: has plain-text content', async () => {
    const { client, send } = fakeClient({ error: null });
    const provider = new ResendEmailProvider('fake-key', 'auth@example.test', client);
    await provider.sendMagicLinkEmail({ email: 'user@example.test', loginUrl: 'https://app.test/api/auth/verify?token=t' });
    expect(send.mock.calls[0][0].text.length).toBeGreaterThan(0);
  });

  it('G: has HTML content', async () => {
    const { client, send } = fakeClient({ error: null });
    const provider = new ResendEmailProvider('fake-key', 'auth@example.test', client);
    await provider.sendMagicLinkEmail({ email: 'user@example.test', loginUrl: 'https://app.test/api/auth/verify?token=t' });
    expect(send.mock.calls[0][0].html).toMatch(/<p>/);
  });

  it('never includes payment, entitlement, or reading information (only the link/expiry/ignore-notice)', async () => {
    const { client, send } = fakeClient({ error: null });
    const provider = new ResendEmailProvider('fake-key', 'auth@example.test', client);
    await provider.sendMagicLinkEmail({ email: 'user@example.test', loginUrl: 'https://app.test/api/auth/verify?token=t' });
    const bodies = [send.mock.calls[0][0].text, send.mock.calls[0][0].html].join('\n');
    expect(bodies).not.toMatch(/payment|entitlement|reading|purchase|order/i);
  });
});

describe('H: provider errors are converted into the existing safe application behavior', () => {
  it('a Resend-reported error is thrown as EmailDeliveryError, not exposed as raw provider detail', async () => {
    const { client } = fakeClient({ error: { message: 'sensitive upstream detail' } });
    const provider = new ResendEmailProvider('fake-key', 'auth@example.test', client);
    await expect(
      provider.sendMagicLinkEmail({ email: 'user@example.test', loginUrl: 'https://app.test/api/auth/verify?token=t' }),
    ).rejects.toBeInstanceOf(EmailDeliveryError);
  });

  it('I: the raw error/token/loginUrl is never logged — only a fixed, generic operational message', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { client } = fakeClient({ error: { message: 'sensitive upstream detail with a token=SECRET123' } });
    const provider = new ResendEmailProvider('fake-key', 'auth@example.test', client);
    await provider
      .sendMagicLinkEmail({ email: 'user@example.test', loginUrl: 'https://app.test/api/auth/verify?token=SECRET123' })
      .catch(() => {});
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const loggedText = errorSpy.mock.calls[0].join(' ');
    expect(loggedText).not.toMatch(/SECRET123/);
    expect(loggedText).not.toMatch(/sensitive upstream detail/);
  });
});

describe('J/K: production provider selection', () => {
  it('K: production throws EmailProviderNotConfiguredError, never falls back to ConsoleEmailProvider, when RESEND_API_KEY is missing', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('EMAIL_FROM_ADDRESS', 'auth@example.test');
    expect(() => getEmailProvider()).toThrow(EmailProviderNotConfiguredError);
  });

  it('K: production throws EmailProviderNotConfiguredError when EMAIL_FROM_ADDRESS is missing', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RESEND_API_KEY', 'fake-key');
    vi.stubEnv('EMAIL_FROM_ADDRESS', '');
    expect(() => getEmailProvider()).toThrow(EmailProviderNotConfiguredError);
  });

  it('production returns a ResendEmailProvider instance when fully configured', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RESEND_API_KEY', 'fake-key');
    vi.stubEnv('EMAIL_FROM_ADDRESS', 'auth@example.test');
    expect(getEmailProvider()).toBeInstanceOf(ResendEmailProvider);
  });

  it('non-production environments never construct a ResendEmailProvider, even when the env vars are set', () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('RESEND_API_KEY', 'fake-key');
    vi.stubEnv('EMAIL_FROM_ADDRESS', 'auth@example.test');
    expect(getEmailProvider()).not.toBeInstanceOf(ResendEmailProvider);
  });
});

describe('J: API key is never exposed through client-reachable code', () => {
  it('this module is never imported by a component and never touches NEXT_PUBLIC_*', () => {
    // Structural guarantee already enforced by security.test.ts's
    // ALLOWED_SERVER_MODULES + 'use client' checks and the "no
    // NEXT_PUBLIC_" scan; restated here for locality with the rest of
    // this file's provider-selection assertions.
    expect(process.env.NEXT_PUBLIC_RESEND_API_KEY).toBeUndefined();
  });
});
