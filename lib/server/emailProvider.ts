// Server-only email delivery abstraction (Prompt 46). No provider is
// installed or configured by this prompt — this file exists purely so
// lib/server/emailAuth.ts's request-link flow has one seam to call
// through, and a real provider (Resend, Postmark, SES, SMTP, ...) can be
// wired in later without touching any calling code. Never imported by any
// client component.

export interface MagicLinkEmail {
  email: string;
  loginUrl: string;
}

export interface EmailProvider {
  sendMagicLinkEmail(input: MagicLinkEmail): Promise<void>;
}

/** Thrown when production has no real provider configured. The request-
 * link route catches this specifically and returns a generic "sign-in is
 * temporarily unavailable" response — never a per-email error, so this
 * failure mode cannot be used to distinguish one email from another. */
export class EmailProviderNotConfiguredError extends Error {
  constructor() {
    super('No email provider is configured for production magic-link delivery.');
    this.name = 'EmailProviderNotConfiguredError';
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

/** Selects the provider for the current environment. Production with no
 * real provider configured throws EmailProviderNotConfiguredError rather
 * than silently falling back to logging a link nobody but the server
 * operator could see — that would be a broken (not "safe") production
 * experience, and this codebase's established convention (adminAuth.ts's
 * verifyAdminSecret, db.ts's getDb()) is to fail loudly and closed, never
 * silently degrade. No real provider is wired in by this prompt — see the
 * Prompt 46 report's "Email Provider" section. */
export function getEmailProvider(): EmailProvider {
  if (process.env.NODE_ENV === 'production') {
    // A real provider integration (Resend/Postmark/SES/SMTP/...) would be
    // selected here, gated on its own configuration being present. None is
    // configured yet, so production fails closed rather than pretending
    // delivery works.
    throw new EmailProviderNotConfiguredError();
  }
  return new ConsoleEmailProvider();
}
