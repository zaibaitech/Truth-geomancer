// Book-owned casting authorization (Prompt 59).
//
// Pure decision layer: no database, no session, no network. The server
// wrapper (lib/server/raml/castingAccess.ts) supplies entitled/pending book
// ids from the EXISTING entitlements + payment_requests tables and then
// calls authorizeCastingIntention() — the one function every Cast API and
// the picker snapshot must share.
//
// Book ownership lives in methodOwnership.ts so questionCatalog can read
// sourceBook without importing this file (which depends on previewPolicy
// → products → methodPractice → catalog).
import { getBookById } from '@/content/books';
import { getIntentionById } from '@/content/intentions';
import { QUESTION_REGISTRY_META } from '@/lib/raml/questionRegistryMeta';
import { getQuestionAvailability, resolveEngineQuestionId } from '@/lib/raml/questionAvailability';
import { getPreviewPolicy } from './previewPolicy';
import {
  GENERAL_READING_INTENTION_ID,
  owningBookIdForIntention,
  questionIdForMethod,
  resolveCastingIntentionId,
} from './methodOwnership';

export {
  GENERAL_READING_BOOK_ID,
  GENERAL_READING_INTENTION_ID,
  owningBookIdForIntention,
  questionIdForMethod,
  resolveCastingIntentionId,
} from './methodOwnership';

export type CastingAccessState = 'free-sample' | 'unlocked' | 'pending' | 'locked';

/**
 * The one Cast-allowed unpaid method. Reuses the production Kanzul preview
 * target already chosen in previewPolicy.ts (Prompt 29 / Chapter 146,
 * `own-house-in-life-method-1`) — not a second, invented sample and not
 * "the first method in an array".
 */
export function getFreeCastingSample(): { bookId: string; methodId: string; questionId: string } | null {
  const policy = getPreviewPolicy('kanzul-mikban');
  if (!policy || !policy.preview.active || policy.preview.target.kind !== 'method') return null;
  const { bookId, methodId } = policy.preview.target;
  const questionId = questionIdForMethod(methodId);
  if (!questionId) return null;
  return { bookId, methodId, questionId };
}

export function isFreeCastingIntention(intentionId: string): boolean {
  const sample = getFreeCastingSample();
  if (!sample) return false;
  if (intentionId === sample.questionId || intentionId === sample.methodId) return true;
  const availability = getQuestionAvailability(intentionId);
  if (availability.kind === 'no-automatic-reading') return false;
  return resolveEngineQuestionId(intentionId) === sample.questionId;
}

export function canProceedToCast(accessState: CastingAccessState): boolean {
  return accessState === 'free-sample' || accessState === 'unlocked';
}

export interface QuestionCastingAccess {
  accessState: CastingAccessState;
  allowed: boolean;
  bookId: string | null;
  bookTitle: string | null;
  purchaseProductId: string | null;
}

export interface CastingAccessSnapshot {
  freeSampleIntentionId: string | null;
  freeSampleMethodId: string | null;
  byIntentionId: Record<string, QuestionCastingAccess>;
}

export function accessForIntention(snapshot: CastingAccessSnapshot, intentionId: string): QuestionCastingAccess {
  return (
    snapshot.byIntentionId[intentionId] ?? {
      accessState: 'locked',
      allowed: false,
      bookId: null,
      bookTitle: null,
      purchaseProductId: null,
    }
  );
}

export interface CastingAuthorization {
  allowed: boolean;
  reason: 'free-sample' | 'entitled' | 'unknown-intention' | 'missing-book' | 'pending' | 'locked';
  accessState: CastingAccessState;
  bookId: string | null;
  bookTitle: string | null;
  intentionId: string;
  methodId: string | null;
}

export function authorizeCastingIntention(
  intentionId: string,
  opts: { entitledBookIds: ReadonlySet<string>; pendingBookIds: ReadonlySet<string> },
): CastingAuthorization {
  const resolved = resolveCastingIntentionId(intentionId);
  const sample = getFreeCastingSample();
  const known =
    resolved === GENERAL_READING_INTENTION_ID ||
    !!getIntentionById(resolved) ||
    !!QUESTION_REGISTRY_META[resolved];

  if (!known) {
    return {
      allowed: false,
      reason: 'unknown-intention',
      accessState: 'locked',
      bookId: null,
      bookTitle: null,
      intentionId: resolved,
      methodId: null,
    };
  }

  const bookId = owningBookIdForIntention(resolved);
  const bookTitle = bookId ? (getBookById(bookId)?.title ?? null) : null;

  if (!bookId) {
    return {
      allowed: false,
      reason: 'missing-book',
      accessState: 'locked',
      bookId: null,
      bookTitle: null,
      intentionId: resolved,
      methodId: null,
    };
  }

  if (isFreeCastingIntention(resolved)) {
    return {
      allowed: true,
      reason: 'free-sample',
      accessState: 'free-sample',
      bookId,
      bookTitle,
      intentionId: resolved,
      methodId: sample?.methodId ?? null,
    };
  }

  if (opts.entitledBookIds.has(bookId)) {
    return {
      allowed: true,
      reason: 'entitled',
      accessState: 'unlocked',
      bookId,
      bookTitle,
      intentionId: resolved,
      methodId: null,
    };
  }

  if (opts.pendingBookIds.has(bookId)) {
    return {
      allowed: false,
      reason: 'pending',
      accessState: 'pending',
      bookId,
      bookTitle,
      intentionId: resolved,
      methodId: null,
    };
  }

  return {
    allowed: false,
    reason: 'locked',
    accessState: 'locked',
    bookId,
    bookTitle,
    intentionId: resolved,
    methodId: null,
  };
}
