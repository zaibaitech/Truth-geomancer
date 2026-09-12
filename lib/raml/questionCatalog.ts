// The product catalogue (Prompt 15).
//
// Everything a browsing user needs about a question — in ordinary language —
// derived at module load from what already exists: the picker's intention
// list, the engine's registered questions, the manuscript's chapter numbers,
// and the availability layer built in Prompt 14. It holds no geomantic rule
// and computes no verdict; it decides only how a question is *presented and
// found*, never what it means.
//
// The one thing it adds that nothing else had: a plain-language title. The
// picker has always shown the manuscript's own chapter heading ("If You Want
// to Know If You Will Get Money Today or Not"), while the engine has always
// carried a short question for the same chapter ("Will I get money today?").
// The short one is the product's, the long one is the book's — both are kept,
// neither is invented here.
import { CATEGORIES, INTENTIONS, type CategoryId } from '@/content/intentions';
import { KM_CHAPTERS } from '@/content/manuscripts/kanzul-mikban';
import { QUESTION_REGISTRY } from './engine/questions';
import { getQuestionAvailability, resolveEngineQuestionId, type QuestionAvailability } from './questionAvailability';

export interface CatalogEntry {
  /** The intention id the picker selects — unchanged from before. */
  id: string;
  /** Plain-language question, from the engine's own definition where one
   * exists; otherwise the manuscript's chapter heading. */
  title: string;
  /** The manuscript's own heading, always kept as supporting information. */
  sourceTitle: string;
  /** Whether `title` is the engine's short question or just the heading
   * repeated — the card hides the second line when they are the same text. */
  hasShortTitle: boolean;
  categoryId: CategoryId | null;
  categoryLabel: string | null;
  /** Product tags: the primary category first, then any further category a
   * token in this question's own wording genuinely places it under. Tags are
   * for browsing and search only. */
  tags: CategoryId[];
  chapterNumber: number | null;
  availability: QuestionAvailability;
  /** The registered question actually run for this entry, if any. */
  engineQuestionId: string | null;
  /** How many methods the book gives for it, and how many of those the
   * surviving source fully defines. Both 0 when there is no engine question. */
  methodCount: number;
  verifiedMethodCount: number;
  /** Lowercased text the search matches against. */
  haystack: string;
}

// A token found in a question's OWN wording places it under a further
// category. Nothing is inferred from the geomancy — only from the words the
// question already uses — and the primary category is never replaced.
const TAG_TOKENS: { category: CategoryId; pattern: RegExp }[] = [
  { category: 'love-couple', pattern: /\b(love|lover|marriage|marri(ed|es)?|marry|wife|husband|spouse|sex|feelings|womani[sz]er|harlot|adulter\w*)\b/ },
  { category: 'money-possessions', pattern: /\b(money|profit|wealth|rich|debt|debts|deposit|gift|gifts|payment|treasure)\b/ },
  { category: 'work-success', pattern: /\b(work|workplace|business|job|trade|handwork|farm\w*|hunt\w*|position|chieftaincy|election|promotion)\b/ },
  { category: 'health-hardships', pattern: /\b(sick\w*|illness|health|pain|disease|die|death|survive|cure|misery|suffer\w*)\b/ },
  { category: 'family-loved-ones', pattern: /\b(pregnan\w*|child|children|baby|born|birth|family|mother|father|son|daughter|friend\w*)\b/ },
  { category: 'travel-change', pattern: /\b(travel\w*|journey|trip|road|canoe|migrat\w*|moving|apartment)\b/ },
  { category: 'legal-conflict', pattern: /\b(enemy|enemies|fight|war|court|prison\w*|thief|thieves|stole|stolen|steal|robber\w*|kidnap\w*|accus\w*|quarrel|guilty|hostage)\b/ },
  { category: 'lost-stolen', pattern: /\b(lost|missing|search\w*|hidden|buried|bury|treasure|locate|stolen|thief)\b/ },
  { category: 'fate-timing', pattern: /\b(when|time|timing|day|night|hour|year|month|soon|future|past|present|forever)\b|how long/ },
  { category: 'dreams', pattern: /\b(dream|dreams)\b/ },
];

// Words a user is likely to type, mapped to words the catalogue actually
// contains. Purely a spelling aid for search — it never adds a question.
const SYNONYMS: Record<string, string[]> = {
  business: ['business', 'work', 'trade', 'handwork'],
  cash: ['money'],
  wealth: ['money', 'rich'],
  finance: ['money', 'profit'],
  job: ['work', 'business', 'handwork'],
  career: ['work', 'position'],
  employment: ['work', 'job'],
  spouse: ['wife', 'husband', 'marriage'],
  partner: ['wife', 'husband', 'love'],
  wedding: ['marriage'],
  ill: ['sick', 'illness'],
  disease: ['sick', 'illness'],
  wellbeing: ['health', 'sick'],
  baby: ['child', 'pregnant'],
  kid: ['child'],
  kids: ['children', 'child'],
  theft: ['stolen', 'thief'],
  robbery: ['robbers', 'stolen'],
  opponent: ['enemy'],
  rival: ['enemy'],
  lawsuit: ['court', 'case'],
  jail: ['prison'],
  trip: ['travel', 'journey'],
  relocate: ['move', 'travel'],
  property: ['house', 'apartment', 'land'],
  luck: ['fortune', 'good'],
  success: ['win', 'benefit', 'profit'],
  timing: ['when', 'time', 'day'],
};

function categoryLabelFor(id: CategoryId | null): string | null {
  return CATEGORIES.find((c) => c.id === id)?.label ?? null;
}

function chapterNumberFor(chapterId: string | undefined): number | null {
  if (!chapterId) return null;
  return KM_CHAPTERS.find((c) => c.id === chapterId)?.number ?? null;
}

function buildEntry(intentionId: string, sourceTitle: string, intentionCategory: CategoryId | null): CatalogEntry {
  const availability = getQuestionAvailability(intentionId);
  const engineQuestionId = availability.kind === 'no-automatic-reading' ? null : resolveEngineQuestionId(intentionId);
  const definition = engineQuestionId ? QUESTION_REGISTRY[engineQuestionId] : undefined;

  const title = definition?.title ?? sourceTitle;
  const categoryId = intentionCategory ?? ((definition?.categoryId as CategoryId | undefined) ?? null);
  // The chapter shown is this ENTRY's own chapter, not the canonical
  // question's — a consolidated duplicate is still its own passage in the
  // book, and saying otherwise would misattribute it.
  const ownChapterId = KM_CHAPTERS.find((c) => c.id === intentionId)?.id ?? definition?.chapterId;
  const chapterNumber = chapterNumberFor(ownChapterId);

  const text = `${title} ${sourceTitle}`.toLowerCase();
  const tags: CategoryId[] = categoryId ? [categoryId] : [];
  for (const { category, pattern } of TAG_TOKENS) {
    if (!tags.includes(category) && pattern.test(text)) tags.push(category);
  }

  const haystack = [
    title,
    sourceTitle,
    categoryLabelFor(categoryId) ?? '',
    tags.map((t) => categoryLabelFor(t) ?? '').join(' '),
    chapterNumber !== null ? `chapter ${chapterNumber} ch${chapterNumber}` : '',
    availability.kind === 'no-automatic-reading' ? availability.badge : '',
  ]
    .join(' ')
    .toLowerCase();

  return {
    id: intentionId,
    title,
    sourceTitle,
    hasShortTitle: title !== sourceTitle,
    categoryId,
    categoryLabel: categoryLabelFor(categoryId),
    tags,
    chapterNumber,
    availability,
    engineQuestionId,
    methodCount: definition?.methods.length ?? 0,
    verifiedMethodCount: definition?.methods.filter((m) => m.status === 'verified').length ?? 0,
    haystack,
  };
}

/** One plain sentence for the pre-casting confirmation screen: what this
 * reading will actually do. Built from the entry itself — the number of
 * methods the book gives and how many the surviving source fully defines —
 * so it never promises an answer the engine may not be able to produce. */
export function readingBrief(entry: CatalogEntry): string {
  if (entry.availability.kind === 'no-automatic-reading') return entry.availability.note;

  const { methodCount, verifiedMethodCount } = entry;
  const methods = `${methodCount} method${methodCount === 1 ? '' : 's'}`;
  const base =
    entry.availability.kind === 'consolidated'
      ? `${entry.availability.note} `
      : '';

  if (methodCount === 0) return `${base}Your chart is read against the chapter's own wording.`;
  if (verifiedMethodCount === 0) {
    return `${base}Kanzul Mikban gives ${methods} for this question, but the surviving manuscript leaves out something each one needs — so the reading will explain what is missing rather than give an answer.`;
  }
  if (verifiedMethodCount === methodCount) {
    return `${base}Kanzul Mikban gives ${methods} for this question. Your chart is read against ${methodCount === 1 ? 'it' : 'all of them'}, and you will see each one's working.`;
  }
  return `${base}Kanzul Mikban gives ${methods} for this question. ${verifiedMethodCount} can be read from the surviving source and will be used; the ${methodCount - verifiedMethodCount === 1 ? 'other is' : 'others are'} shown with the reason ${methodCount - verifiedMethodCount === 1 ? 'it' : 'they'} cannot be.`;
}

/** Every selectable question, in the picker's own order. Excludes the
 * general reading, which is a shortcut rather than a catalogue entry. */
export const QUESTION_CATALOG: CatalogEntry[] = INTENTIONS.filter((i) => i.id !== 'general').map((i) =>
  buildEntry(i.id, i.label, i.categoryId),
);

const BY_ID = new Map(QUESTION_CATALOG.map((e) => [e.id, e]));

export function catalogEntry(id: string): CatalogEntry | undefined {
  return BY_ID.get(id);
}

/** Questions tagged with this category, alphabetical by plain-language
 * title. A question appears under every category its own wording supports. */
export function catalogInCategory(categoryId: CategoryId): CatalogEntry[] {
  return QUESTION_CATALOG.filter((e) => e.tags.includes(categoryId)).sort((a, b) => a.title.localeCompare(b.title));
}

export function categoryCounts(): Record<CategoryId, number> {
  const counts = {} as Record<CategoryId, number>;
  for (const category of CATEGORIES) counts[category.id] = catalogInCategory(category.id).length;
  return counts;
}

function expand(term: string): string[] {
  return [term, ...(SYNONYMS[term] ?? [])];
}

/** Client-side search over the existing catalogue only — it can never return
 * anything that is not already a selectable question. Every word typed must
 * match (itself or one of its synonyms), so extra words narrow rather than
 * widen the result. */
export function searchCatalog(query: string, entries: CatalogEntry[] = QUESTION_CATALOG): CatalogEntry[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return entries;
  return entries.filter((entry) => terms.every((term) => expand(term).some((word) => entry.haystack.includes(word))));
}

/** A short starting list for someone who does not know what to ask. Chosen
 * for breadth — one per category, each a question the engine answers — and
 * labelled "Suggested", never "Popular": the app collects no usage data, so
 * a popularity claim would be fabricated. */
export const SUGGESTED_QUESTION_IDS: string[] = [
  'if-you-want-to-know-if-you-will', // Will I get money today? (ch.2)
  'business-profit-and-loss', // Business, profit, and loss (ch.3)
  'sickness-if-he-she-will-survive', // Will the sick person survive? (ch.9)
  'if-a-marriage-is-good-or-not', // Is this marriage good? (ch.13)
  'traveling-business-and-if-you-will-return-from', // Travel and return (ch.1)
  'if-you-will-win-a-case-in-court', // Court case, fight, war (ch.19)
  'if-your-lost-thing-is-still-around-or', // Is my lost thing still around? (ch.5)
  'if-a-lady-is-pregnant-or-not', // Is she pregnant? (ch.47)
  'if-things-will-be-better-for-the-questioner', // Will things get better? (ch.12)
];

export const SUGGESTED_QUESTIONS: CatalogEntry[] = SUGGESTED_QUESTION_IDS.map((id) => BY_ID.get(id)).filter(
  (e): e is CatalogEntry => !!e,
);
