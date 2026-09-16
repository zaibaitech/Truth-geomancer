// Server-only email delivery abstraction (Prompt 46; real production
// provider — Resend — wired in by Prompt 52 per the Prompt 51 architecture
// audit's factual comparison). lib/server/emailAuth.ts's request-link flow
// calls through this one seam only; it never knows which concrete
// provider is behind getEmailProvider(). Never imported by any client
// component.
import { Resend } from 'resend';

export interface MagicLinkEmail {
  email: string;
  loginUrl: string;
}

export interface EmailProvider {
  sendMagicLinkEmail(input: MagicLinkEmail): Promise<void>;
}

/** Thrown when production has no real provider configured (RESEND_API_KEY
 * and/or EMAIL_FROM_ADDRESS missing). The request-link route catches this
 * specifically and returns a generic "sign-in is temporarily unavailable"
 * response — never a per-email error, so this failure mode cannot be used
 * to distinguish one email from another. */
export class EmailProviderNotConfiguredError extends Error {
  constructor() {
    super('No email provider is configured for production magic-link delivery.');
    this.name = 'EmailProviderNotConfiguredError';
  }
}

/** Thrown when a configured provider was actually called but reported a
 * delivery failure (a rejected send, a network/API error). Kept distinct
 * from EmailProviderNotConfiguredError only for the difference in log
 * intent (this class's throw site is where the sanitized operational log
 * line is written — see ResendEmailProvider below); the request-link
 * route deliberately maps both to the exact same generic response. */
export class EmailDeliveryError extends Error {
  constructor() {
    super('The email provider failed to deliver the message.');
    this.name = 'EmailDeliveryError';
  }
}

/** Development/test provider: never sends a real email, never touches the
 * network, and — critically — never returns the link or token to an HTTP
 * response. It only writes to the server's own process log, which is
 * exactly as safe as this codebase's existing pattern of a developer
 * reading their own `next dev` terminal output; nothing client-reachable
 * ever sees it. This is what request-link uses whenever NODE_ENV is not
 * 'production', regardless of whether a real provider will eventually
 * also be configured for production. */
class ConsoleEmailProvider implements EmailProvider {
  async sendMagicLinkEmail({ email, loginUrl }: MagicLinkEmail): Promise<void> {
    // Deliberately console.log, not console.error/warn — this is expected,
    // routine dev-mode output, not a problem condition.
    // eslint-disable-next-line no-console
    console.log(`[dev email] magic link for ${email}: ${loginUrl}`);
  }
}

/** The subset of the Resend SDK's client this file actually calls —
 * narrowed to exactly one method so tests can inject a fake client that
 * never touches the network (Prompt 52 §10: "NEVER make real Resend
 * network calls during tests") without needing to construct or mock the
 * real `Resend` class at all. */
interface ResendLikeClient {
  emails: {
    send(payload: { from: string; to: string; subject: string; text: string; html: string }): Promise<{
      data: unknown;
      error: { message?: string } | null;
    }>;
  };
}

function buildPlainTextBody(loginUrl: string): string {
  return [
    'Use this link to sign in to Truth Geomancer:',
    '',
    loginUrl,
    '',
    'This link expires in 15 minutes.',
    "If you didn't request this, you can safely ignore this email.",
  ].join('\n');
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildHtmlBody(loginUrl: string): string {
  const escapedUrl = escapeHtml(loginUrl);
  return [
    '<p>Use this link to sign in to Truth Geomancer:</p>',
    `<p><a href="${escapedUrl}">${escapedUrl}</a></p>`,
    '<p>This link expires in 15 minutes.</p>',
    "<p>If you didn't request this, you can safely ignore this email.</p>",
  ].join('');
}

/**
 * Production email delivery via Resend (Prompt 52). Deliberately contains
 * every piece of Resend-specific knowledge in this codebase — the subject
 * line, the from-address wiring, the plain-text/HTML bodies, and the
 * client call itself — so lib/server/emailAuth.ts and every route handler
 * stay entirely provider-agnostic (Prompt 52 §2's explicit requirement).
 *
 * No click-tracking/link-rewriting is introduced here: this calls
 * Resend's transactional send API directly with the exact `loginUrl`
 * emailAuth.ts constructed (which already points straight at
 * `${APP_BASE_URL}/api/auth/verify?token=...`) — nothing in this class
 * rewrites, shortens, or proxies that URL (Prompt 52 §7). Resend does not
 * rewrite links by default; if a future change to the Resend account's
 * own dashboard settings enables click tracking, that is an operator
 * configuration matter to verify in the Resend console, not something
 * this code can or should compensate for.
 */
export class ResendEmailProvider implements EmailProvider {
  private readonly client: ResendLikeClient;
  private readonly fromAddress: string;

  /** `client` is only ever passed explicitly by tests — production
   * construction (via getEmailProvider() below) always omits it and gets
   * a real `Resend` SDK instance. */
  constructor(apiKey: string, fromAddress: string, client?: ResendLikeClient) {
    this.client = client ?? new Resend(apiKey);
    this.fromAddress = fromAddress;
  }

  async sendMagicLinkEmail({ email, loginUrl }: MagicLinkEmail): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.fromAddress,
      // Sent only to the requested address — never cc/bcc, never a
      // batch/list send (Prompt 52 §6's "send only to the requested
      // email").
      to: email,
      subject: 'Sign in to Truth Geomancer',
      text: buildPlainTextBody(loginUrl),
      html: buildHtmlBody(loginUrl),
    });
    if (error) {
      // Deliberately logs NEITHER `error` (may embed Resend's own request
      // detail) NOR `email`/`loginUrl`/the token — only that a delivery
      // failed, so an operator can see "Resend is failing" in Vercel's
      // runtime logs without any per-message secret or address ever
      // reaching them (Prompt 52 §9's explicit logging prohibitions).
      // eslint-disable-next-line no-console
      console.error('[email] Resend reported a delivery failure.');
      throw new EmailDeliveryError();
    }
  }
}

/** Selects the provider for the current environment.
 *
 * Production: uses ResendEmailProvider when BOTH RESEND_API_KEY and
 * EMAIL_FROM_ADDRESS are set; otherwise throws
 * EmailProviderNotConfiguredError. Production NEVER falls back to
 * ConsoleEmailProvider — that would silently degrade a real user-facing
 * feature into one that only logs to a server terminal nobody is
 * watching, which this codebase's established convention (adminAuth.ts's
 * verifyAdminSecret, db.ts's getDb()) treats as a bug, not a safe
 * fallback: fail loudly and closed instead (Prompt 52 §5's explicit
 * "critical security requirement").
 *
 * Development/test: always ConsoleEmailProvider, exactly as before this
 * prompt — never reachable once NODE_ENV is 'production'.
 */
export function getEmailProvider(): EmailProvider {
  if (process.env.NODE_ENV === 'production') {
    const apiKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.EMAIL_FROM_ADDRESS;
    if (!apiKey || !fromAddress) {
      throw new EmailProviderNotConfiguredError();
    }
    return new ResendEmailProvider(apiKey, fromAddress);
  }
  return new ConsoleEmailProvider();
}
