// Product-level availability layer (Prompt 14 UX audit).
//
// The intention picker offers 153 selectable entries — one per Kanzul Mikban
// transcription entry — but the engine implements 140 questions. That gap is
// not a bug in either layer: some entries are the SAME question the engine
// already answers under a different id (a chapter and a fragment that repeat
// one rule), and some are not chart-verdict questions at all (reference
// tables, a ritual, an open-ended technique, material whose figures the
// transcription lost).
//
// Before this module, both kinds silently fell through to the lighter-weight
// fallback parser, so a user picking "Additional Method — If a Sick Person Has
// Long Life (repeated...)" got a degraded reading of a rule the engine
// actually implements in full, and a user picking a reference table was shown
// text implying a reading had been attempted on their chart.
//
// This file records, in ordinary language, what each of those 13 entries
// really is. It contains no geomantic rule: `consolidatedInto` only names the
// engine question that already implements the same source rule, and the
// reasons are descriptions of the source, not interpretations of it.

/** A selectable question the engine answers directly. */
type EngineAvailability = { kind: 'engine' };

/** The same source rule, already implemented under another question's id.
 * Selecting this entry should run that question rather than fall back. */
type ConsolidatedAvailability = {
  kind: 'consolidated';
  canonicalQuestionId: string;
  /** Shown to the user, in plain language. */
  note: string;
};

/** Real source material, but not a question the app can answer from a chart. */
type ReferenceAvailability = {
  kind: 'no-automatic-reading';
  /** Short chip text for the picker. */
  badge: string;
  /** Full explanation for the result screen. */
  note: string;
};

export type QuestionAvailability = EngineAvailability | ConsolidatedAvailability | ReferenceAvailability;

const CONSOLIDATED: Record<string, ConsolidatedAvailability> = {
  'about-a-pregnancy-if-it-s-a-boy': {
    kind: 'consolidated',
    canonicalQuestionId: 'if-it-s-a-male-or-female-child',
    note: 'The notebook asks this twice. Both are read together under “If It’s a Male or Female Child”, which includes this chapter’s own method.',
  },
  's-if-you-want-to-know-if-she': {
    kind: 'consolidated',
    canonicalQuestionId: 'if-a-lady-is-pregnant-or-not',
    note: 'These additional methods are read together with the main pregnancy question, which includes them.',
  },
  'if-a-sick-person-has-long-life-repeated': {
    kind: 'consolidated',
    canonicalQuestionId: 'if-a-sick-person-has-long-life-or',
    note: 'The notebook repeats this method later on. It is read as part of “If a Sick Person Has Long Life”, which includes it.',
  },
  'if-a-sick-person-has-long-life-repeated-2': {
    kind: 'consolidated',
    canonicalQuestionId: 'if-a-sick-person-has-long-life-or',
    note: 'A third copy of the same method. It is read as part of “If a Sick Person Has Long Life”, which includes it.',
  },
  'someone-s-behavior-also-see-chapter-forty-three': {
    kind: 'consolidated',
    canonicalQuestionId: 'the-real-behavior-character-or-life-of-someone',
    note: 'This repeats Chapter 43’s method word for word — the notebook’s own note says so. It is read under that chapter.',
  },
};

const NO_AUTOMATIC_READING: Record<string, ReferenceAvailability> = {
  'if-someone-loves-you-much-less-or-not': {
    kind: 'no-automatic-reading',
    badge: 'Different method',
    note: 'This chapter uses a separate counting technique of its own, not the sixteen-house chart — so a cast chart cannot answer it. The chapter text is shown in full below.',
  },
  'how-to-make-one-win-over-the-other': {
    kind: 'no-automatic-reading',
    badge: 'Practice, not a reading',
    note: 'This chapter describes something to do, not something to read from a chart, and its diagram was not preserved. The chapter text is shown in full below.',
  },
  'the-secret-of-the-querent-in-a-chart': {
    kind: 'no-automatic-reading',
    badge: 'Open-ended',
    note: 'The methods here are open-ended — the book leaves them to the reader’s own judgement rather than giving a rule that always produces the same answer. The chapter text is shown in full below.',
  },
  'the-stars-that-talk-about-your-youthful-time': {
    kind: 'no-automatic-reading',
    badge: 'Reference table',
    note: 'This is a reference table rather than a question, and the surviving transcription is missing its contents. The chapter text is shown in full below.',
  },
  'parts-of-the-human-body-and-the-stars': {
    kind: 'no-automatic-reading',
    badge: 'Reference table',
    note: 'This is the body-part table the app already uses when answering “Which part of the body is in pain?”. On its own it is a lookup list, not a question.',
  },
  // NOTE: 'dreams-and-their-interpretations' (Chapter 151) is intentionally
  // absent from this map — it is now a real, registered engine question
  // (see lib/raml/engine/questions/dreamsAndInterpretations.ts). It falls
  // through to the default { kind: 'engine' } below. Do not re-add an entry
  // here reclassifying it as unautomated; see that file's own header
  // comment for exactly why it is safe to run automatically, and what part
  // of its procedure is author-clarified rather than manuscript text.
  'continued-from-chapter-twenty-eight': {
    kind: 'no-automatic-reading',
    badge: 'Figures missing',
    note: 'Every figure that would identify which meaning applies was lost from this continuation, so nothing here can be matched to your chart. The text is shown in full below.',
  },
  'reading-the-gift-visitor-figures-end-of-chapter': {
    kind: 'no-automatic-reading',
    badge: 'Figures missing',
    note: 'Every figure that would identify which meaning applies was lost from this continuation, so nothing here can be matched to your chart. The text is shown in full below.',
  },
};

/** What the app can actually do with a selected intention. `engine` means the
 * reading engine answers it directly; the other two say why it doesn't. */
export function getQuestionAvailability(intentionId: string): QuestionAvailability {
  return CONSOLIDATED[intentionId] ?? NO_AUTOMATIC_READING[intentionId] ?? { kind: 'engine' };
}

/** The question id whose engine definition should actually be run for a given
 * selection — the selection itself, unless it is a consolidated duplicate. */
export function resolveEngineQuestionId(intentionId: string): string {
  const availability = CONSOLIDATED[intentionId];
  return availability ? availability.canonicalQuestionId : intentionId;
}
