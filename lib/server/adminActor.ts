// The ONE place that decides who may use the admin area, and with what
// authority. Every admin page and admin API route calls getAdminActor() (or
// requirePlatformAdmin()) — never a role from a request body, query, header
// or the UI.
//
//   platform admin  signed-in verified user with an active platform_admin role
//   break-glass     the legacy TG_ADMIN_SECRET session (transition only)
//   author          signed-in verified user with an active author role;
//                   scoped to their assigned books, no payment authority
//   (none)          everyone else — customers and anonymous visitors
//
// Platform admin and break-glass have the same platform-wide authority.
import { BOOKS } from '@/content/books';
import { isBreakGlassAdminSession } from './adminSession';
import { getDb } from './db';
import { getCurrentUserIfPresent } from './session';
import { getStaffAccess, staffBookIds } from './staff';
import type { Db } from './db';

/** The reviewer recorded on requests approved/rejected via break-glass —
 * the same literal historical records already use. */
export const BREAK_GLASS_REVIEWER_ID = 'admin';

export type PlatformAdminActor =
  | { kind: 'platform-admin'; userId: string; reviewerId: string; bookIds: string[] }
  | { kind: 'break-glass'; userId: null; reviewerId: typeof BREAK_GLASS_REVIEWER_ID; bookIds: string[] };
export type AuthorActor = { kind: 'author'; userId: string; bookIds: string[] };
export type AdminActor = PlatformAdminActor | AuthorActor;

/** Pure resolution, given the session's user id (or null) and whether a valid
 * break-glass session is present. Exported for tests. */
export async function resolveAdminActor(db: Db, userId: string | null, breakGlass: boolean): Promise<AdminActor | null> {
  const staff = userId ? await getStaffAccess(db, userId) : null;
  if (userId && staff?.role === 'platform_admin') {
    return { kind: 'platform-admin', userId, reviewerId: userId, bookIds: staffBookIds(staff) };
  }
  if (breakGlass) {
    return { kind: 'break-glass', userId: null, reviewerId: BREAK_GLASS_REVIEWER_ID, bookIds: BOOKS.map((b) => b.id) };
  }
  if (userId && staff?.role === 'author') {
    return { kind: 'author', userId, bookIds: staffBookIds(staff) };
  }
  return null;
}

/** The current request's admin actor, from the session cookie(s) only. */
export async function getAdminActor(): Promise<AdminActor | null> {
  const user = await getCurrentUserIfPresent();
  return resolveAdminActor(getDb(), user?.id ?? null, await isBreakGlassAdminSession());
}

export function isPlatformAdminActor(actor: AdminActor | null): actor is PlatformAdminActor {
  return actor !== null && (actor.kind === 'platform-admin' || actor.kind === 'break-glass');
}

/** The current actor if (and only if) they have platform-wide authority. */
export async function requirePlatformAdmin(): Promise<PlatformAdminActor | null> {
  const actor = await getAdminActor();
  return isPlatformAdminActor(actor) ? actor : null;
}
