// The compact result summary (Prompt 15, sections 11-12).
//
// One small, honest précis of a finished reading — the same four things a
// user would screenshot or paste somewhere: what was asked, what came back,
// what it means in a sentence, and where it comes from. Every field is taken
// from the ReadingResult the engine already composed; nothing is re-judged,
// re-tallied, or softened here, and no certainty the engine did not state is
// added.
import type { ReadingResult } from './engine/reading';
import { isSourceSilentReading, primaryDisplayedInterpretation } from './resultPresentation';
import { STANDING_NOTE, attributionLine, buildAnswerView } from './readingExplanation';
import { INSUFFICIENT_HEADING, SOURCE_SILENT_HEADING, sourceSilentExplanation } from './statusLanguage';

export interface ReadingSummary {
  /** The question, in the engine's own plain-language wording. */
  question: string;
  /** The headline state: a verdict, the descriptive answer, "Mixed /
   * Conflicting indications", or "Insufficient information". */
  status: string;
  /** The engine's own one-or-two sentence answer. */
  interpretation: string;
  /** e.g. "Kanzul Mikban, Chapter 19". */
  source: string;
  /** Present only when the methods genuinely disagree. */
  conflict: boolean;
  /** Free-cast Phase A: each distinct method conclusion with its attribution, when the card
   * must show more than one. Absent for every reading that keeps the original summary. */
  items?: { attribution: string; sentence: string }[];
}

export function summariseReading(result: ReadingResult): ReadingSummary {
  const silent = isSourceSilentReading(result);
  const status = silent
    ? SOURCE_SILENT_HEADING
    : result.isInsufficient
      ? 'Insufficient information'
      : result.conflictingIndicators
        ? 'Mixed / Conflicting indications'
        : result.resultKind === 'descriptive'
          ? (result.descriptiveAnswer ?? 'The methods give different answers')
          : result.outcomeLabel;

  const interpretation = silent
    ? sourceSilentExplanation(result.methodResults.filter((m) => m.status === 'verified').length)
    : (primaryDisplayedInterpretation(result) ?? result.shortSummary);

  return {
    question: result.question,
    status,
    interpretation,
    source: result.sourceReferences.map((s) => s.label).join(' · '),
    conflict: result.conflictingIndicators,
  };
}

function attributionSubject(methods: Parameters<typeof attributionLine>[0]): string {
  return attributionLine(methods).replace(/^According to /, '').replace(/:$/, '');
}

/** The summary the result card and the copied text show. For outcome-style readings with
 * counted methods it leads with the SAME attributed method sentence(s) as the primary
 * answer (readingExplanation.buildAnswerView): one sentence for one method, the shared
 * sentence for agreeing methods, and — when methods differ — every method's sentence with
 * no preferred one. Every other reading (descriptive, insufficient, source-silent) gets
 * exactly summariseReading(), unchanged. History keeps using summariseReading directly. */
export function summariseForCard(result: ReadingResult): ReadingSummary {
  const base = summariseReading(result);
  const view = buildAnswerView(result);
  if (view.kind === 'legacy') return base;

  if (view.kind === 'differ') {
    return {
      ...base,
      status: view.statusLine,
      interpretation: view.detailLines.join(' '),
      items: view.groups.map((g) => ({ attribution: attributionSubject(g.methods), sentence: g.sentence })),
    };
  }
  if (view.groups.length === 1) {
    const [g] = view.groups;
    const subject = `According to ${attributionSubject(g.methods)}.`;
    return { ...base, status: g.sentence, interpretation: view.kind === 'agree' ? `${view.statusLine} ${subject}` : subject };
  }
  // several verified methods, same indication, differently worded: show each one's own words
  return {
    ...base,
    status: view.statusLine,
    interpretation: '',
    items: view.groups.map((g) => ({ attribution: attributionSubject(g.methods), sentence: g.sentence })),
  };
}

/** Plain text for the "Copy reading" action — the summary, plus the user's
 * own typed question when they entered one. Deliberately free of markup so
 * it pastes cleanly into a message or a note. */
export function readingToText(result: ReadingResult, userQuestion?: string): string {
  const summary = summariseForCard(result);
  const lines = [summary.question, '', summary.status];
  if (summary.items) for (const item of summary.items) lines.push('', `${item.attribution}: ${item.sentence}`);
  if (summary.interpretation) lines.push('', summary.interpretation);
  if (userQuestion?.trim()) {
    lines.push('', `Asked: ${userQuestion.trim()}`);
  }
  if (summary.source) lines.push('', `Source: ${summary.source}`);
  if (buildAnswerView(result).kind !== 'legacy') lines.push('', STANDING_NOTE);
  if (isSourceSilentReading(result)) lines.push('', SOURCE_SILENT_HEADING);
  else if (result.isInsufficient) lines.push('', INSUFFICIENT_HEADING);
  return lines.join('\n');
}
