import { NextResponse } from 'next/server';
import { BOOKS } from '@/content/books';
import { requirePlatformAdmin, type PlatformAdminActor } from '@/lib/server/adminActor';
import { isSameOriginRequest } from '@/lib/server/auth/requestGuards';
import { getDb } from '@/lib/server/db';
import {
  assignBookToAuthor,
  findVerifiedUserByEmail,
  grantStaffRole,
  listStaff,
  revokeStaffRole,
  unassignBookFromAuthor,
  type StaffMutationError,
} from '@/lib/server/staffAdmin';

// Staff management — PLATFORM ADMINS ONLY (or the break-glass session).
//
// Authorization comes solely from requirePlatformAdmin() (session cookie +
// staff_roles). The request body only says WHICH person and WHICH book an
// action applies to; it can never carry authority. Every target is validated
// server-side in lib/server/staffAdmin.ts (verified user, known role, known
// book, active author role for assignments). `granted_by` is the acting
// admin's own user id, never a client value.
const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store' };

const ERRORS: Record<StaffMutationError, { status: number; message: string }> = {
  'invalid-email': { status: 400, message: 'Enter a valid email address.' },
  'no-verified-user': { status: 404, message: 'No signed-in account uses that email. Ask them to sign in once first.' },
  'ambiguous-email': { status: 409, message: 'More than one account uses that email — this needs manual review.' },
  'unknown-user': { status: 404, message: 'That account does not exist.' },
  'not-verified': { status: 409, message: 'That account has no verified email and cannot be staff.' },
  'invalid-role': { status: 400, message: 'Unknown role.' },
  'unknown-book': { status: 400, message: 'Unknown book.' },
  'not-an-author': { status: 409, message: 'Books can only be assigned to someone with the Author role.' },
  'no-active-role': { status: 404, message: 'That account has no active staff role.' },
  'no-active-assignment': { status: 404, message: 'That book is not assigned to this author.' },
  'cannot-revoke-self': { status: 409, message: 'You cannot remove your own platform admin role.' },
};

function forbidden() {
  return NextResponse.json({ error: 'Not authorized.' }, { status: 403, headers: NO_STORE_HEADERS });
}

function grantedBy(actor: PlatformAdminActor): string {
  return actor.kind === 'platform-admin' ? actor.userId : 'break-glass';
}

export async function GET() {
  if (!(await requirePlatformAdmin())) return forbidden();
  const staff = await listStaff(getDb());
  return NextResponse.json(
    { staff, books: BOOKS.map((b) => ({ id: b.id, title: b.title })) },
    { headers: NO_STORE_HEADERS },
  );
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return forbidden();
  const actor = await requirePlatformAdmin();
  if (!actor) return forbidden();

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (typeof parsed !== 'object' || parsed === null) throw new Error('not an object');
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const db = getDb();
  const userId = typeof body.userId === 'string' ? body.userId : '';
  let result;
  switch (body.action) {
    case 'grant-role': {
      const target = await findVerifiedUserByEmail(db, typeof body.email === 'string' ? body.email : '');
      result = target.ok ? await grantStaffRole(db, { targetUserId: target.userId, role: body.role, grantedBy: grantedBy(actor) }) : target;
      break;
    }
    case 'revoke-role':
      result = await revokeStaffRole(db, { targetUserId: userId, actingUserId: actor.userId });
      break;
    case 'assign-book':
      result = await assignBookToAuthor(db, { targetUserId: userId, bookId: body.bookId, grantedBy: grantedBy(actor) });
      break;
    case 'unassign-book':
      result = await unassignBookFromAuthor(db, { targetUserId: userId, bookId: body.bookId });
      break;
    default:
      return NextResponse.json({ error: 'Unknown action.' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  if (!result.ok) {
    const { status, message } = ERRORS[result.reason];
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS });
  }
  return NextResponse.json({ ok: true, staff: await listStaff(db) }, { headers: NO_STORE_HEADERS });
}
