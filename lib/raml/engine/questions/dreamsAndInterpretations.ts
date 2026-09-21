// Source: Kanzul Mikban, Chapter 151 — "Dreams and Their Interpretations"
// (id "dreams-and-their-interpretations"). The chapter's own instruction is
// terse: "If you want to know the meaning of a dream, make only the first 4
// stars (Umuhat) and pair them." Prompt 12/13's audit (see COVERAGE.md and
// source-reconciliation.test.ts's history) searched both manuscripts and
// found no passage anywhere that spells out how many times to "pair," or
// which houses pair with which — a genuine, then-unresolved gap, not a
// guess this project was willing to fill in on its own.
//
// THIS METHOD'S CALCULATION PROCEDURE IS NOT MANUSCRIPT TEXT. It reflects
// the product owner's direct clarification with the manuscript's author on
// exactly this question, relayed as: pair Umuhat 1 with Umuhat 2, pair
// Umuhat 3 with Umuhat 4, then pair those two results together, giving one
// final figure to match against the chapter's own sixteen entries. That
// clarification is not itself a transcribed sentence — unlike every other
// `source.quote` in this registry, which quotes the manuscript directly —
// so it is recorded here in plain prose, not inside a SourceRef.quote,
// and must never be presented as something the manuscript itself states.
// Future edits should keep this distinction: `source.quote` below is a real
// manuscript sentence (verified against kanzulMikban.ts and
// dreamInterpretations.test.ts); the pairing PROCEDURE is author-clarified.
//
// "Pair," at the operation level, is not invented here either: the ONLY
// place either manuscript ever defines what combining two figures means is
// Master of Geomancy Vol. 1's own Chapter 1 ("pairs of the eight Mothers
// and Daughters combine to give four Nieces..."), which this codebase
// already implements as ADD_FIGURES/ADD_MULTIPLE_HOUSES (see
// lib/raml/casting.ts's addPatterns, commented "Matches the book's own
// worked examples"). This method reuses that exact, already-verified
// operation — nothing new is added to operations.ts or casting.ts.
//
// Calculation still reads the four Umuhat as H1-H4 of the chart object the
// engine is given (`housesUsed: [1, 2, 3, 4]`) and never reads H5-H16,
// Daughters, Nieces, Witnesses, or the Judge. The Cast result UI for this
// question does not present the unused twelve shield houses: the user
// generates four Mothers, and the application displays those four plus the
// three pairing products (Pair 1 = M1+M2, Pair 2 = M3+M4, Final = those
// two). Those pairing products must never be labelled Nieces, Witnesses, or
// the Judge, even though a standard 16-house shield stores the same
// arithmetic at H9/H10/H13. That presentation lives in
// lib/raml/dreamPairingPresentation.ts and
// components/raml/DreamWorkingPanel.tsx — it does not change this method's
// calculate()/evaluate(), operations.ts, or casting.ts.
//
// The sixteen dream figures and their star ids were already restored (see
// content/manuscripts/dreamInterpretations.ts, Prompt 31) — reused here via
// findDreamInterpretationsByPattern(), never redefined. Only the
// INTERPRETATION TEXT is new to this file: it was never previously needed
// outside the static book reader (which renders it from the protected,
// server-only content/kanzulMikban.ts), so it is transcribed here verbatim
// (whitespace-normalized only) for this method's own use. This file lives
// in lib/raml/engine/questions/, which — like every other question file's
// embedded source quotes — is reachable only from server-side code
// (lib/server/raml/practiceService.ts, lib/server/previewService.ts, and
// the /api/raml/reading* route handlers); see
// lib/server/raml/clientLeakage.test.ts, which structurally guarantees no
// 'use client' component imports this registry.

import { ADD_FIGURES, ADD_MULTIPLE_HOUSES, CHECK_HOUSE } from '../operations';
import type { CastingRequirement, MethodDefinition, QuestionDefinition } from '../types';
import { findDreamInterpretationsByPattern, getDreamInterpretationStarId } from '@/content/manuscripts/dreamInterpretations';
import { STARS } from '@/content/stars';

const CHAPTER_ID = 'dreams-and-their-interpretations';

// Transcribed verbatim from kanzulMikban.ts's own Chapter 151 paragraphs
// (whitespace-normalized only — the "white house- bird" line-wrap in #5 is
// a PDF artifact, not a hyphenated word). Nothing here is reworded; see
// content/manuscripts/dreamInterpretations.test.ts for the same source text
// independently verified for the book reader.
const DREAM_INTERPRETATIONS: Record<number, string> = {
  1: "It means enmity but long life. It also talks about sickness and family problems. Do the sadaka (charitable offering) of a red cock, red money, and a red shirt/jalabia, on Friday.",
  2: "It means heavy money is coming to you, or a lucrative job or business. It also talks about a business trip, or someone coming to pay you their debts. Do the sadaka of your cloth or shirt, any amount of money, and a black/white hen.",
  3: "It means you will get a good stranger, a visitor, or a message. It also talks about a love relationship or marriage that will soon come. Do the sadaka of 100 kola nuts, a black cock, and any amount of money. Your business or money will be tied up for a little while before it opens.",
  4: "It means you will get a stranger wearing white clothes. It also talks about a man/lady you will meet on your journey who might become your wife or husband in future, and about an intelligent child you will have in future. Do the sadaka of white cloth, a white cock, and one white kola nut.",
  5: "It means a message, a messenger, or a child/pregnancy that you will soon get. It also talks about travelling across water or a flood. Do the sadaka of a white house-bird, white rice and cow's milk, or the head of a sheep or goat.",
  6: "It means you will get a lot of money, but you may use it all for your treatment — you will be sick for some time, but insha'Allah you will be fine after that. Do the sadaka of salt, a white item [unclear in the original], and a white house-bird.",
  7: "It means your house might get burnt, or a nearby house. It also talks about a cut or blood on your body, meat that someone might bring you as sadaka, a colored man/lady coming into your life, and being stolen from (or that you will be). Do the sadaka of a red cock or duck, gold, and red money.",
  8: "It means a new funeral, or that there will be many funerals that month or week. It talks about panic and fear. Do the sadaka of a mixed-color cock, mixed-color foods, and a black cloth.",
  9: "It means you will soon travel — the travelling is good, and you will go and come in peace and safety. Do the sadaka of black metal and a cock that has 3 colors; give them to a traveller or a stranger.",
  10: "It means you are cheating people and should stop, or that someone will cheat you — so be careful. It also talks about promotion or chieftaincy issues. Do the sadaka of a guinea fowl and a black cloth/white ram, for the recitation of the Qur'an, or as charity (khayrat) on your behalf.",
  11: "It means the expectations you are thinking about will soon come — it also talks about an ex who wants to come back to you, though the expectations are not good for you. Do the sadaka of a red goat, your sandals, and 4 white kola nuts.",
  12: "It means money that is supposed to come to you has been blocked by an enemy. It also talks about a debt that you owe, or that is owed to you, that will cause enmity between you and that person. Do the sadaka of a red goat, red shirt, money, and red cereals.",
  13: "It means all your success has been blocked, and it will be very difficult to unblock. Do the sadaka of 2 fowls from the same mother — one released to the North and the other to the South.",
  14: "It means your ancestors are asking for food from you. It also talks about your success having been blocked. You have to do sadaka to your ancestors so that things will be better for you — make food with a white hen and share it around your area.",
  15: "It means success, love, and leadership await you in future. It also talks about a relationship or marriage. Do the sadaka of white cloth, 7 white kola nuts, white rice, cow's milk, and a white hen.",
  16: "It means your enemies are many — envious and jealous people are around you, and a lot of people are looking up to you to help them. It also talks about how you will lead people in future. Do the sadaka of a black cock and Massan (21) [quantity/term unclear in the original].",
};

function starNameFor(entryNumber: number): string {
  const starId = getDreamInterpretationStarId(entryNumber);
  return STARS.find((s) => s.id === starId)?.name ?? starId;
}

/** Presentation metadata only (Prompt 66). Does not change calculate()/evaluate(). */
const CHAPTER_151_CASTING: CastingRequirement = {
  userGenerates: { kind: 'four_mothers' },
  inspects: { kind: 'derived_figures', figureIds: ['pair-1', 'pair-2', 'final'] },
  appDerives: {
    kind: 'pairing_tree',
    steps: [
      { id: 'pair-1', label: 'Pair 1', from: ['mother-1', 'mother-2'] },
      { id: 'pair-2', label: 'Pair 2', from: ['mother-3', 'mother-4'] },
      { id: 'final', label: 'Final Figure', from: ['pair-1', 'pair-2'] },
    ],
  },
  display: { kind: 'mothers_and_pairing' },
  evidence: 'author_clarified',
  note: 'Manuscript instructs making only the first 4 Umuhat and pairing them. The pairing tree (1+2, 3+4, then those two) is author-clarified, not a SourceRef.quote. Pairing products must never be labelled Nieces, Witnesses, or the Judge.',
};

const method1: MethodDefinition = {
  id: 'dreams-interpretation-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: CHAPTER_ID,
    quote: "If you want to know the meaning of a dream, make only the first 4 stars (Umuhat) and pair them.",
  },
  castingRequirement: CHAPTER_151_CASTING,
  calculate: (chart) => {
    const u1 = CHECK_HOUSE(chart, 1);
    const u2 = CHECK_HOUSE(chart, 2);
    const u3 = CHECK_HOUSE(chart, 3);
    const u4 = CHECK_HOUSE(chart, 4);
    const pairA = ADD_MULTIPLE_HOUSES(chart, [1, 2]);
    const pairB = ADD_MULTIPLE_HOUSES(chart, [3, 4]);
    const { figure: finalFigure, trace: finalTrace } = ADD_FIGURES([pairA.figure, pairB.figure]);
    return {
      housesUsed: [1, 2, 3, 4],
      steps: [
        `Umuhat 1 = ${u1.trace.description}`,
        `Umuhat 2 = ${u2.trace.description}`,
        `Umuhat 3 = ${u3.trace.description}`,
        `Umuhat 4 = ${u4.trace.description}`,
        `Pair 1: ${pairA.trace.description}`,
        `Pair 2: ${pairB.trace.description}`,
        `Final pairing: ${finalTrace.description}`,
      ],
      resultFigure: finalFigure,
    };
  },
  evaluate: (calc) => {
    const matches = findDreamInterpretationsByPattern(calc.resultFigure.dotPattern);
    if (matches.length === 0) {
      // Cannot happen in practice — the 16 canonical STARS patterns cover
      // every possible 4-row figure, so the final figure always matches
      // one of them — but never assumed away, matching this project's
      // usual defensive style (see bodyPartInPain.ts's own zero-match arm).
      return {
        outcome: 'uncertain',
        label: 'No matching interpretation',
        interpretation: 'The final figure did not match any of Chapter 151\'s sixteen source figures.',
      };
    }
    if (matches.length === 1) {
      const n = matches[0];
      return {
        outcome: 'descriptive',
        label: `Interpretation #${n} — ${starNameFor(n)}`,
        interpretation: DREAM_INTERPRETATIONS[n],
        descriptiveAnswer: `interpretation-${n}`,
      };
    }
    // Only ever reachable for the genuine source duplicate (#1 and #4, both
    // Yussif) — both interpretations are given in full, neither is dropped
    // or silently preferred over the other (see this file's header comment
    // and content/manuscripts/dreamInterpretations.ts's own docs on the
    // duplicate).
    return {
      outcome: 'descriptive',
      label: `Interpretations ${matches.map((n) => `#${n}`).join(' and ')} — ${starNameFor(matches[0])}`,
      interpretation: matches.map((n) => `${n}. ${DREAM_INTERPRETATIONS[n]}`).join(' '),
      descriptiveAnswer: `interpretation-${matches.join('-')}`,
    };
  },
};

export const dreamsAndInterpretationsQuestion: QuestionDefinition = {
  id: CHAPTER_ID,
  title: 'What does this dream mean?',
  categoryId: 'dreams',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
