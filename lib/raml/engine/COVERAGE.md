# Structured engine — rule coverage report

This tracks the hand-authored, structured engine in `lib/raml/engine/questions/`
— the layer that gives a question a full audit trail and cross-method
consensus (`agree`/`mostly_agree`/`mixed`/`conflict`/`insufficient_data`).
It is separate from `lib/raml/methodVerdicts.ts` + `lib/raml/methodParser.ts`,
a general text-pattern parser that automates a *different, larger* slice of
the book (~54 of 134 method paragraphs across 33 chapters) without a full
audit trail or consensus layer. The two don't overlap in the app: a question
in this registry always takes priority; every other question still uses the
general parser, unaffected by anything below.

Regenerate this table by hand whenever a chapter is added or a method's
status changes — it is not generated from code, so treat it as documentation
that can drift, not a live report.

## Prompt 4.5 — descriptive result kind (architecture audit, no new chapters)

Before Prompt 4.5, chapters 23/31/36's fully-computable methods were marked
`needs_review` purely because the engine had no `MethodOutcome` for a
categorical answer ("the terrain is water") — an architectural workaround,
not a real source-verification gap. The audit added a genuine third result
shape rather than continuing to misuse `needs_review` for it:

- `MethodOutcome` gained `'descriptive'`, and `MethodVerdict` gained an
  optional `descriptiveAnswer` field (a normalized value used ONLY to
  compare methods for agreement — never displayed raw, never a favourable/
  unfavourable judgment).
- `QuestionDefinition` gained an optional `resultKind: 'outcome' |
  'descriptive'` field (default `'outcome'` — every pre-existing question
  needed zero changes).
- `COMPARE_RESULTS` (`operations.ts`) now takes that `resultKind` and, for
  descriptive questions, compares counted methods by ANSWER EQUALITY
  ("Methods agree" / "Methods disagree" — new `ConsensusLevel: 'disagree'`)
  instead of voting them into a favourable/unfavourable/mixed tally that was
  never the right shape for a categorical fact.
- Chapters 23, 31, and 36 were migrated from `status: 'needs_review'` to
  `status: 'verified'` with a real `outcome: 'descriptive'` verdict — the
  calculation didn't change at all, only how honestly its result type is
  represented. **No source rule was invented or altered by this change.**
- `EngineReadingView`'s existing generic components (`OutcomeCard`,
  `MethodConsistencyCard`, `FigureCard`) gained small, data-driven
  adaptations (a "Reading" eyebrow + the actual answer text in place of a
  favourable/unfavourable badge; per-method rows without a check/cross icon)
  rather than a second, hard-coded UI — see "Files changed" in the session
  report for the full list.

This is a presentation/result-model change only; every existing outcome
question's calculation, consensus, and display are byte-identical to
before. See `lib/raml/engine/__tests__/reading.test.ts` ("Prompt 4.5 —
descriptive result kind") and `operations.test.ts`
("COMPARE_RESULTS — descriptive questions") for the new coverage.

## Prompt 5 — Kanzul Mikban chapters 41-60 (Stage 4)

Source-first expansion, same discipline as Prompt 4: read every chapter's
actual text (not the table of contents), preserve every method
independently, never merge distinct traditional methods into one
algorithm, never guess an omitted figure, never force a descriptive answer
into favourable/unfavourable. 17 new questions registered, reusing the
`resultKind: 'descriptive'` model Prompt 4.5 built rather than inventing
another result shape — nothing new was needed there.

Two consolidation decisions, both source-driven rather than convenience
merges:

- **Chapter 47 + the unnumbered "Additional Methods — If You Want to Know
  If She's Pregnant" fragment** (which follows chapter 56 in the source and
  is explicitly titled as extending chapter 47's own question): that
  fragment's first two methods are registered as `lady-pregnant-method-3`
  and `-4` on chapter 47's question, since they answer the exact same
  question, more completely (full upward/downward and good/bad branch
  coverage) than chapter 47's own two positive-trigger-only methods. Its
  third method (predicting the baby's *sex*, not whether she's pregnant) is
  a different question — see below.
- **Chapter 48 + Chapter 56**: both ask "will the child be male or female"
  — content/intentions.ts already carries a separate intention id for each,
  but per instruction #10 ("check for duplicate/overlapping questions, reuse
  an existing id") they are registered as ONE question, under chapter 48's
  id. Chapter 48's own two methods both hinge on classifying a figure
  directly as a "male star"/"female star" — a classification neither this
  chapter nor any other in the source (so far) defines, and which this
  project's general `FigureQualities.gender` axis is intentionally left
  `needs_review` for, project-wide (see types.ts — this is not new to
  Prompt 5). Chapter 56's method needs no such classification at all — it's
  pure whole-chart dot arithmetic (`COUNT_TOTAL_DOTS` + `CAST_OUT_BY`, both
  new, generic, reusable primitives) — and is the only verified method
  here. Chapter 56's own intention id therefore has no `QUESTION_REGISTRY`
  entry (it falls back to the general parser, same as any other
  not-yet-structured chapter — this is normal, not a gap).

Two chapters and one unnumbered fragment were read in full and found to
have **no computable shape at all**, so nothing was registered for them —
see "Architectural gaps" below for the full reasoning: chapter 46 (a
talismanic/ritual practice, not a chart-verdict method, with its own
diagram omitted from the transcription), chapter 59 (every method is
either open-ended/non-deterministic — "use whatever star you get to talk
to the person" — or not chart-derived at all), and the unnumbered
"Consequence of Friendship Between Two People" fragment after chapter 52
(fully computable, but carries no chapter number and so falls outside this
stage's numbered scope).

One new architecture-level finding, not a source-rule change: this
stage's descriptive questions are joined by several genuinely **yes/no
factual** ones (is she pregnant, is it a male/female child, have they had
sex) that don't carry any favourable/unfavourable value judgment in the
source — `resultKind: 'descriptive'` was used for these too, consistent
with Prompt 4.5's own principle ("do not force every question into the
outcome-voting model"). This is a considered extension of that principle,
not a new mechanism — no types.ts change was needed. Chapter 21's
pre-existing, structurally identical question (wife/sister had sex) still
uses the older favourable=yes/unfavourable=no treatment from before the
descriptive kind existed; that inconsistency is flagged in the
source-verification queue below rather than silently left unremarked, but
fixing it is out of this stage's scope (Prompt 5 scopes chapters 41-60
only).

Real, hand-computed data on the shared fixture chart produced two genuine
cross-method disagreements this stage — both preserved honestly, neither
averaged nor silently resolved: chapter 58 ("if couples have had sex")
disagrees ("yes" vs. "no" — `ConsensusLevel: 'disagree'`), and chapter 60
("if she/he loves you") conflicts (`favourable` vs. `unfavourable` —
`ConsensusLevel: 'conflict'`, `overallResult: 'mixed'`).

See `lib/raml/engine/__tests__/questions-stage4.test.ts` for the full
per-method, hand-verified test coverage, and `__tests__/audit-1-60.test.ts`
(renamed from `audit-1-40.test.ts`, generalized to run its structural/
consensus/descriptive-integrity checks against every registered question,
chapters 1-60 together) for the full regression audit.

## Totals (as of this stage — Stage 4 / Prompt 5, chapters 41-60)

| | Count |
|---|---|
| Total source chapters (Kanzul Mikban, numbered 1-153) | 153 |
| Numbered chapters reviewed and entered into this engine | 60 (chapters 1-19, 20-32, 34-45, 47-55, 57-58, 60 — chapters 33, 46, 59 reviewed but out of scope/not computable, see below) |
| Numbered chapters not yet reviewed | 93 (chapters 61-153) |
| Unnumbered sub-chapters/continuations reviewed this stage | 2 (the "Additional Methods — pregnant" fragment — 2 of its 3 methods registered under ch.47; the "Consequence of Friendship" fragment — not registered, out of numbered scope) |
| Questions registered in `QUESTION_REGISTRY` | **57** |
| Total methods across all registered questions | 111 |
| **Verified** (computed automatically, count toward the result — includes descriptive verdicts) | **89** |
| **Needs review** (calculable, but the rule itself is genuinely ambiguous) | **6** |
| **Uncertain** (not computable — almost always omitted source figures) | **16** |
| Automated tests covering this engine | 819 (all passing) |

### Stage 1+2 (chapters 1-19) subtotal — unchanged since Prompt 2

| | Count |
|---|---|
| Chapters | 19 |
| Methods | 48 |
| Verified | 35 |
| Needs review | 2 |
| Uncertain | 11 |

### Stage 3 (chapters 20-40) subtotal — Prompt 4 + 4.5

| | Count |
|---|---|
| Numbered/sub- chapters reviewed | 23 (20, 21, the unnumbered "good to stay in a house", 22-32, 33, 34-40, plus 2 unnumbered Ch.28 continuation fragments) |
| Questions registered | 21 |
| Methods | 37 |
| Verified (includes 3 descriptive verdicts: chs. 23, 31, 36 — see Prompt 4.5 above) | 31 |
| Needs review | 1 |
| Uncertain | 5 |
| Not registered at all (no computable shape, or architecturally out of scope) | 3 (chapter 33; both Ch.28 continuation fragments) |

### Stage 4 (chapters 41-60) subtotal — Prompt 5

| | Count |
|---|---|
| Numbered/unnumbered items reviewed | 22 (41-60, plus the two unnumbered fragments after ch.52 and ch.56) |
| Questions registered | 17 |
| Methods (registered only) | 26 |
| Verified (includes 8 descriptive verdicts: chs. 47(x2 counted methods)/49/53/54/55/57/58(x2)/48 — see per-chapter table) | 23 |
| Needs review (all 3: the unsourced figure-gender classification — ch.41 M1, ch.48 M1/M2) | 3 |
| Uncertain (method status) | 0 |
| Not registered at all (no computable shape, or out of this stage's numbered scope) | ch.46 (1 method — talismanic ritual, diagram omitted), ch.59 (3 methods — open-ended/non-deterministic or not chart-derived), unnumbered "Consequence of Friendship" fragment (1 method — fully computable, no chapter number), unnumbered fragment's Method 3 (1 method — baby-sex-by-star-gender, same unsourced-gender gap as ch.48) |

## Implemented, by chapter

_A "Verified" count below includes descriptive verdicts (chs. 23, 31, 36 — see "Prompt 4.5" above)._

| Ch. | Question (intention id) | Methods | Verified | Needs review | Uncertain |
|---|---|---|---|---|---|
| 1 | `traveling-business-and-if-you-will-return-from` | 3 | 2 | 1 | 0 |
| 2 | `if-you-want-to-know-if-you-will` (money today) | 4 | 3 | 0 | 1 |
| 3 | `business-profit-and-loss` | 3 | 2 | 1 | 0 |
| 4 | `hunting-in-water-and-on-land-and-searching` | 1 | 0 | 0 | 1 |
| 5 | `if-you-will-win-a-fight-war-or` (H6/H1+H8 variant) | 2 | 0 | 0 | 2 |
| 6 | `if-you-want-to-know-where-your-enemy` | 1 | 0 | 0 | 1 |
| 7 | `marriage-and-its-blessings` | 4 | 3 | 0 | 1 |
| 8 | `if-one-will-stay-in-a-particular-place` | 1 | 1 | 0 | 0 |
| 9 | `sickness-if-he-she-will-survive` | 3 | 2 | 0 | 1 |
| 10 | `if-your-lost-thing-is-still-around-or` | 5 | 5 | 0 | 0 |
| 11 | `if-you-want-to-know-if-you-will-2` (home vs. travel) | 2 | 2 | 0 | 0 |
| 12 | `if-you-want-to-know-if-you-will-3` (rich or not) | 1 | 1 | 0 | 0 |
| 13 | `if-you-will-get-children-from-a-lady` | 5 | 4 | 0 | 1 |
| 14 | `if-a-pregnancy-is-going-to-be-stable` | 1 | 1 | 0 | 0 |
| 15 | `if-things-will-be-better-for-the-questioner` | 1 | 1 | 0 | 0 |
| 16 | `if-you-will-overcome-your-enemy-or-not` | 2 | 2 | 0 | 0 |
| 17 | `if-something-will-happen-in-an-hour-day` (timing) | 2 | 0 | 0 | 2 |
| 18 | `if-you-will-get-your-stolen-things-back` (Part B only) | 3 | 3 | 0 | 0 |
| 19 | `if-you-will-win-a-case-in-court` | 4 | 3 | 0 | 1 |
| **Subtotal (1-19)** | | **48** | **35** | **2** | **11** |
| 20 | `who-will-win-an-election-or-a-chieftaincy` | 2 | 2 | 0 | 0 |
| 21 | `if-your-wife-or-sister-has-had-sex` | 3 | 1 | 1 | 1 |
| — | `if-it-s-good-to-stay-in-a` (unnumbered, between 21-22) | 3 | 3 | 0 | 0 |
| 22 | `if-it-s-good-to-stay-in-a-2` | 2 | 2 | 0 | 0 |
| 23 | `is-there-much-trees-water-sand-or-stones` (descriptive) | 1 | 1 | 0 | 0 |
| 24 | `if-you-will-be-safe-entering-a-canoe` | 2 | 2 | 0 | 0 |
| 25 | `if-there-are-armed-robbers-on-your-way` | 1 | 1 | 0 | 0 |
| 26 | `if-there-will-be-a-fight-argument-etc` | 1 | 0 | 0 | 1 |
| 27 | `about-farming-and-food-in-the-year` | 2 | 0 | 0 | 2 |
| 28 | `if-you-will-get-money-or-good-strangers` | 1 | 1 | 0 | 0 |
| 28→ | Two "gift/visitor figure" continuation fragments | — | not registered | — | — |
| 29 | `if-you-will-be-successful-where-you-are` | 1 | 1 | 0 | 0 |
| 30 | `if-you-will-be-successful-and-get-what` | 1 | 1 | 0 | 0 |
| 31 | `about-a-lost-thing-stolen-things` (descriptive) | 1 | 1 | 0 | 0 |
| 32 | `if-it-will-rain-today-or-not` | 4 | 4 | 0 | 0 |
| 33 | *(cast-out-by-4s dot-line method)* | — | not registered | — | — |
| 34 | `if-your-enemies-are-working-against-you-or` | 2 | 2 | 0 | 0 |
| 35 | `if-your-family-is-doing-well-while-you` | 1 | 1 | 0 | 0 |
| 36 | `if-you-want-to-locate-someone-or-something` (descriptive) | 1 | 1 | 0 | 0 |
| 37 | `how-to-predict-a-game-who-will-win` | 2 | 1 | 0 | 1 |
| 38 | `if-two-lovers-will-be-compatible-for-marriage` | 2 | 2 | 0 | 0 |
| 39 | `if-your-visitor-or-the-person-that-comes` | 2 | 2 | 0 | 0 |
| 40 | `if-spiritual-work-you-want-to-do-for` | 2 | 2 | 0 | 0 |
| **Subtotal (20-40)** | | **37** | **31** | **1** | **5** |
| 41 | `the-person-that-took-an-item-stole-something` | 2 | 1 | 1 | 0 |
| 42 | `if-you-will-get-what-you-want-from` | 2 | 2 | 0 | 0 |
| 43 | `the-real-behavior-character-or-life-of-someone` | 1 | 1 | 0 | 0 |
| 44 | `if-a-lady-or-man-will-accept-your` | 1 | 1 | 0 | 0 |
| 45 | `if-you-will-get-the-lost-thing-back` | 1 | 1 | 0 | 0 |
| 46 | *(talismanic ritual — diagram omitted, not a chart-verdict method)* | — | not registered | — | — |
| 47 | `if-a-lady-is-pregnant-or-not` (descriptive; incl. 2 methods from the unnumbered "pregnant" fragment) | 4 | 4 | 0 | 0 |
| 48 | `if-it-s-a-male-or-female-child` (descriptive; incl. 1 method from ch.56) | 3 | 1 | 2 | 0 |
| 49 | `if-something-is-closer-to-you-or-far` (descriptive) | 1 | 1 | 0 | 0 |
| 50 | `if-you-will-get-gold-in-a-place` | 1 | 1 | 0 | 0 |
| 51 | `if-things-are-going-to-be-well-this` | 1 | 1 | 0 | 0 |
| 52 | `the-friendship-between-two-people-if-it-s` | 1 | 1 | 0 | 0 |
| 52→ | "Consequence of Friendship" (unnumbered fragment) | — | not registered | — | — |
| 53 | `if-a-querent-is-asking-about-someone-or` (descriptive) | 1 | 1 | 0 | 0 |
| 54 | `where-your-success-is-or-where-you-will` (descriptive) | 1 | 1 | 0 | 0 |
| 55 | `the-whereabouts-of-a-thief-or-robbers` (descriptive) | 1 | 1 | 0 | 0 |
| 56 | *(own intention not registered — its 1 verified method is `child-gender-method-3`, folded into ch.48 above)* | — | see ch.48 | — | — |
| 57 | `when-to-travel-daytime-or-night-time` (descriptive) | 1 | 1 | 0 | 0 |
| 58 | `if-couples-have-had-sex-or-not` (descriptive) | 2 | 2 | 0 | 0 |
| 59 | *(open-ended/non-deterministic or not chart-derived — see "Architectural gaps")* | — | not registered | — | — |
| 60 | `if-she-he-loves-you-or-not` | 2 | 2 | 0 | 0 |
| **Subtotal (41-60)** | | **26** | **23** | **3** | **0** |
| **Grand total (1-60)** | | **111** | **89** | **6** | **16** |

## Architectural gaps (Stage 3)

**Resolved by Prompt 4.5.** Chapters 23 (terrain type), 31 (lost/stolen
thing), and 36 (locate someone/something) each produce a real, fully
mechanical, unambiguous calculation whose *answer* is descriptive (an
element, a compass direction, a thief's gender + rough distance) rather than
favourable/unfavourable. These were previously logged as `needs_review`
because the engine's `MethodOutcome` vocabulary had no honest way to
represent "the answer is water" — that was a result-*type* gap, not a
source ambiguity. Prompt 4.5 closed it by adding a genuine third
`MethodOutcome`, `'descriptive'` (with its own `descriptiveAnswer` field and
its own agree/disagree comparison model, `compareDescriptiveResults`, rather
than overloading the favourable/unfavourable tally). All three chapters are
now `status: 'verified'`, `outcome: 'descriptive'`, `resultKind:
'descriptive'` — no source rule changed, only how an already-correct answer
is represented and displayed. See the "Prompt 4.5" section above.

The remaining gaps below were reviewed under Prompt 4.5's explicit
architectural taxonomy and are still gaps — nothing here was implemented,
guessed, or forced into the existing model:

- **A.** Can the current architecture (ChartModel + operations.ts +
  QuestionDefinition/consensus model) support this once the source is
  known?
- **B.** Does it need better result semantics (a new `MethodOutcome` /
  `resultKind`, beyond what Prompt 4.5 just added)?
- **C.** Does it need a new generic operations.ts primitive?
- **D.** Does it need source verification (a figure/token the transcription
  omitted)?
- **E.** Does it need a genuinely different casting/input mechanism (data
  the current 16-house chart doesn't carry)?

| Chapter | Blocker | A | B | C | D | E |
|---|---|---|---|---|---|---|
| 26 (fight/argument) | Every branch depends on named figures the transcription omitted or dropped entirely | — | — | — | **Yes** — this is the entire blocker | No |
| 27, Methods 1-2 (farming/harvest) | Every directional/elemental branch's figure tokens omitted | — | — | — | **Yes** — this is the entire blocker | No |
| 28 (2 continuation fragments) | Every branch's figure identifier dropped entirely; not even which figure means what is recoverable | — | — | — | **Yes**, and worse than the others above: no partial reconstruction is possible from context | No |
| 33 ("cast out by 4s" line mechanic) | Not a chart-derived rule at all — a separate divination technique | No — nothing to compute from a `ChartModel`, because the input isn't a 16-house chart | No — this isn't a result-representation problem | Possibly, once understood (see below) | Yes — need the full mechanic described, ideally with worked examples | **Yes** — needs its own input/casting path, entirely separate from `casting.ts` |
| 37, Method 2 | Decided by which physical side (right/left) of the *drawn* chart a figure lands on | No — `ChartModel` carries house number → figure only, no left/right layout | No — a `'descriptive'` or new outcome value doesn't help; the blocker is upstream, at input, not at output | Not on its own — a primitive can't invent geometry that isn't in the model | No — the rule text itself is understood; nothing is omitted | **Yes** — needs a spatial/layout data model (see below) |

### Chapter 33 — documented, not implemented

Per the source ("make a long line, cast out 4s, repeat for four lines until
each is reduced to 1-4 dots"), this is a distinct, self-contained
arithmetic procedure: it consumes a hand-count (a total tapped or drawn by
the querent) and reduces it mod 4 (mapping a 0 remainder to 4), four times,
to produce its own 4-line figure — it never reads from, and has no
dependency on, the 16-house chart `casting.ts` builds. If the mechanic is
ever fully verified against the source, it could become a **new, separate,
deterministic module** (e.g. `lib/raml/engine/castOutFours.ts`) with its own
pure function `(counts: number[]) => Figure`-shaped calculation, its own
`QuestionDefinition`-like wrapper, and its own minimal input UI (four
numeric taps) — entirely additive, requiring no change to `casting.ts`,
`chartModel.ts`, or any existing question. This is a plan for *if* the
mechanic is confirmed, not an implementation; nothing has been built for
it, per the explicit instruction not to implement it this stage.

### Chapter 37, Method 2 — missing data model, not guessed

The rule as transcribed decides its verdict by which side of the physically
*drawn* chart (traditionally arranged as a diagram, not a flat list of 16
houses) a given figure falls on — a right/left split that depends on the
diagram's spatial layout convention. `ChartModel` (via `casting.ts`) only
ever exposes "house N → figure"; it has no left/right, no adjacency-by-page-
position, no notion of a drawn diagram at all. Missing, specifically:

- Which of the 16 houses fall on the "right" vs. "left" half of the
  traditional diagram (this is a fixed convention in the source tradition,
  not something derivable from the figures themselves).
- Confirmation that "side" means the same thing in every classical layout
  convention (some traditions mirror the diagram; guessing which one this
  source uses would be inventing a rule).

No spatial model was invented to fill this gap. If the existing chart
already contained enough information, house-number parity or grouping could
prove it with a test against the source's worked example — no such example
survives in the transcribed material, so nothing was assumed and no such
test could be written.

Chapter 34, Method 1 needed one new primitive, `RECAST_FROM_HOUSES`
(`operations.ts`): a known classical technique of treating 4 named houses'
own figures as fresh Mothers and deriving an entirely new 16-house chart
from them (via the existing, untouched `buildChart`/`buildChartModel`).
Chapters 20/22 needed `COUNT_FORTUNE`/`COUNT_DIRECTION` (whole-chart quality
tallies, same optional-houseNumbers shape as `COUNT_ELEMENTS`); chapter 32
needed `CHECK_FIGURE_ADJACENT_REPETITION`/`CHECK_ELEMENT_ADJACENT_REPETITION`
("X follows X" positional checks); chapter 35 needed `CHECK_FIGURE_PRESENT_IN_CHART`
extended with an optional house-subset parameter (backward compatible,
mirrors `COUNT_ELEMENTS`'s existing shape). No other new primitives were
required — everything else composes from what Prompts 1-2 already built.

## Architectural gaps (Stage 4 — Prompt 5, chapters 41-60)

Reviewed under the same A-E taxonomy as Stage 3 above. Nothing here was
implemented, guessed, or forced into the existing model.

| Chapter | Blocker | A | B | C | D | E |
|---|---|---|---|---|---|---|
| 41 Method 1, 48 Methods 1-2 | Hinges on classifying a figure directly as a "male star"/"female star" | No — `ChartModel`/`FigureQualities` carries no verified gender axis (`gender` is always `needs_review`, project-wide, since types.ts was first written — not new to this stage) | No — a new result kind doesn't create the missing classification | No — a primitive can't invent a table that doesn't exist | **Yes** — need the source (this chapter or elsewhere in the manuscript) to actually define which of the 16 figures are male vs. female | No |
| 46 (talismanic ritual) | Not a chart-*reading* method at all — "mix h12 inside h11 on paper, fold it, put a stone on it," referencing a named talismanic diagram the transcription dropped | No — nothing here produces a verdict to compute; it's a physical-practice instruction, not a rule with branches | No — there is no answer shape to represent, descriptive or otherwise | No | **Yes** — the diagram itself is omitted (`[talismanic diagram in the original — not reproduced here]`) | **Yes** — even with the diagram, this is a "make and place a talisman" practice, not a `ChartModel` → verdict computation; it would need its own non-reading UI, not a `QuestionDefinition` |
| 59 (secret of the querent) | Methods 1 and 3 say "use whatever star you get to talk to the person" / "add Yusuf to any star found in a house" with no defined branch structure; Method 2 has the querent freely pick a star with no chart computation at all | No — none of the three methods define a determinate verdict a rule engine can evaluate | **Partially** — even a descriptive result needs a *defined* answer shape; "whatever you get, interpret freely" isn't one | No — a primitive computes a fixed operation, not open-ended human interpretation | No — nothing is omitted; the ambiguity is in the method's own open-ended design, not a transcription gap | No — Method 1's calculation (H1+H5+H9+H13) is a normal `ChartModel` operation; it's the *verdict* step that has no fixed shape, not the input mechanism |
| Unnumbered "Consequence of Friendship" fragment (after ch.52) | Not a blocker at all — fully computable (H1+H3, good/bad) | **Yes** | — | — | — | — |

The friendship fragment is the one item in this table that is *architecturally* ready to register — it was left out only because it carries no chapter number and Prompt 5 scoped this stage to numbered chapters 41-60. It is a natural candidate for a future stage once its numbering (or lack of it) is resolved against the source.

The male/female-star gender gap (chapter 41 Method 1, chapter 48 Methods
1-2, and the pregnancy fragment's own Method 3 — predicting the baby's sex
the same way) is the single largest recurring blocker this stage, appearing
independently in 3 different chapters/fragments. It is not a per-chapter
oversight: this project's `FigureQualities.gender` axis has been
architecturally `needs_review` since Prompt 1 (see types.ts), because no
chapter reviewed so far (1-60) ever tabulates which of the 16 figures are
traditionally male vs. female — every occurrence where a chapter's own text
needed "male/female" was only computable when that SAME chapter redefined
it via an already-verified axis (chapter 31's fire/air=male, water/sand=
female, stated explicitly in its own source text). Chapters 41/48/56's
fragment never redefine it that way — they just say "male star"/"female
star" as if the classification is already known. Resolving this for good
would need either (a) a later chapter in the source that tabulates it
directly, or (b) an explicit product decision to adopt classical geomancy's
general male/female figure convention as a labeled, sourced-from-tradition
axis (the same pattern this project already uses for Fortune/Direction via
`content/classicalAttributes.ts`) — which Prompt 5 explicitly did not
authorize ("do NOT use general geomancy knowledge to fill gaps"), so it
was not done here.

## Needs review (calculable, rule ambiguous)

- **Chapter 1, Method 3** (travel) — the deciding rule classifies the final
  figure as a whole "single-dot star" or "double-dot star"; this project
  only has a verified opened/closed definition per *line*, not for a whole
  4-line figure. The four-element extraction itself is computed and shown;
  the verdict is withheld.
- **Chapter 3, Method 3** (business) — "check H2 and H6 — if both are bad,
  X; if it's a good star, Y" never says what a split or middle-good pair
  means. Both houses are shown; only the two unambiguous cases (both bad,
  both good) resolve, everything else is honestly `uncertain` for that
  chart.
- **Chapter 21, Method 1** (wife/sister had sex) — decides the verdict by
  classifying the WHOLE resulting figure as "opened" or "closed"; this
  project only has a verified opened/closed definition per individual line,
  not for a whole 4-line figure — same unresolved gap as Chapter 1, Method 3
  above.
- **Chapter 41, Method 1** (who took the item) — classifies H1 directly as
  a "male star" or "female star"; this specific chapter never defines which
  figures are male/female, and this project's general figure-gender axis is
  intentionally unsourced project-wide. See "Architectural gaps (Stage 4)"
  above for the full reasoning shared with the next entry.
- **Chapter 48, Methods 1-2** (male or female child) — same unsourced
  figure-gender gap as Chapter 41, Method 1, applied to H1 alone and to
  H10+H11 needing to match each other. The question still resolves via
  Chapter 56's independently-computable dot-arithmetic method (see
  `childGender.ts`).
## Uncertain (not computable — source passages needing manual verification)

Every one of these depends on named or hand-drawn figures the PDF
transcription marked `[figures omitted — symbols not preserved]`, except
where noted:

- Chapter 2, Method 4 (Sirri Sa'ael/Damir) — also has no defined computation
  anywhere in this project for what "Sirri Sa'ael" itself derives from, on
  top of the omitted figure list.
- Chapter 4, Method 1 (H10 figure list)
- Chapter 5, Methods 1-2 (H6 figure list; H1+H8 figure list)
- Chapter 6, Method 1 (H4/H10 figure list)
- Chapter 7, Method 4 (H7 figure list — repeated "If it's," with the figure
  never named for any branch)
- Chapter 9, Method 3 (H6 healing/non-survival figure lists)
- Chapter 13, Method 3 (H5 figure list, five branches)
- Chapter 17, Methods 1-2 (figure lists for both; Method 2's one seemingly
  independent trailing sentence still refers back to the omitted material,
  so it can't be isolated as its own rule)
- Chapter 19, Method 3 (named figures deciding H4/H10 vs. H5/H11)
- Chapter 21, Method 3 (H7 figure lists, both branches)
- Chapter 26 (fight/argument) — every branch (h1/h2, Sirri Sa'ael, h8, h12,
  h9's own "peace" branch, h14) depends on named figures the transcription
  omitted or dropped entirely; nothing in this chapter is computable.
- Chapter 27, Methods 1-2 (farming/harvest) — every branch (stars of the
  East/West/North/South; fire/air/water/sand "stars") depends on named
  figures the transcription omitted; nothing in this chapter is computable.
- Chapter 37, Method 2 — architectural gap (no left/right spatial layout),
  not an omitted figure; see "Architectural gaps" above.

None of these were guessed at. If the original manuscript pages ever surface
with these figures legible, each one becomes a small, mechanical change —
replace the `status: 'uncertain'` method with a real `evaluate()`, following
the pattern already used by every verified method in the same file.

## Source-verification queue

Items a human with access to the original, unredacted manuscript could
resolve, listed plainly rather than buried in code comments (Prompt 4,
section 17):

| Chapter — Method | Issue |
|---|---|
| Ch.2, Method 4 | Sirri Sa'ael figure list omitted; "Sirri Sa'ael" itself also has no defined computation anywhere in this project |
| Ch.4, Method 1 | H10 figure list omitted |
| Ch.5, Methods 1-2 | H6 figure list omitted; H1+H8 figure list omitted |
| Ch.6, Method 1 | H4/H10 figure list omitted |
| Ch.7, Method 4 | H7 figure list omitted (repeated "If it's," with no figure named) |
| Ch.9, Method 3 | H6 healing/non-survival figure lists omitted |
| Ch.13, Method 3 | H5 figure list omitted (five branches) |
| Ch.17, Methods 1-2 | Figure lists omitted for both |
| Ch.19, Method 3 | Named figures deciding H4/H10 vs. H5/H11 omitted |
| Ch.21, Method 1 | Ambiguous wording — "opened/closed star" for a whole figure, not a line (architectural, not an omission) |
| Ch.21, Method 3 | Both branches' figures omitted |
| Ch.26 | Figure tokens omitted or dropped for every branch, including the H9 "peace" branch |
| Ch.27, Methods 1-2 | Figure tokens omitted for every directional/elemental branch |
| Ch.28 (2 continuation fragments) | Every branch's figure identifier was dropped entirely — not even which figure means what is recoverable; not registered at all |
| Ch.30 | Two named-figure branches ("profit but not stable"; "profit but very sick") omitted — not implemented, only the direction-based primary rule is |
| Ch.33 | Uses a separate dot-line "cast out by 4s" mechanic, not the 16-house chart — architectural, needs a product decision (new input UI) rather than a source fix |
| Ch.37, Method 2 | Needs a defined left/right spatial convention for the chart — architectural, needs a product/source decision |
| Ch.41 Method 1, Ch.48 Methods 1-2, "pregnant" fragment Method 3 | All hinge on a "male star"/"female star" figure classification no chapter reviewed so far (1-60) actually tabulates — architectural (this project's general figure-gender axis is intentionally unsourced), needs either a later chapter that defines it or an explicit product decision to adopt a sourced classical-tradition table (see "Architectural gaps (Stage 4)") |
| Ch.46 | Talismanic diagram omitted ("[talismanic diagram in the original — not reproduced here]"); also architectural — even with the diagram, this is a ritual-practice chapter, not a chart-verdict method |
| Ch.58 vs. Ch.21 consistency | Ch.58 ("couples had sex") uses the new `resultKind: 'descriptive'` treatment; Ch.21's structurally identical question (wife/sister had sex) still uses the older favourable=yes/unfavourable=no treatment from before Prompt 4.5 existed — not a source issue, a product decision on whether to migrate Ch.21 for consistency in a future stage |

## Not yet implemented

Chapters 61-153 (93 numbered chapters) have not been read for this
structured engine yet. `lib/raml/methodVerdicts.ts`'s general parser
already covers some of that material with lighter-weight automatic
verdicts (no audit trail, no cross-method consensus) — see its own file
header for current numbers. Extending this engine further means repeating
the same process: read the chapter's actual text, write one file in
`lib/raml/engine/questions/`, register it in `questions/index.ts`, add
tests, run the full suite, and update this table — the same shape as every
chapter above, chapter by chapter, in order.

## Confirmation

The original casting engine (`lib/raml/casting.ts` — Mother/Daughter/Niece/
Witness/Judge/Reconciler generation) was not touched in this stage or in
Prompt 4.5, nor was `chartModel.ts`, or any chapter 1-19 question file.
`operations.ts` was extended only additively in Prompt 4: one genuinely new
primitive (`RECAST_FROM_HOUSES`) plus four small quality/adjacency tallies
(`COUNT_FORTUNE`, `COUNT_DIRECTION`, `CHECK_FIGURE_ADJACENT_REPETITION`,
`CHECK_ELEMENT_ADJACENT_REPETITION`), and one existing function
(`CHECK_FIGURE_PRESENT_IN_CHART`) gained a backward-compatible optional
parameter, same shape `COUNT_ELEMENTS` already had. Every pre-existing
pilot question (chapters 1-19) produces byte-identical results on the same
fixture chart as before this stage — their own test files
(`__tests__/questions.test.ts`, `__tests__/questions-stage2.test.ts`) are
unchanged in their original assertions and still pass, alongside a new,
explicit structural audit (`__tests__/audit-1-40.test.ts`) checking for
duplicate question ids, broken chapter references, and any needs_review/
uncertain method leaking into a consensus count, across all 40 registered
questions at once.

**Prompt 4.5, honestly:** unlike Prompt 4, this stage did touch
`ruleEngine.ts` and `operations.ts` again, plus `types.ts` and `reading.ts`
(and three UI components) — but only for result-*type* plumbing, never for
a source rule. `ruleEngine.ts` gained one new branch in
`deriveOverallResult` (`if (consensus.kind === 'descriptive') return
'descriptive'`) and its `runQuestion` now passes `question.resultKind` into
`COMPARE_RESULTS`; `operations.ts`'s `COMPARE_RESULTS` gained an optional
`resultKind` parameter and a new `compareDescriptiveResults` helper,
purely additive and defaulting to the exact prior outcome-model behavior
when omitted. No calculation, no source figure, and no verdict for any of
the chapters 1-40 changed as a result — chapters 23/31/36 compute exactly
the same value as before; only their `status` (`needs_review` →
`verified`) and how that value is labeled and displayed changed, because
the old `needs_review` status was itself the bug being fixed (a
mislabeling of a real, unambiguous, verified computation as "unverified").
No new source rule was invented anywhere in this stage, and no chapter
outside 20-40 was touched.

**Prompt 5, honestly:** `casting.ts`, `chartModel.ts`, `ruleEngine.ts`,
`types.ts`, `reading.ts`, `interpretation.ts`, and every chapter 1-40
question file are all completely untouched this stage — the entire
`resultKind: 'descriptive'` machinery Prompt 4.5 built was reused exactly
as-is, with zero changes needed to support chapters 41-60. `operations.ts`
gained exactly two new, genuinely generic primitives: `COUNT_TOTAL_DOTS`
(whole-chart or house-subset raw dot sum) and `CAST_OUT_BY` (reduce a
positive count into 1..n by repeated subtraction — the manuscript's own
named "cast out by N" technique, kept reusable rather than inlined once
into chapter 56's file). Both are pure, deterministic, unit-tested, and
used by exactly one question this stage (`childGender.ts`) — no other
chapter 41-60 method needed a new primitive; everything else composed from
`ADD_MULTIPLE_HOUSES`, `ADD_FIGURE_TO_HOUSE`, `CHECK_HOUSE`,
`CHECK_ELEMENT`, `CHECK_DIRECTION`, `CHECK_LINE_STATE`,
`CHECK_FIGURE_PRESENT_IN_CHART`, `COUNT_ELEMENTS`, and `MATCH_FIGURE` —
all pre-existing. `__tests__/audit-1-40.test.ts` was renamed to
`audit-1-60.test.ts` and its per-question structural/consensus checks now
run against all 57 registered questions (not just 40), plus two new
describe blocks checking descriptive/outcome result-kind integrity
end-to-end. Every pre-existing question (chapters 1-40) produces
byte-identical results on the same fixture chart as before this stage;
their own test files are unchanged in their original assertions and all
still pass. No new source rule was invented anywhere in this stage, and no
chapter outside 41-60 was implemented (chapters 33/46/59 and the two
unnumbered fragments were reviewed, per Prompt 5's own instruction to
document rather than implement architectural gaps, but nothing was coded
for them).
