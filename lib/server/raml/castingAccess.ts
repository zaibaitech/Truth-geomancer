// Server composition for Cast authorization (Prompt 59).
//
// Adds no access RULE of its own — entitled books come from the existing
// canAccessBook()/entitlements path, pending books from existing
// payment_requests, and the yes/no decision is authorizeCastingIntention()
// in lib/access/castingAuthorization.ts. The geomancy engine is never
// imported here.
import { getBookById } from '@/content/books';
import { PRODUCT_CATALOGUE } from '@/lib/access/products';
import { canAccessBook } from '@/lib/access/access';
import {
  authorizeCastingIntention,
  canProceedToCast,
  getFreeCastingSample,
  type CastingAccessSnapshot,
  type CastingAuthorization,
  type QuestionCastingAccess,
  GENERAL_READING_INTENTION_ID,
} from '@/lib/access/castingAuthorization';
import { QUESTION_CATALOG } from '@/lib/raml/questionCatalog';
import { getAccessContextForUser } from '../accessService';
import { getPaymentRequestsForUser } from '../paymentRequests';
import type { Db } from '../db';

export type { CastingAccessSnapshot, CastingAuthorization, QuestionCastingAccess };

function purchaseProductIdForBook(bookId: string | null): string | null {
  if (!bookId) return null;
  if (PRODUCT_CATALOGUE.some((product) => product.id === bookId && product.active)) return bookId;
  const grantor = PRODUCT_CATALOGUE.find(
    (product) => product.active && product.entitlementGrants.some((grant) => grant.kind === 'book' && grant.bookId === bookId),
  );
  return grantor?.id ?? null;
}

function toQuestionAccess(authz: CastingAuthorization): QuestionCastingAccess {
  return {
    accessState: authz.accessState,
    allowed: authz.allowed && canProceedToCast(authz.accessState),
    bookId: authz.bookId,
    bookTitle: authz.bookTitle ?? (authz.bookId ? getBookById(authz.bookId)?.title ?? null : null),
    purchaseProductId: purchaseProductIdForBook(authz.bookId),
  };
}

/**
 * Books this user currently has an ACTIVE entitlement for, derived from the
 * live product catalogue's BookGrants — never a hard-coded book list.
 */
export async function entitledBookIdsForUser(db: Db, userId: string): Promise<Set<string>> {
  const ctx = await getAccessContextForUser(db, userId);
  const ids = new Set<string>();
  for (const product of ctx.products) {
    for (const grant of product.entitlementGrants) {
      if (grant.kind === 'book' && canAccessBook(ctx, grant.bookId)) ids.add(grant.bookId);
    }
  }
  return ids;
}

/**
 * Books whose access is awaiting admin approval, from pending payment
 * requests for any product that grants that book (standalone or bundle).
 * An already-entitled book is never marked pending.
 */
export async function pendingBookIdsForUser(db: Db, userId: string, entitled: ReadonlySet<string>): Promise<Set<string>> {
  const pending = new Set<string>();
  const requests = await getPaymentRequestsForUser(db, userId);
  for (const request of requests) {
    if (request.status !== 'pending') continue;
    const product = PRODUCT_CATALOGUE.find((item) => item.id === request.productId);
    if (!product) continue;
    for (const grant of product.entitlementGrants) {
      if (grant.kind === 'book' && !entitled.has(grant.bookId)) pending.add(grant.bookId);
    }
  }
  return pending;
}

export async function authorizeCastingForUser(db: Db, userId: string | null, intentionId: string): Promise<CastingAuthorization> {
  const entitledBookIds = userId ? await entitledBookIdsForUser(db, userId) : new Set<string>();
  const pendingBookIds = userId ? await pendingBookIdsForUser(db, userId, entitledBookIds) : new Set<string>();
  return authorizeCastingIntention(intentionId, { entitledBookIds, pendingBookIds });
}

export async function getCastingAccessSnapshot(db: Db, userId: string | null): Promise<CastingAccessSnapshot> {
  const entitledBookIds = userId ? await entitledBookIdsForUser(db, userId) : new Set<string>();
  const pendingBookIds = userId ? await pendingBookIdsForUser(db, userId, entitledBookIds) : new Set<string>();
  const opts = { entitledBookIds, pendingBookIds };
  const sample = getFreeCastingSample();

  const byIntentionId: Record<string, QuestionCastingAccess> = {};
  byIntentionId[GENERAL_READING_INTENTION_ID] = toQuestionAccess(
    authorizeCastingIntention(GENERAL_READING_INTENTION_ID, opts),
  );
  for (const entry of QUESTION_CATALOG) {
    byIntentionId[entry.id] = toQuestionAccess(authorizeCastingIntention(entry.id, opts));
  }

  return {
    freeSampleIntentionId: sample?.questionId ?? null,
    freeSampleMethodId: sample?.methodId ?? null,
    byIntentionId,
  };
}
