// Source: Kanzul Mikban, Chapter 28 — "If You Will Get Money or Good
// Strangers That Same Day or Not" (id "if-you-will-get-money-or-good-
// strangers") — same calculation as moneyOrGoodStrangers.ts, reused
// verbatim, never redefined — plus the two continuation entries
// "continued-from-chapter-twenty-eight" and "reading-the-gift-visitor-
// figures-end-of-chapter", which name eight specific result figures and
// what each means. This is registered as its OWN question, under id
// "continued-from-chapter-twenty-eight", rather than as a second method
// on moneyOrGoodStrangersQuestion, for two reasons: (1) that file's
// existing method is deliberately scoped narrow (see its own header
// comment) and must not change — this file changes nothing there, adds
// no method to it, and money-strangers-method-1 remains exactly as it
// was; (2) this question's resultKind is 'descriptive' (which figure, and
// what it means), while Chapter 28's own question is an ordinary
// favourable/unfavourable/uncertain one — QuestionDefinition.resultKind is
// one flag per question, so the two shapes cannot share a QuestionDefinition
// without forcing one of them.
//
// THE CALCULATION ("form a star")
//
// Chapter 28's own paragraph: "pick the water element of h5, h7, h11 and
// h14 and form a star. Add it to h7 and check if it's found in the
// chart." "Form a star" is EXTRACT_ELEMENT(chart, [5,7,11,14], 'water') —
// the same operation, and the same shape of instruction ("pick hA water
// element, hB water element, ... and form a star"), already implemented
// and verified for this exact chapter by moneyOrGoodStrangers.ts. Nothing
// new is added to operations.ts or casting.ts for this method.
//
// SCOPE — CORRECTED after a source-fidelity re-audit
//
// An earlier version of this file went on to compute the chapter's fire/
// air/water/sand-star elaboration (visitor type, open/closed water-line
// timing, "repeats many times" timing) as verified interpretation output.
// That was wrong, and not because of anything newly discovered about the
// manuscript — it directly contradicted evidence already sitting in this
// same codebase: moneyOrGoodStrangers.ts's own header comment (written for
// an earlier, already-verified stage of THIS SAME passage) says explicitly
// that this exact elaboration, including "a 'water-element, closed -> you
// won't get anything' carve-out," was "deliberately not encoded... the
// closed-water carve-out isn't clearly reconciled with the primary rule
// textually." That is a documented, considered decision from this
// project's own prior audit of this exact sentence — not an oversight —
// and the earlier version of this file overrode it by choosing a reading
// "for textual coherence," which is exactly the kind of resolution this
// project does not accept. (The "man" vs "mom" wording discrepancy raised
// for the fire/air branches — see the git history of this file — is
// independent evidence of the same risk: this elaboration text is not
// solid enough to compute against.)
//
// This method therefore implements ONLY:
//   1. The calculation (EXTRACT_ELEMENT + ADD_FIGURE_TO_HOUSE) — an
//      unambiguous, already-established structural match to "pick the
//      water element of h5/h7/h11/h14 and form a star. Add it to h7."
//   2. The found-in-chart check — reusing, not re-deriving, the SAME
//      entity resolution moneyOrGoodStrangers.ts's own already-verified
//      method already uses for this identical clause ("check if it's
//      found in the chart") on this identical calculation. This is
//      continuity with an established precedent, not a new interpretive
//      choice made for this file.
//   3. The eight recovered gift-figure meanings ("if you use the method
//      above and get [FIGURE], it means...") — read as naming the same
//      procedure's result as (2) above ("the method above"), so no
//      further entity-resolution question is introduced beyond what (2)
//      already settles by precedent.
//
// It does NOT compute or report element, direction, water-line state,
// repetition count, or any of the fire/air/water/sand-star interpretive
// sentences — the same scope discipline moneyOrGoodStrangers.ts's own
// method already applies to this identical material, extended here only
// with the newly-available gift-figure data that method could not have
// used (it predates the figure recovery).
//
// THE EIGHT GIFT FIGURES
//
// See content/manuscripts/giftVisitorFigures.ts for the eight recovered
// figures (including the Prompt 50 correction to four of the eight, made
// after direct visual re-verification of the manuscript page), and which
// eight of the sixteen canonical figures have NO recovered interpretation
// (a real, honestly-reported gap — see this method's own zero-match
// branch below, never guessed at).
//
// SECURITY: this file lives in lib/raml/engine/questions/, reachable only
// from server-side code — see dreamsAndInterpretations.ts's own header
// comment and lib/server/raml/clientLeakage.test.ts, which structurally
// guarantees no 'use client' component imports this registry.

import { ADD_FIGURE_TO_HOUSE, CHECK_FIGURE_PRESENT_IN_CHART, EXTRACT_ELEMENT } from '../operations';
import type { MethodDefinition, QuestionDefinition } from '../types';
import { findGiftVisitorFigureByPattern } from '@/content/manuscripts/giftVisitorFigures';

const CHAPTER_ID = 'continued-from-chapter-twenty-eight';
const SOURCE_CHAPTER_ID = 'if-you-will-get-money-or-good-strangers';

// Transcribed verbatim from kanzulMikban.ts's own two continuation
// paragraphs (whitespace-normalized only), keyed by this restoration's own
// 1-8 reading-order number — see content/manuscripts/giftVisitorFigures.ts.
const GIFT_INTERPRETATIONS: Record<number, string> = {
  1: "Your prayers and supplications are answered — it won't reach 7 days.",
  2: 'You will get something white like cloth or a shirt, money, etc. You will get the gift from a great person.',
  3: 'You will get something that breathes, or that has life — you will get it from a sick person or from a servant.',
  4: 'You will get a cutlass or knife from a knife or cutlass seller.',
  5: 'You will get an animal from an animal seller or buyer — you will get a lot of things from people.',
  6: 'You will get a beautiful lady — you will get something good from her, or through her you will be successful.',
  7: 'You will get gold and diamond, or you will get animals, and after that you will get a lot of blessings.',
  8: 'You will get all your requests from Allah without stress or time delay.',
};

const method1: MethodDefinition = {
  id: 'gift-visitor-figures-method-1',
  label: 'Method 1',
  status: 'verified',
  source: {
    book: 'kanzul-mikban',
    chapterId: SOURCE_CHAPTER_ID,
    // Identical to moneyOrGoodStrangers.ts's own quote, and for the same
    // reason: this is the exact sentence this method implements, and no
    // more. The paragraph continues with the fire/air/water/sand-star
    // elaboration this method deliberately does not compute (see header).
    quote:
      "After drawing the chart, pick the water element of h5, h7, h11 and h14 and form a star. Add it to h7 and check if it's found in the chart — it means you will get money or very good visitors that day.",
  },
  calculate: (chart) => {
    const star = EXTRACT_ELEMENT(chart, [5, 7, 11, 14], 'water');
    const result = ADD_FIGURE_TO_HOUSE(chart, star.figure, 7);
    return {
      housesUsed: [5, 7, 11, 14, 7],
      steps: [star.trace.description, result.trace.description],
      resultFigure: result.figure,
    };
  },
  evaluate: (calc, chart) => {
    const { found } = CHECK_FIGURE_PRESENT_IN_CHART(chart, calc.resultFigure.dotPattern);

    const foundSentence = found
      ? `${calc.resultFigure.figureName} is found elsewhere in your chart — the source reads this as "you will get money or very good visitors that day."`
      : `${calc.resultFigure.figureName} was not found elsewhere in your chart. The source only defines the "found" branch here — a not-found result is not addressed.`;

    const giftNumber = findGiftVisitorFigureByPattern(calc.resultFigure.dotPattern);

    if (giftNumber !== null) {
      return {
        outcome: 'descriptive',
        label: `${calc.resultFigure.figureName} — gift figure #${giftNumber}`,
        interpretation: `${foundSentence} ${GIFT_INTERPRETATIONS[giftNumber]}`,
        descriptiveAnswer: `gift-figure-${giftNumber}`,
      };
    }

    return {
      outcome: 'uncertain',
      label: `${calc.resultFigure.figureName} — no gift interpretation recovered yet`,
      interpretation: `${foundSentence} ${calc.resultFigure.figureName} is not one of the eight figures this restoration has recovered a specific gift/visitor meaning for — the manuscript pages naming the other eight have not yet been located, so no meaning is guessed here.`,
    };
  },
};

export const giftVisitorFiguresQuestion: QuestionDefinition = {
  id: CHAPTER_ID,
  title: 'What kind of gift or visitor is coming?',
  categoryId: 'fate-timing',
  chapterId: CHAPTER_ID,
  resultKind: 'descriptive',
  methods: [method1],
};
