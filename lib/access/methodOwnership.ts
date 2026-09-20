// Book ownership of Cast targets (Prompt 59).
//
// Isolated from previewPolicy / products so questionCatalog can read
// sourceBook without a cycle (catalog ← products ← previewPolicy).
import { getIntentionById } from '@/content/intentions';
import { KM_CHAPTER_META } from '@/content/manuscripts/kanzulMikbanMeta';
import { QUESTION_REGISTRY_META } from '@/lib/raml/questionRegistryMeta';
import { getQuestionAvailability, resolveEngineQuestionId } from '@/lib/raml/questionAvailability';

export const GENERAL_READING_INTENTION_ID = 'general';

/** Existing product attribution: the non-chapter "general reading" is the
 * Master of Geomancy chart overview (CastingFlow source line, intentions.ts
 * comment). Not a MethodDefinition — there is no SourceRef.book to read. */
export const GENERAL_READING_BOOK_ID = 'master-of-geomancy-vol-1';

export function questionIdForMethod(methodId: string): string | null {
  for (const question of Object.values(QUESTION_REGISTRY_META)) {
    if (question.methods.some((method) => method.id === methodId)) return question.id;
  }
  return null;
}

/** The book that owns this Cast target, or null when ownership cannot be
 * established from authoritative data. Callers must fail closed on null. */
export function owningBookIdForIntention(intentionId: string): string | null {
  if (intentionId === GENERAL_READING_INTENTION_ID) return GENERAL_READING_BOOK_ID;

  const availability = getQuestionAvailability(intentionId);
  const engineQuestionId =
    availability.kind === 'no-automatic-reading' ? null : resolveEngineQuestionId(intentionId);
  const meta = engineQuestionId ? QUESTION_REGISTRY_META[engineQuestionId] : undefined;

  if (meta && meta.methods.length > 0) {
    const books = new Set(meta.methods.map((method) => method.sourceBook));
    if (books.size !== 1) return null;
    return Array.from(books)[0];
  }

  const chapterIds = new Set<string>();
  if (KM_CHAPTER_META.some((chapter) => chapter.id === intentionId)) chapterIds.add(intentionId);
  const intention = getIntentionById(intentionId);
  for (const chapterId of intention?.chapterIds ?? []) chapterIds.add(chapterId);

  if (chapterIds.size === 0) return null;
  const allKanzul = Array.from(chapterIds).every((id) => KM_CHAPTER_META.some((chapter) => chapter.id === id));
  return allKanzul ? 'kanzul-mikban' : null;
}

/** Map a caller-supplied id (question, consolidated duplicate, or method id)
 * onto the intention/question the engine actually runs. Unknown values are
 * returned unchanged so authorizeCastingIntention can fail closed. */
export function resolveCastingIntentionId(raw: string): string {
  if (raw === GENERAL_READING_INTENTION_ID) return raw;
  if (getIntentionById(raw)) return raw;
  if (QUESTION_REGISTRY_META[raw]) return raw;
  return questionIdForMethod(raw) ?? raw;
}
