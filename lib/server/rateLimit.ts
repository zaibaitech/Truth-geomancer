// Server-only rate-limit abstraction (Prompt 46). Defines the interface
// lib/server/emailAuth.ts's request-link/verify flows call through, and a
// clearly-labeled, NON-production-grade in-memory implementation for
// local dev/tests. Nothing here is wired to production traffic decisions
// beyond "the interface exists and is called" — see the required-limits
// documentation and the production caveat below before this is relied on
// for a real launch.
//
// Required limits for production (not implemented by this prompt):
//   - requests per email:      a small number (e.g. 3-5) per rolling hour,
//                               independent of IP, so an attacker cannot
//                               spam a victim's inbox from many IPs.
//   - requests per IP:         a small number (e.g. 10-20) per rolling
//                               hour, independent of email, so a single
//                               source cannot enumerate many emails.
//   - verification attempts:   a token is already single-use (see
//                               emailAuth.ts's atomic consume), which
//                               caps guessing to one try per token by
//                               construction; a request-rate limit on the
//                               verify endpoint itself (e.g. per IP) is
//                               still worth adding to slow brute-forcing
//                               of the 256-bit token space, though that
//                               space is large enough that this is
//                               defense-in-depth, not the primary control.
export interface RateLimiter {
  /** Returns true if `key` is currently allowed to proceed, and records
   * this attempt toward the limit either way (an attempt that is refused
   * still counts, so retries cannot reset the window). */
  check(key: string): Promise<boolean>;
}

/**
 * NOT PRODUCTION-GRADE. This codebase deploys to Vercel serverless
 * functions, where each invocation may run in a fresh, isolated process
 * with no shared memory across instances (and even a "warm" instance's
 * in-memory state is reset on redeploy or eventually recycled) — an
 * in-memory counter here only limits requests that happen to land on the
 * exact same warm instance, which is not a real guarantee under real
 * traffic or a genuine attack. A production launch needs a shared,
 * persistent store (e.g. a Postgres-backed counter table using this same
 * codebase's existing Db/transaction() pattern, or a dedicated rate-limit
 * service) — this class exists only so local dev/tests have a working
 * implementation of the RateLimiter interface to call, not as a
 * production control.
 */
export class InMemoryRateLimiter implements RateLimiter {
  private readonly attempts = new Map<string, number[]>();

  constructor(
    private readonly maxAttempts: number,
    private readonly windowMs: number,
  ) {}

  async check(key: string): Promise<boolean> {
    const now = Date.now();
    const existing = (this.attempts.get(key) ?? []).filter((t) => now - t < this.windowMs);
    existing.push(now);
    this.attempts.set(key, existing);
    return existing.length <= this.maxAttempts;
  }
}
