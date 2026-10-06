// Resumable sign-in code screen (fixes: the code screen vanished on refresh or
// when the user switched to their email app and came back).
//
// WHAT IS REMEMBERED. After a code is requested, an HttpOnly, SameSite=Lax
// cookie records WHICH challenge this browser is waiting on:
//
//     <challengeId>.<expiresAtMs>.<base64url(normalizedEmail)>
//
// - challengeId is the random UUID of the email_verification_codes row —
//   opaque, unguessable, and unrelated to the code.
// - The code itself is NEVER in this cookie, in web storage, in a URL, or in
//   any response. It exists only in the email and, hashed, in the database.
// - The cookie is a hint for the UI, not a credential: reading it grants
//   nothing. Signing in still requires the code and goes through the unchanged
//   POST /api/auth/verify-code (single use, attempt limit, rate limits). A
//   forged or edited cookie can only change what the forger's own browser
//   displays.
// - It is bound to the browser that requested the code (HttpOnly cookie jar),
//   so one person's pending code is never shown on another browser.
//
// The state shown on return is read from the database (live / expired), so a
// newer code, a spent code or an expired code is reported truthfully. When a
// request was rate-limited no code row exists (the response must stay identical
// to a real send); the cookie then carries a random decoy id and the screen
// behaves the same until it "expires" on the same schedule.
import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import type { Db } from '../db';
import { normalizeEmail } from '../emailAuth';
import { CODE_TTL_MS, getChallengeState } from './emailCodes';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const PENDING_CHALLENGE_COOKIE = IS_PRODUCTION ? '__Host-tg_signin' : 'tg_signin';
/** Kept a little past the code's own life so the "Code expired" state can still
 * be shown after a refresh, then it disappears on its own. */
const COOKIE_MAX_AGE_SECONDS = Math.floor(CODE_TTL_MS / 1000) + 30 * 60;

export interface PendingChallenge {
  challengeId: string;
  expiresAt: number;
  email: string;
}

/** What the sign-in screen needs to resume. No code, no id. */
export interface ChallengeView {
  state: 'pending' | 'expired';
  email: string;
  expiresAt: number;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function encodePendingChallenge(challenge: PendingChallenge): string {
  return `${challenge.challengeId}.${Math.floor(challenge.expiresAt)}.${Buffer.from(challenge.email, 'utf8').toString('base64url')}`;
}

/** Strict parse; anything malformed is simply "no pending challenge". */
export function decodePendingChallenge(value: string | undefined | null): PendingChallenge | null {
  if (!value || value.length > 400) return null;
  const parts = value.split('.');
  if (parts.length !== 3) return null;
  const [challengeId, expiresRaw, emailB64] = parts;
  if (!UUID.test(challengeId) || !/^\d{10,16}$/.test(expiresRaw) || !/^[A-Za-z0-9_-]+$/.test(emailB64)) return null;
  const email = normalizeEmail(Buffer.from(emailB64, 'base64url').toString('utf8'));
  if (!email) return null;
  return { challengeId, expiresAt: Number(expiresRaw), email };
}

/** Resolves a cookie's challenge to what the screen should show. */
export async function resolveChallengeView(db: Db, pending: PendingChallenge, now: number = Date.now()): Promise<ChallengeView> {
  const found = await getChallengeState(db, pending.challengeId, pending.email, now);
  if (found.state === 'unknown') {
    // Decoy (rate-limited request) or a purged row: follow the cookie's own clock.
    return { state: pending.expiresAt > now ? 'pending' : 'expired', email: pending.email, expiresAt: pending.expiresAt };
  }
  return { state: found.state, email: pending.email, expiresAt: found.expiresAt };
}

function cookieOptions() {
  return { httpOnly: true, secure: IS_PRODUCTION, sameSite: 'lax' as const, path: '/', maxAge: COOKIE_MAX_AGE_SECONDS };
}

export function readPendingChallenge(): PendingChallenge | null {
  return decodePendingChallenge(cookies().get(PENDING_CHALLENGE_COOKIE)?.value);
}

/** Route Handlers / Server Actions only (writes a cookie). */
export function setPendingChallengeCookie(challenge: PendingChallenge): void {
  cookies().set(PENDING_CHALLENGE_COOKIE, encodePendingChallenge(challenge), cookieOptions());
}

/** A random id that matches no row — used when a request is rate-limited so the
 * response (including Set-Cookie) is indistinguishable from a real send. */
export function decoyChallenge(email: string, now: number = Date.now()): PendingChallenge {
  return { challengeId: randomUUID(), expiresAt: now + CODE_TTL_MS, email };
}

/** Expires the cookie with its original attributes (a __Host- delete without
 * Secure is ignored by browsers). */
export function clearPendingChallengeCookie(): void {
  cookies().set(PENDING_CHALLENGE_COOKIE, '', { ...cookieOptions(), maxAge: 0 });
}

/** Read-only: the challenge this browser is waiting on, for server rendering
 * the sign-in page and for GET /api/auth/challenge. Never writes. */
export async function getCurrentChallengeView(db: Db, now: number = Date.now()): Promise<ChallengeView | null> {
  const pending = readPendingChallenge();
  return pending ? resolveChallengeView(db, pending, now) : null;
}
